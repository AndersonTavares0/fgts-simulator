import 'fake-indexeddb/auto';
import { openDB } from 'idb';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { simulate } from '../../src/application/Simulation';
import type { SimulationSnapshot } from '../../src/application/Simulation';
import { TipoContrato, TipoRescisao } from '../../src/core/types';
import {
  clearSimulations,
  deleteSimulation,
  listSimulations,
  saveSimulation,
} from '../../src/adapters/history/HistoryAdapter';

function snapshot(
  id = 'original',
  terminationType = TipoRescisao.DISPENSA_SEM_JUSTA_CAUSA,
): SimulationSnapshot {
  return {
    ...simulate({
      salaryCents: '350001',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      terminationType,
      contractType: TipoContrato.CLT_PADRAO,
      include13: true,
      includeVacation: true,
      thirteenthMonths: 5,
      vacationMonths: 3,
      birthdayWithdrawal: false,
      trMonthly: '0.0008',
      ipcaMonthly: '0.0045',
      scenario: 'TR',
    }),
    id,
    createdAt: '2025-01-01T12:00:00.000Z',
    calculationVersion: '1.0.0',
    appVersion: '1.0.0',
  };
}

beforeEach(clearSimulations);
afterEach(clearSimulations);

describe('Histórico IndexedDB com transações reais', () => {
  it('confirma a transação e preserva integralmente o documento original', async () => {
    const original = snapshot();
    await saveSimulation(original);
    const database = await openDB('fgts-simulator-history', 1);
    try {
      expect(await database.get('simulations', original.id)).toEqual(original);
      expect((await listSimulations()).snapshots).toEqual([original]);
    } finally {
      database.close();
    }
  });

  it('lista do mais recente para o antigo, atualiza por ID, exclui e limpa', async () => {
    const older = snapshot('antiga');
    const newer = { ...snapshot('recente'), createdAt: '2026-01-01T12:00:00.000Z' };
    await saveSimulation(newer);
    await saveSimulation(older);
    expect((await listSimulations()).snapshots.map((item) => item.id)).toEqual([
      'recente',
      'antiga',
    ]);
    const updated = { ...older, warnings: ['Aviso original atualizado explicitamente.'] };
    await saveSimulation(updated);
    expect((await listSimulations()).snapshots).toEqual([newer, updated]);
    await deleteSimulation('recente');
    expect((await listSimulations()).snapshots).toEqual([updated]);
    await clearSimulations();
    expect((await listSimulations()).snapshots).toEqual([]);
  });

  it('exige consentimento explícito para saúde a cada gravação, inclusive após carregar', async () => {
    const sensitive = snapshot('saude', TipoRescisao.DOENCA_GRAVE);
    await expect(saveSimulation(sensitive)).rejects.toThrow(/Autorize explicitamente/);
    await expect(saveSimulation(sensitive, false)).rejects.toThrow(/Autorize explicitamente/);
    expect((await listSimulations()).snapshots).toEqual([]);
    await saveSimulation(sensitive, true);
    const [loaded] = (await listSimulations()).snapshots;
    expect(loaded).toEqual(sensitive);
    if (!loaded) throw new Error('Registro de saúde não encontrado.');
    await expect(saveSimulation(loaded)).rejects.toThrow(/Autorize explicitamente/);
    expect((await listSimulations()).snapshots).toEqual([sensitive]);
  });

  it('rejeita entradas inválidas antes de gravar e não perde os dados existentes', async () => {
    const original = snapshot();
    await saveSimulation(original);
    const invalid = snapshot('invalida');
    invalid.input.salaryCents = 'NaN';
    await expect(saveSimulation(invalid, true)).rejects.toThrow(/inválida/);
    expect((await listSimulations()).snapshots).toEqual([original]);
  });

  it('captura os valores no momento de salvar, antes da abertura assíncrona do banco', async () => {
    const original = snapshot();
    const expected = structuredClone(original);
    const saving = saveSimulation(original);
    original.input.salaryCents = '100';
    original.warnings.push('Mutação posterior não deve entrar no registro.');
    await saving;
    expect((await listSimulations()).snapshots).toEqual([expected]);
  });

  it('mantém registros incompatíveis fora da lista sem apagar nem recalcular', async () => {
    const original = snapshot();
    await saveSimulation(original);
    const database = await openDB('fgts-simulator-history', 1);
    const corrupt = { ...snapshot('corrompida'), formatVersion: 999 };
    try {
      await database.put('simulations', corrupt);
      const read = await listSimulations();
      expect(read.snapshots).toEqual([original]);
      expect(read.skipped).toBe(1);
      expect(await database.get('simulations', corrupt.id)).toEqual(corrupt);
      expect(await database.get('simulations', original.id)).toEqual(original);
    } finally {
      database.close();
    }
  });

  it('fecha a conexão em versionchange e reabre após migração abortada por outra aba', async () => {
    const original = snapshot();
    await saveSimulation(original);
    const abortedTransactions: Promise<unknown>[] = [];
    await expect(
      openDB('fgts-simulator-history', 2, {
        upgrade(_db, _old, _next, transaction) {
          abortedTransactions.push(
            expect(transaction.done).rejects.toMatchObject({ name: 'AbortError' }),
          );
          transaction.abort();
        },
      }),
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(abortedTransactions).toHaveLength(1);
    await Promise.all(abortedTransactions);
    expect((await listSimulations()).snapshots).toEqual([original]);
  });
});
