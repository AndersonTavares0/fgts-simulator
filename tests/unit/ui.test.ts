import { describe, expect, it } from 'vitest';
import { TipoContrato, TipoRescisao } from '../../src/core/types';
import type { SimulationSnapshot } from '../../src/application/Simulation';
import { comparisonRows, inputRows } from '../../src/ui/presentation';
import { chartMax } from '../../src/ui/chartScale';
import { FormatAdapter } from '../../src/adapters/FormatAdapter';
import { draftFromInput, emptyDraft, toInput } from '../../src/ui/form';

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

  it('não expõe o formato interno do registro na comparação', () => {
    const first = snapshot();
    expect(
      comparisonRows(first, snapshot()).some(([label]) => label === 'Formato do registro'),
    ).toBe(false);
  });
});

describe('Eixo do gráfico', () => {
  it('cobre o IPCA quando ele supera a TR', () => {
    expect(
      chartMax([
        {
          competencia: '2025-01',
          depositosCents: '100000',
          trCents: '102000',
          ipcaCents: '110000',
        },
        {
          competencia: '2025-02',
          depositosCents: '200000',
          trCents: '205000',
          ipcaCents: '235000',
        },
      ]),
    ).toBe(2350);
  });

  it('mantém uma escala não nula com série zerada', () => {
    expect(
      chartMax([{ competencia: '2025-01', depositosCents: '0', trCents: '0', ipcaCents: '0' }]),
    ).toBe(1);
  });
});

describe('Data final do formulário', () => {
  it('rejeita o mesmo dia com a mensagem do domínio', () => {
    const result = toInput(
      { ...emptyDraft, salary: '1.000,00', startDate: '2026-01-01', endDate: '2026-01-01' },
      false,
    );
    expect('errors' in result ? result.errors.endDate : null).toBe(
      'A data final deve ser posterior à data de início.',
    );
  });
});

describe('Formatação de centavos', () => {
  it('mantém sinal, milhar e centavos com uma única implementação', () => {
    expect(FormatAdapter.amount('123456')).toBe('1.234,56');
    expect(FormatAdapter.amount('5')).toBe('0,05');
    expect(FormatAdapter.amount('-123456')).toBe('-1.234,56');
    expect(FormatAdapter.centsToBRL('-123456')).toBe('-R$ 1.234,56');
    expect(FormatAdapter.centsToBRL('0')).toBe('R$ 0,00');
  });
});

describe('FGTS sobre 13º no formulário', () => {
  it('reabre histórico antigo sem inventar remunerações e preserva a apresentação antiga', () => {
    const input = snapshot().input;
    const draft = draftFromInput(input);
    expect(draft.thirteenthMode).toBe('estimate');
    expect(draft.thirteenthEntries).toEqual([]);
    expect(inputRows(input)).toContainEqual([
      'FGTS sobre 13º',
      'Histórico anterior: sem dados de FGTS sobre 13º',
    ]);
  });

  it('agrupa parcelas por competência, ordena e reabre valores efetivos', () => {
    const draft = {
      ...emptyDraft,
      salary: '2.000,00',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      thirteenthMode: 'actual' as const,
      thirteenthEntries: [
        { competencia: '2025-12', remuneracao: '1.000,50' },
        { competencia: '2025-11', remuneracao: '500,00' },
        { competencia: '2025-12', remuneracao: '100,00' },
      ],
    };
    const result = toInput(draft, false);
    if (!('input' in result)) throw new Error('Entradas válidas foram rejeitadas');
    expect(result.input.thirteenthEntries).toEqual([
      { competencia: '2025-11', remuneracaoCents: '50000' },
      { competencia: '2025-12', remuneracaoCents: '110050' },
    ]);
    expect(draftFromInput(result.input).thirteenthEntries).toEqual([
      { competencia: '2025-11', remuneracao: '500,00' },
      { competencia: '2025-12', remuneracao: '1100,50' },
    ]);
    expect(inputRows(result.input)).toContainEqual([
      'Remunerações de 13º informadas',
      '11/2025: R$ 500,00; 12/2025: R$ 1.100,50',
    ]);
  });

  it('mantém valores zero e acima do limite salarial ao reabrir', () => {
    const input = {
      ...snapshot().input,
      thirteenthMode: 'actual' as const,
      thirteenthEntries: [
        { competencia: '2025-01', remuneracaoCents: '0' },
        { competencia: '2025-02', remuneracaoCents: '100000001' },
      ],
    };
    const result = toInput(draftFromInput(input), false);
    expect(result).toHaveProperty('input.thirteenthEntries', input.thirteenthEntries);
  });

  it('rejeita competência fora do período e valor inválido', () => {
    const draft = {
      ...emptyDraft,
      salary: '2000',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      thirteenthMode: 'actual' as const,
      thirteenthEntries: [{ competencia: '2026-01', remuneracao: '100' }],
    };
    expect(toInput(draft, false)).toHaveProperty('errors.thirteenthEntries');
    expect(
      toInput(
        {
          ...draft,
          thirteenthEntries: [{ competencia: '2025-01', remuneracao: 'invalido' }],
        },
        false,
      ),
    ).toHaveProperty('errors.thirteenthEntries');
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
