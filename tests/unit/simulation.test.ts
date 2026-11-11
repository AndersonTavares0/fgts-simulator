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
  thirteenthMode: 'actual',
  thirteenthEntries: [],
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

  it('normaliza justa causa e doença grave sem verbas proporcionais', () => {
    for (const terminationType of [TipoRescisao.JUSTA_CAUSA, TipoRescisao.DOENCA_GRAVE]) {
      const snapshot = simulate({
        ...INPUT,
        terminationType,
        include13: true,
        includeVacation: true,
        thirteenthMonths: 12,
        vacationMonths: 12,
      });
      expect(snapshot.input.include13).toBe(false);
      expect(snapshot.input.includeVacation).toBe(false);
      expect(snapshot.result.decimoTerceiroCents).toBe('0');
      expect(snapshot.result.feriasCents).toBe('0');
      expect(snapshot.warnings.join(' ')).toMatch(
        terminationType === TipoRescisao.JUSTA_CAUSA ? /Justa causa/ : /hipótese legal/,
      );
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
  it('estima 13º em novembro, dezembro e na rescisão por meses com pelo menos 15 dias', () => {
    const base = {
      ...INPUT,
      startDate: '2024-01-17',
      endDate: '2025-02-14',
      scenario: 'IPCA' as const,
    };
    const actual = simulate(base);
    const estimate = simulate({ ...base, thirteenthMode: 'estimate' });
    // 2024: 12 avos; 2025: um avo (fevereiro incompleto).
    expect(
      BigInt(estimate.timeline[10]!.depositosCents) - BigInt(actual.timeline[10]!.depositosCents),
    ).toBe(12000n);
    expect(
      BigInt(estimate.timeline[11]!.depositosCents) - BigInt(actual.timeline[11]!.depositosCents),
    ).toBe(24000n);
    expect(BigInt(estimate.result.depositosCents) - BigInt(actual.result.depositosCents)).toBe(
      26000n,
    );
    expect(estimate.result.rendimentoCents).toBe('0');
  });

  it.each([TipoRescisao.DOENCA_GRAVE, TipoRescisao.APOSENTADORIA])(
    'estima possível adiantamento quando o vínculo continua e a projeção termina em novembro: %s',
    (terminationType) => {
      const base = { ...INPUT, endDate: '2024-11-30', terminationType };
      const actual = simulate(base);
      const estimate = simulate({ ...base, thirteenthMode: 'estimate' });
      expect(BigInt(estimate.result.depositosCents) - BigInt(actual.result.depositosCents)).toBe(
        11000n,
      );
    },
  );

  it('lança proporcional integral na rescisão em novembro, sem somar adiantamento', () => {
    const base = { ...INPUT, endDate: '2024-11-30' };
    const actual = simulate(base);
    const estimate = simulate({ ...base, thirteenthMode: 'estimate' });
    expect(BigInt(estimate.result.depositosCents) - BigInt(actual.result.depositosCents)).toBe(
      22000n,
    );
  });

  it('lança dezembro sem novembro e não duplica no janeiro seguinte', () => {
    const base = { ...INPUT, startDate: '2024-12-01', endDate: '2025-01-31' };
    const actual = simulate(base);
    const estimate = simulate({ ...base, thirteenthMode: 'estimate' });
    expect(
      BigInt(estimate.timeline[0]!.depositosCents) - BigInt(actual.timeline[0]!.depositosCents),
    ).toBe(2000n);
    expect(BigInt(estimate.result.depositosCents) - BigInt(actual.result.depositosCents)).toBe(
      4000n,
    );
  });

  it('não credita saldo proporcional em dezembro da justa causa, mas preserva anos anteriores e adiantamento', () => {
    const base = {
      ...INPUT,
      startDate: '2023-01-01',
      endDate: '2024-12-31',
      terminationType: TipoRescisao.JUSTA_CAUSA,
    };
    const actual = simulate(base);
    const estimate = simulate({ ...base, thirteenthMode: 'estimate' });
    expect(
      BigInt(estimate.timeline[22]!.depositosCents) - BigInt(actual.timeline[22]!.depositosCents),
    ).toBe(35000n);
    expect(BigInt(estimate.result.depositosCents) - BigInt(actual.result.depositosCents)).toBe(
      35000n,
    );
    const decemberOnly = { ...base, startDate: '2024-12-01' };
    expect(simulate({ ...decemberOnly, thirteenthMode: 'estimate' }).result.depositosCents).toBe(
      simulate(decemberOnly).result.depositosCents,
    );
  });

  it.each([TipoRescisao.JUSTA_CAUSA, TipoRescisao.DOENCA_GRAVE, TipoRescisao.APOSENTADORIA])(
    'não presume pagamento proporcional no término incompleto por %s',
    (terminationType) => {
      const base = { ...INPUT, endDate: '2024-06-30', terminationType };
      expect(simulate({ ...base, thirteenthMode: 'estimate' }).result.depositosCents).toBe(
        simulate(base).result.depositosCents,
      );
    },
  );

  it.each([
    [TipoContrato.CLT_PADRAO, '24000'],
    [TipoContrato.APRENDIZ, '6000'],
    [TipoContrato.DOMESTICO, '24000'],
  ] as const)(
    'lança remuneração real com alíquota de %s e corrige a partir do mês seguinte',
    (contractType, extra) => {
      const base = {
        ...INPUT,
        contractType,
        endDate: '2024-03-31',
        scenario: 'IPCA' as const,
        ipcaMonthly: '0.01',
      };
      const without = simulate(base);
      const withExtra = simulate({
        ...base,
        thirteenthEntries: [{ competencia: '2024-02', remuneracaoCents: '300000' }],
      });
      expect(
        BigInt(withExtra.timeline[1]!.depositosCents) - BigInt(without.timeline[1]!.depositosCents),
      ).toBe(BigInt(extra));
      expect(BigInt(withExtra.result.saldoBaseCents) - BigInt(without.result.saldoBaseCents)).toBe(
        (BigInt(extra) * 101n) / 100n,
      );
      expect(isSimulationSnapshot(withExtra)).toBe(true);
    },
  );

  it('usa estimativa por padrão e persiste os dois campos nos novos cálculos', () => {
    const legacy = { ...INPUT };
    delete legacy.thirteenthMode;
    delete legacy.thirteenthEntries;
    const snapshot = simulate(legacy);
    expect(snapshot.input.thirteenthMode).toBe('estimate');
    expect(snapshot.input.thirteenthEntries).toEqual([]);
    expect(snapshot.result.depositosCents).toBe('312000');
  });

  it('inclui 13º na reserva doméstica e preserva metade no acordo', () => {
    const base = {
      ...INPUT,
      endDate: '2024-02-29',
      contractType: TipoContrato.DOMESTICO,
      scenario: 'IPCA' as const,
      thirteenthEntries: [{ competencia: '2024-01', remuneracaoCents: '300000' }],
    };
    const dismissal = simulate(base);
    const agreement = simulate({ ...base, terminationType: TipoRescisao.ACORDO_COMUM });
    expect(dismissal.result.depositosCents).toBe('72000');
    expect(dismissal.result.multaCents).toBe('28800');
    expect(agreement.result.multaCents).toBe('14400');
  });

  it('corrige a reserva doméstica extra somente nos meses seguintes', () => {
    const base = {
      ...INPUT,
      endDate: '2024-02-29',
      contractType: TipoContrato.DOMESTICO,
      scenario: 'IPCA' as const,
      ipcaMonthly: '0.01',
    };
    const without = simulate(base);
    const withExtra = simulate({
      ...base,
      thirteenthEntries: [{ competencia: '2024-01', remuneracaoCents: '300000' }],
    });
    expect(BigInt(withExtra.result.multaCents) - BigInt(without.result.multaCents)).toBe(9696n);
  });

  it('preserva entradas reais em justa causa e não depende de verbas proporcionais', () => {
    const snapshot = simulate({
      ...INPUT,
      endDate: '2024-06-30',
      terminationType: TipoRescisao.JUSTA_CAUSA,
      thirteenthEntries: [{ competencia: '2024-03', remuneracaoCents: '300000' }],
    });
    expect(snapshot.result.depositosCents).toBe('168000');
    expect(snapshot.input.include13).toBe(false);
  });

  it('rejeita campos incompletos, valores inválidos e competências não ordenadas ou fora do período', () => {
    for (const invalid of [
      { thirteenthMode: undefined },
      { thirteenthEntries: undefined },
      {
        thirteenthMode: 'estimate',
        thirteenthEntries: [{ competencia: '2024-01', remuneracaoCents: '1' }],
      },
      { thirteenthEntries: [{ competencia: '2023-12', remuneracaoCents: '1' }] },
      { thirteenthEntries: [{ competencia: '2025-01', remuneracaoCents: '1' }] },
      { thirteenthEntries: [{ competencia: '2024-13', remuneracaoCents: '1' }] },
      { thirteenthEntries: [{ competencia: '2024-01', remuneracaoCents: '9007199254740992' }] },
      { thirteenthEntries: [{ competencia: '2024-01', remuneracaoCents: '-1' }] },
      { thirteenthEntries: [{ competencia: '2024-01', remuneracaoCents: '1.5' }] },
      {
        thirteenthEntries: [
          { competencia: '2024-01', remuneracaoCents: '1' },
          { competencia: '2024-01', remuneracaoCents: '2' },
        ],
      },
      {
        thirteenthEntries: [
          { competencia: '2024-02', remuneracaoCents: '1' },
          { competencia: '2024-01', remuneracaoCents: '2' },
        ],
      },
    ]) {
      expect(() => simulate({ ...INPUT, ...invalid } as SimulationInput)).toThrow();
    }
  });

  it('avisa sobre extrapolação da reserva doméstica antes de outubro de 2015', () => {
    const snapshot = simulate({
      ...INPUT,
      contractType: TipoContrato.DOMESTICO,
      startDate: '2015-09-01',
    });
    expect(snapshot.warnings.join(' ')).toContain('Antes de outubro de 2015');
  });

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
    delete historical.input.thirteenthMode;
    delete historical.input.thirteenthEntries;
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
