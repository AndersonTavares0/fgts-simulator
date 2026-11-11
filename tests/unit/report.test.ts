import { describe, expect, it } from 'vitest';
import { simulate } from '../../src/application/Simulation';
import type { SimulationInput } from '../../src/application/Simulation';
import { createReport } from '../../src/adapters/reports/PdfAdapter';
import { totalCaption } from '../../src/ui/presentation';
import { TipoContrato, TipoRescisao } from '../../src/core/types';

const INPUT: SimulationInput = {
  salaryCents: '300000',
  startDate: '2025-01-01',
  endDate: '2025-12-31',
  terminationType: TipoRescisao.DISPENSA_SEM_JUSTA_CAUSA,
  contractType: TipoContrato.CLT_PADRAO,
  include13: true,
  includeVacation: true,
  thirteenthMonths: 4,
  vacationMonths: 5,
  birthdayWithdrawal: false,
  trMonthly: '0.0008',
  ipcaMonthly: '0.004',
  scenario: 'TR',
};

async function pageCount(blob: Blob): Promise<number> {
  const text = await blob.text();
  return (text.match(/\/Type\s*\/Page\b/g) ?? []).length;
}

describe('relatório PDF', () => {
  it('gera um PDF A4 com os valores do snapshot', async () => {
    const snapshot = simulate(INPUT);
    const blob = await createReport(snapshot);
    expect(blob.type).toBe('application/pdf');
    const text = await blob.text();
    expect(text.startsWith('%PDF')).toBe(true);
    expect(await pageCount(blob)).toBe(1);
  });

  it('pagina contratos longos sem perder o total', async () => {
    const snapshot = simulate({ ...INPUT, startDate: '2021-01-01' });
    const blob = await createReport(snapshot);
    expect(await pageCount(blob)).toBeGreaterThan(1);
  });

  it('explica quando parte do saldo fica retida', () => {
    expect(totalCaption('0')).toBe('Saldo do FGTS + verbas da rescisão.');
    expect(totalCaption('120000')).toBe('Disponível para saque + verbas da rescisão.');
  });

  it('no saque-aniversário o total exclui o saldo retido', () => {
    const snapshot = simulate({ ...INPUT, birthdayWithdrawal: true });
    expect(snapshot.result.saldoRetidoCents).not.toBe('0');
    expect(BigInt(snapshot.result.saldoDisponivelCents)).toBeLessThan(
      BigInt(snapshot.result.saldoBaseCents),
    );
    expect(totalCaption(snapshot.result.saldoRetidoCents)).toContain('Disponível para saque');
  });

  it('na dispensa sem justa causa todo o saldo fica disponível', () => {
    const snapshot = simulate(INPUT);
    expect(snapshot.result.saldoRetidoCents).toBe('0');
    expect(snapshot.result.saldoDisponivelCents).toBe(snapshot.result.saldoBaseCents);
  });
});
