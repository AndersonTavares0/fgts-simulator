import { describe, expect, it } from 'vitest';
import { simulate } from '../../src/application/Simulation';
import type { SimulationInput } from '../../src/application/Simulation';
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

describe('relatório PDF', () => {
  it('explica quando parte do saldo fica retida', () => {
    const base = {
      saldoRetidoCents: '0',
      saldoDisponivelCents: '1000',
      multaCents: '100',
      decimoTerceiroCents: '0',
      feriasCents: '0',
    };
    expect(totalCaption(base)).toBe('Saldo do FGTS + verbas da rescisão.');
    expect(totalCaption({ ...base, saldoRetidoCents: '120000' })).toBe(
      'Disponível para saque + verbas da rescisão.',
    );
    expect(totalCaption({ ...base, multaCents: '0' })).toBe('Saldo do FGTS para saque.');
    expect(totalCaption({ ...base, saldoDisponivelCents: '0', saldoRetidoCents: '1000' })).toBe(
      'Verbas rescisórias; saldo retido no FGTS.',
    );
  });

  it('no saque-aniversário o total exclui o saldo retido', () => {
    const snapshot = simulate({ ...INPUT, birthdayWithdrawal: true });
    expect(snapshot.result.saldoRetidoCents).not.toBe('0');
    expect(BigInt(snapshot.result.saldoDisponivelCents)).toBeLessThan(
      BigInt(snapshot.result.saldoBaseCents),
    );
    expect(totalCaption(snapshot.result)).toContain('saldo retido no FGTS');
  });

  it('na dispensa sem justa causa todo o saldo fica disponível', () => {
    const snapshot = simulate(INPUT);
    expect(snapshot.result.saldoRetidoCents).toBe('0');
    expect(snapshot.result.saldoDisponivelCents).toBe(snapshot.result.saldoBaseCents);
  });
});
