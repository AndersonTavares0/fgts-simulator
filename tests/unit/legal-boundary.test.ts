import { describe, it, expect } from 'vitest';
import { Money, TipoRescisao, TipoContrato, TipoDoencaGrave } from '../../src/core/types';
import type { ParametrosCalculo } from '../../src/core/types';
import { FGTSCalculatorService } from '../../src/core/services/FGTSCalculatorService';
import { MultaService } from '../../src/core/services/MultaService';
import { DoencaGraveService } from '../../src/core/services/DoencaGraveService';

const BASE: ParametrosCalculo = {
  salarioBruto: Money.fromReais(3000),
  mesesTrabalhados: 24,
  tipoRescisao: TipoRescisao.DISPENSA_SEM_JUSTA_CAUSA,
  tipoContrato: TipoContrato.CLT_PADRAO,
  incluirDecimoTerceiro: false,
  incluirFerias: false,
  avosDecimoTerceiro: 0,
  avosFerias: 0,
  saqueAniversario: false,
};

describe('Hipótese de saque por doença grave', () => {
  it.each([
    TipoDoencaGrave.CANCER,
    TipoDoencaGrave.HIV_AIDS,
    TipoDoencaGrave.DOENCA_TERMINAL,
    TipoDoencaGrave.DOENCA_RARA,
  ])('preserva o saldo integral para %s na hipótese informada', (tipo) => {
    const result = DoencaGraveService.calcular(Money.fromReais(10000), tipo);
    expect(result.saldoDisponivel.cents).toBe(1000000);
    expect(result.percentualLiberado).toBe(100);
    expect(result.tipoDoenca).toBe(tipo);
  });

  it('libera saldo sem criar multa mesmo com saque-aniversário', () => {
    const result = FGTSCalculatorService.calcularRescisao({
      ...BASE,
      tipoRescisao: TipoRescisao.DOENCA_GRAVE,
      doencaGrave: TipoDoencaGrave.CANCER,
      saqueAniversario: true,
    });
    expect(result.saldoBase.isPositive()).toBe(true);
    expect(result.saldoFinal.cents).toBe(result.saldoBase.cents);
    expect(result.saldoRetido.cents).toBe(0);
    expect(result.multaFinal.cents).toBe(0);
  });
});

describe('Disponibilidade e multa são valores independentes do saldo da conta', () => {
  it('acordo comum libera 80%, retém o restante e aplica multa de 20%', () => {
    const result = FGTSCalculatorService.calcularRescisao({
      ...BASE,
      tipoRescisao: TipoRescisao.ACORDO_COMUM,
    });
    expect(result.multa.percentualAplicado).toBe(20);
    expect(result.saldoFinal.cents).toBe(result.saldoBase.percentage(80).cents);
    expect(result.saldoRetido.cents).toBe(result.saldoBase.cents - result.saldoFinal.cents);
  });

  it.each([TipoRescisao.DEMISSAO_VOLUNTARIA, TipoRescisao.JUSTA_CAUSA])(
    'retém a conta sem zerar o patrimônio em %s',
    (tipoRescisao) => {
      const result = FGTSCalculatorService.calcularRescisao({ ...BASE, tipoRescisao });
      expect(result.saldoBase.isPositive()).toBe(true);
      expect(result.saldoFinal.cents).toBe(0);
      expect(result.saldoRetido.cents).toBe(result.saldoBase.cents);
      expect(result.multaFinal.cents).toBe(0);
    },
  );

  it.each([
    [TipoRescisao.DISPENSA_SEM_JUSTA_CAUSA, 400000],
    [TipoRescisao.ACORDO_COMUM, 200000],
    [TipoRescisao.CULPA_RECIPROCA, 200000],
    [TipoRescisao.DEMISSAO_VOLUNTARIA, 0],
    [TipoRescisao.JUSTA_CAUSA, 0],
  ] as const)('aplica multa sobre base informada em %s', (tipo, esperado) => {
    expect(MultaService.calcular(Money.fromReais(10000), tipo).valorMulta.cents).toBe(esperado);
  });

  it('usa histórico de depósitos informado, não apenas saldo disponível', () => {
    const result = FGTSCalculatorService.calcularRescisao({
      ...BASE,
      depositoHistoricoTotal: Money.fromReais(15000),
      saqueAniversario: true,
    });
    expect(result.multaFinal.cents).toBe(600000);
    expect(result.saldoFinal.cents).toBe(0);
    expect(result.saldoRetido.cents).toBe(result.saldoBase.cents);
  });

  it('preserva saque integral por aposentadoria com saque-aniversário', () => {
    const result = FGTSCalculatorService.calcularRescisao({
      ...BASE,
      tipoRescisao: TipoRescisao.APOSENTADORIA,
      saqueAniversario: true,
    });
    expect(result.saldoFinal.cents).toBe(result.saldoBase.cents);
    expect(result.saldoRetido.cents).toBe(0);
  });
});

