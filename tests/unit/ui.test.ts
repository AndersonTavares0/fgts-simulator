import { describe, expect, it } from 'vitest';
import { TipoContrato, TipoRescisao } from '../../src/core/types';
import type { SimulationSnapshot } from '../../src/application/Simulation';
import { comparisonRows } from '../../src/ui/presentation';
import { FormatAdapter } from '../../src/adapters/FormatAdapter';

function snapshot(): SimulationSnapshot {
  return {
    formatVersion: 1,
    calculationVersion: 'old-rule',
    appVersion: '2.0.0',
    id: 'original',
    createdAt: '2026-01-01T12:00:00.000Z',
    input: {
      salaryCents: '200000',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      terminationType: TipoRescisao.DISPENSA_SEM_JUSTA_CAUSA,
      contractType: TipoContrato.CLT_PADRAO,
      include13: true,
      includeVacation: false,
      thirteenthMonths: 4,
      vacationMonths: 0,
      birthdayWithdrawal: false,
      trMonthly: '0.0008',
      ipcaMonthly: '0.004',
      scenario: 'TR',
    },
    result: {
      saldoBaseCents: '900',
      depositosCents: '1000',
      rendimentoCents: '-100',
      saldoDisponivelCents: '900',
      saldoRetidoCents: '0',
      multaCents: '400',
      decimoTerceiroCents: '100',
      feriasCents: '0',
      totalCents: '1400',
    },
    timeline: [
      { competencia: '2025-12', depositosCents: '1000', trCents: '900', ipcaCents: '800' },
    ],
    assumptions: [],
    warnings: [],
  };
}

describe('UI comparison of original snapshots', () => {
  it('compares stored outputs without recalculating or changing old rules and records changed inputs', () => {
    const first = snapshot();
    const second = structuredClone(first);
    second.calculationVersion = 'new-rule';
    second.input.scenario = 'IPCA';
    second.input.thirteenthMonths = 8;
    second.result.totalCents = '1200';
    second.result.rendimentoCents = '-300';
    const original = structuredClone(first);
    const rows = comparisonRows(first, second);
    expect(rows.some((row) => row[1] === 'old-rule' && row[2] === 'new-rule')).toBe(true);
    expect(
      rows.some(
        (row) =>
          row[1] === '4 avos ainda devidos' &&
          row[2] === '8 avos ainda devidos' &&
          row[3] === 'Alterado',
      ),
    ).toBe(true);
    expect(
      rows.some((row) => row[1] === 'R$ 14,00' && row[2] === 'R$ 12,00' && row[3] === '-R$ 2,00'),
    ).toBe(true);
    expect(
      rows.some((row) => row[1] === '-R$ 1,00' && row[2] === '-R$ 3,00' && row[3] === '-R$ 2,00'),
    ).toBe(true);
    expect(first).toEqual(original);
  });

  it('keeps cent precision when the comparison difference is positive', () => {
    const first = snapshot();
    const second = structuredClone(first);
    first.result.totalCents = '9007199254740000';
    second.result.totalCents = '9007199254740001';
    expect(comparisonRows(first, second).some((row) => row[3] === '+R$ 0,01')).toBe(true);
  });
});

describe('percentage input boundary', () => {
  it('converts fractional and negative rates exactly without binary arithmetic', () => {
    expect(FormatAdapter.rateFromPercent('0,08')).toBe('0.0008');
    expect(FormatAdapter.rateFromPercent('-0,000001')).toBe('-0.00000001');
  });
  it.each(['', ' ', '1.000,2', '1,2,3', '1e2', 'Infinity', 'NaN', '0.08abc'])(
    'rejects an ambiguous or non-decimal rate %s',
    (value) => {
      expect(FormatAdapter.rateFromPercent(value)).toBeNull();
    },
  );
});
