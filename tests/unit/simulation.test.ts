import { describe, expect, it, vi } from 'vitest';
import { isSimulationSnapshot, simulate } from '../../src/application/Simulation';
import type { SimulationInput, SimulationSnapshot } from '../../src/application/Simulation';
import { TipoContrato, TipoRescisao } from '../../src/core/types';

const INPUT: SimulationInput = {
  salaryCents: '300000',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  terminationType: TipoRescisao.DISPENSA_SEM_JUSTA_CAUSA,
  contractType: TipoContrato.CLT_PADRAO,
  include13: true,
  includeVacation: true,
  thirteenthMonths: 1,
  vacationMonths: 2,
  birthdayWithdrawal: false,
  trMonthly: '0',
  ipcaMonthly: '0',
  scenario: 'TR',
};

describe('simulate — documento financeiro único', () => {
  it('gera UUID v4 mesmo sem crypto.randomUUID (contexto não seguro)', () => {
    const real = globalThis.crypto;
    vi.stubGlobal('crypto', { getRandomValues: real.getRandomValues.bind(real) });
    try {
      expect(simulate(INPUT).id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      );
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('preserva entradas e séries mensais com endpoint exato para ambos os cenários', () => {
    for (const scenario of ['TR', 'IPCA'] as const) {
      const input = { ...INPUT, scenario, ipcaMonthly: '0.005' };
      const snapshot = simulate(input);
      expect(snapshot.timeline).toHaveLength(12);
      expect(snapshot.timeline[0]).toEqual({
        competencia: '2024-01',
        depositosCents: '24000',
        trCents: '24000',
        ipcaCents: '24000',
      });
      expect(snapshot.timeline.at(-1)![scenario === 'TR' ? 'trCents' : 'ipcaCents']).toBe(
        snapshot.result.saldoBaseCents,
      );
      expect(snapshot.result.depositosCents).toBe('288000');
      expect(snapshot.result.decimoTerceiroCents).toBe('25000');
      expect(snapshot.result.feriasCents).toBe('66667');
      expect(snapshot.input).toEqual(input);
      input.salaryCents = '400000';
      expect(snapshot.input.salaryCents).toBe('300000');
      expect(isSimulationSnapshot(snapshot)).toBe(true);
      expect(isSimulationSnapshot(JSON.parse(JSON.stringify(snapshot)))).toBe(true);
    }
  });

  it('não usa o IPCA maior como substituto automático de TR', () => {
    const tr = simulate({ ...INPUT, ipcaMonthly: '0.01' });
    const ipca = simulate({ ...INPUT, ipcaMonthly: '0.01', scenario: 'IPCA' });
    expect(tr.result.saldoBaseCents).toBe(tr.timeline.at(-1)!.trCents);
    expect(BigInt(ipca.result.saldoBaseCents)).toBeGreaterThan(BigInt(tr.result.saldoBaseCents));
  });

  it('estima competências fracionárias pelos dias reais, não pela regra de 15 dias', () => {
    const snapshot = simulate({
      ...INPUT,
      salaryCents: '375000',
      startDate: '2024-01-25',
      endDate: '2024-02-10',
      scenario: 'IPCA',
    });
    expect(snapshot.timeline.map((point) => point.competencia)).toEqual(['2024-01', '2024-02']);
    expect(snapshot.timeline[0]!.depositosCents).toBe('6774');
    expect(snapshot.result.depositosCents).toBe('17119');
    expect(snapshot.result.rendimentoCents).toBe('0');
    expect(snapshot.result.saldoBaseCents).toBe('17119');
  });

  it.each([
    ['0', '48000', '0'],
    ['-0.01', '47760', '-240'],
  ])('suporta IPCA %s inclusive rendimento negativo', (ipcaMonthly, balance, income) => {
    const snapshot = simulate({ ...INPUT, endDate: '2024-02-29', scenario: 'IPCA', ipcaMonthly });
    expect(snapshot.result.saldoBaseCents).toBe(balance);
    expect(snapshot.result.rendimentoCents).toBe(income);
    expect(isSimulationSnapshot(snapshot)).toBe(true);
  });

  it('mantém saldo patrimonial e multa quando saque-aniversário retém a conta', () => {
    const snapshot = simulate({
      ...INPUT,
      birthdayWithdrawal: true,
      include13: false,
      includeVacation: false,
    });
    expect(BigInt(snapshot.result.saldoBaseCents)).toBeGreaterThan(0n);
    expect(snapshot.result.saldoDisponivelCents).toBe('0');
    expect(snapshot.result.saldoRetidoCents).toBe(snapshot.result.saldoBaseCents);
    expect(snapshot.result.totalCents).toBe(snapshot.result.multaCents);
  });

  it('mantém avos 1/2 em contrato de vinte anos', () => {
    const snapshot = simulate({ ...INPUT, startDate: '2004-01-01' });
    expect(snapshot.result.decimoTerceiroCents).toBe('25000');
    expect(snapshot.result.feriasCents).toBe('66667');
  });

  it('mantém série de zeros para salário positivo cujo depósito arredonda a zero', () => {
    const snapshot = simulate({ ...INPUT, salaryCents: '1' });
    expect(snapshot.timeline).toHaveLength(12);
    expect(snapshot.result.saldoBaseCents).toBe('0');
    expect(isSimulationSnapshot(snapshot)).toBe(true);
  });

  it('aceita exatamente cinquenta anos civis e rejeita o dia seguinte', () => {
    const snapshot = simulate({ ...INPUT, startDate: '1976-01-01', endDate: '2026-01-01' });
    expect(snapshot.timeline).toHaveLength(601);
    expect(isSimulationSnapshot(snapshot)).toBe(true);
    expect(() => simulate({ ...INPUT, startDate: '1976-01-01', endDate: '2026-01-02' })).toThrow();
  });

  it.each<Partial<SimulationInput>>([
    { salaryCents: '300000abc' },
    { salaryCents: '300000.5' },
    { salaryCents: '0' },
    { salaryCents: '100000001' },
    { startDate: '2024-02-30' },
    { startDate: '2024-1-01' },
    { endDate: '2024-01-01' },
    { thirteenthMonths: -1 },
    { vacationMonths: 13 },
    { thirteenthMonths: 1.5 },
    { trMonthly: 'NaN' },
    { trMonthly: 'Infinity' },
    { trMonthly: '0.01abc' },
    { trMonthly: '-0.001' },
    { ipcaMonthly: '-1' },
    { ipcaMonthly: '0.11' },
    { ipcaMonthly: '1e-3' },
  ])('rejeita entradas fora do contrato: %j', (invalid) => {
    expect(() => simulate({ ...INPUT, ...invalid })).toThrow();
  });

  it('rejeita enum e booleanos adulterados em fronteira não tipada', () => {
    expect(() => simulate({ ...INPUT, include13: 'true' } as unknown as SimulationInput)).toThrow();
    expect(() =>
      simulate({ ...INPUT, contractType: 'desconhecido' } as unknown as SimulationInput),
    ).toThrow();
    expect(() => simulate({ ...INPUT, scenario: 'AUTO' } as unknown as SimulationInput)).toThrow();
  });

  it('não serializa projeções acima do limite técnico seguro', () => {
    expect(() =>
      simulate({ ...INPUT, startDate: '1976-01-01', endDate: '2026-01-01', trMonthly: '0.1' }),
    ).toThrow();
  });
});

describe('isSimulationSnapshot — fronteira de persistência sem recálculo', () => {
  it('aceita um documento histórico internamente consistente sem trocar seus números pelo motor atual', () => {
    const historical: SimulationSnapshot = {
      formatVersion: 1,
      calculationVersion: 'historico-1',
      appVersion: '1.0.0',
      id: 'historical-example',
      createdAt: '2024-02-01T00:00:00.000Z',
      input: { ...INPUT, startDate: '2024-01-01', endDate: '2024-01-31' },
      result: {
        saldoBaseCents: '10100',
        depositosCents: '10000',
        rendimentoCents: '100',
        saldoDisponivelCents: '10100',
        saldoRetidoCents: '0',
        multaCents: '4040',
        decimoTerceiroCents: '25000',
        feriasCents: '66667',
        totalCents: '105807',
      },
      timeline: [
        { competencia: '2024-01', depositosCents: '10000', trCents: '10100', ipcaCents: '10000' },
      ],
      assumptions: ['Hipóteses preservadas da versão histórica.'],
      warnings: ['Estimativa histórica.'],
    };
    const original = JSON.stringify(historical);
    expect(isSimulationSnapshot(historical)).toBe(true);
    expect(JSON.stringify(historical)).toBe(original);
    expect(simulate(historical.input).result.saldoBaseCents).not.toBe(
      historical.result.saldoBaseCents,
    );
  });

  it.each([
    (snapshot: SimulationSnapshot) => {
      snapshot.formatVersion = 2 as 1;
    },
    (snapshot: SimulationSnapshot) => {
      snapshot.input.startDate = '2024-02-30';
    },
    (snapshot: SimulationSnapshot) => {
      snapshot.input.vacationMonths = 13;
    },
    (snapshot: SimulationSnapshot) => {
      snapshot.result.saldoBaseCents = '1e6';
    },
    (snapshot: SimulationSnapshot) => {
      snapshot.result.saldoRetidoCents = '-1';
    },
    (snapshot: SimulationSnapshot) => {
      snapshot.result.totalCents = '0';
    },
    (snapshot: SimulationSnapshot) => {
      snapshot.result.depositosCents = '9007199254740992';
    },
    (snapshot: SimulationSnapshot) => {
      snapshot.timeline.pop();
    },
    (snapshot: SimulationSnapshot) => {
      snapshot.timeline[0]!.competencia = '2024-02';
    },
    (snapshot: SimulationSnapshot) => {
      snapshot.timeline.at(-1)!.trCents = '0';
    },
    (snapshot: SimulationSnapshot) => {
      snapshot.warnings = [];
    },
    (snapshot: SimulationSnapshot) => {
      snapshot.createdAt = '2024-02-30T00:00:00.000Z';
    },
  ])('rejeita documento adulterado sem mutá-lo', (mutate) => {
    const snapshot = simulate(INPUT);
    mutate(snapshot);
    const original = JSON.stringify(snapshot);
    expect(isSimulationSnapshot(snapshot)).toBe(false);
    expect(JSON.stringify(snapshot)).toBe(original);
  });

  it.each([null, [], {}, 'snapshot', 1, { formatVersion: 1 }])(
    'rejeita forma inválida %j',
    (value) => {
      expect(isSimulationSnapshot(value)).toBe(false);
    },
  );
});

describe('Limites civis da projeção', () => {
  it('gera treze competências distintas atravessando o ano', () => {
    const snapshot = simulate({ ...INPUT, endDate: '2025-01-31', scenario: 'IPCA' });
    expect(snapshot.timeline).toHaveLength(13);
    expect(snapshot.timeline.at(-1)!.competencia).toBe('2025-01');
    expect(snapshot.result.depositosCents).toBe('312000');
    expect(snapshot.result.saldoBaseCents).toBe('312000');
  });

  it('limita o aniversário de cinquenta anos de uma admissão em 29 de fevereiro', () => {
    expect(() =>
      simulate({ ...INPUT, startDate: '1976-02-29', endDate: '2026-02-28' }),
    ).not.toThrow();
    expect(() => simulate({ ...INPUT, startDate: '1976-02-29', endDate: '2026-03-01' })).toThrow();
  });

  it('aceita o limite salarial exato em uma competência única', () => {
    const snapshot = simulate({ ...INPUT, salaryCents: '100000000', endDate: '2024-01-31' });
    expect(snapshot.timeline).toHaveLength(1);
    expect(snapshot.result.saldoBaseCents).toBe('8000000');
    expect(snapshot.result.rendimentoCents).toBe('0');
  });
});