describe('Tipos de contrato e avos pendentes', () => {
  it.each([
    [TipoContrato.CLT_PADRAO, 24000],
    [TipoContrato.APRENDIZ, 6000],
    [TipoContrato.DOMESTICO, 24000],
  ] as const)('estima depósito mensal em %s', (tipoContrato, esperado) => {
    expect(
      FGTSCalculatorService.calcularDepositoMensal(BASE.salarioBruto, tipoContrato).cents,
    ).toBe(esperado);
  });

  it('aplica metade da reserva doméstica corrigida em culpa recíproca', () => {
    const result = FGTSCalculatorService.calcularRescisao({
      ...BASE,
      mesesTrabalhados: 10,
      tipoRescisao: TipoRescisao.CULPA_RECIPROCA,
      tipoContrato: TipoContrato.DOMESTICO,
    });
    expect(result.multa.valorMulta.cents).toBe(48712);
  });

  it('corrige a reserva doméstica como saldo FGTS', () => {
    const result = FGTSCalculatorService.calcularRescisao({
      ...BASE,
      mesesTrabalhados: 24,
      tipoRescisao: TipoRescisao.DISPENSA_SEM_JUSTA_CAUSA,
      tipoContrato: TipoContrato.DOMESTICO,
    });
    // 24 × R$ 96,00 = R$ 2.304,00 nominal; corrigido pela TR + 3% a.a.
    expect(result.multa.valorMulta.cents).toBe(239265);
  });

  it('libera metade da reserva doméstica corrigida no acordo comum', () => {
    const result = FGTSCalculatorService.calcularRescisao({
      ...BASE,
      tipoRescisao: TipoRescisao.ACORDO_COMUM,
      tipoContrato: TipoContrato.DOMESTICO,
    });
    expect(result.multa.valorMulta.cents).toBe(119632);
  });

  it('zera 13º e férias na justa causa mesmo se informados', () => {
    const result = FGTSCalculatorService.calcularRescisao({
      ...BASE,
      tipoRescisao: TipoRescisao.JUSTA_CAUSA,
      incluirDecimoTerceiro: true,
      incluirFerias: true,
      avosDecimoTerceiro: 12,
      avosFerias: 12,
    });
    expect(result.decimoTerceiro.cents).toBe(0);
    expect(result.ferias.cents).toBe(0);
    expect(result.total.cents).toBe(0);
  });

  it('não trata doença grave como rescisão para 13º e férias', () => {
    const result = FGTSCalculatorService.calcularRescisao({
      ...BASE,
      tipoRescisao: TipoRescisao.DOENCA_GRAVE,
      doencaGrave: TipoDoencaGrave.CANCER,
      incluirDecimoTerceiro: true,
      incluirFerias: true,
      avosDecimoTerceiro: 12,
      avosFerias: 12,
    });
    expect(result.decimoTerceiro.cents).toBe(0);
    expect(result.ferias.cents).toBe(0);
    expect(result.saldoFinal.cents).toBe(result.saldoBase.cents);
  });

  it('não transforma duração longa em 12 avos pendentes', () => {
    const result = FGTSCalculatorService.calcularRescisao({
      ...BASE,
      mesesTrabalhados: 240,
      incluirDecimoTerceiro: true,
      incluirFerias: true,
      avosDecimoTerceiro: 1,
      avosFerias: 2,
    });
    expect(result.decimoTerceiro.cents).toBe(25000);
    expect(result.ferias.cents).toBe(66667);
  });
});
