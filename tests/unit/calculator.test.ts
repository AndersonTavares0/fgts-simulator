/**
 * Suíte de Testes — FGTS Calculator (TypeScript)
 *
 * Valida a precisão financeira do motor de cálculos, incluindo:
 *  1. Juros compostos mensais sobre saldo FGTS
 *  2. Multa de 40% sobre montante total histórico
 *  3. Cenário de Doença Grave (100% do saldo)
 *  4. Cenários independentes TR + 3% e IPCA comparativo
 *  5. Saque-Aniversário por faixas
 *  6. Money Value Object (precision)
 *  7. Input validation guards
 */

import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';

import { Money, TipoRescisao, TipoContrato, TipoDoencaGrave } from '../../src/core/types';
import { FGTSCalculatorService } from '../../src/core/services/FGTSCalculatorService';
import { CorrecaoMonetariaService } from '../../src/core/services/CorrecaoMonetariaService';
import { MultaService } from '../../src/core/services/MultaService';
import { SaqueAniversarioService } from '../../src/core/services/SaqueAniversarioService';
import { DoencaGraveService } from '../../src/core/services/DoencaGraveService';

// ─── Constantes de teste ────────────────────────────────────────────────────
const SALARIO_3000 = Money.fromReais(3000); // R$ 3.000,00

// ─── 1. Money Value Object ──────────────────────────────────────────────────
describe('Money Value Object', () => {
  it('deve criar Money a partir de reais com precisão centesimal', () => {
    const money = Money.fromReais(3000.5);
    expect(money.cents).toBe(300050);
    expect(money.reais).toBe(3000.5);
  });

  it('deve criar Money a partir de centavos', () => {
    const money = Money.fromCents(300000);
    expect(money.cents).toBe(300000);
    expect(money.reais).toBe(3000);
  });

  it('deve somar valores corretamente', () => {
    const a = Money.fromReais(0.1);
    const b = Money.fromReais(0.2);
    const result = a.add(b);
    // IEEE 754 teria 0.30000000000000004 — Money deve resolver
    expect(result.cents).toBe(30);
    expect(result.reais).toBe(0.3);
  });

  it('deve calcular percentual com precisão', () => {
    const saldo = Money.fromCents(293231);
    const multa = saldo.percentage(40);
    expect(multa.cents).toBe(117292); // 40% de 293231
  });

  it('deve formatar para BRL', () => {
    const money = Money.fromReais(1234.56);
    const formatted = money.toBRL();
    expect(formatted).toContain('1.234,56');
  });

  it('Money.zero() deve ser zero', () => {
    const zero = Money.zero();
    expect(zero.cents).toBe(0);
    expect(zero.isZero()).toBe(true);
    expect(zero.isPositive()).toBe(false);
  });
});

// ─── 2. Depósito Mensal ─────────────────────────────────────────────────────
describe('FGTSCalculatorService.calcularDepositoMensal', () => {
  it('deve calcular 8% para CLT padrão', () => {
    const deposito = FGTSCalculatorService.calcularDepositoMensal(
      SALARIO_3000,
      TipoContrato.CLT_PADRAO,
    );
    expect(deposito.cents).toBe(24000); // R$ 240,00
  });

  it('deve calcular 2% para Aprendiz', () => {
    const deposito = FGTSCalculatorService.calcularDepositoMensal(
      SALARIO_3000,
      TipoContrato.APRENDIZ,
    );
    expect(deposito.cents).toBe(6000); // R$ 60,00
  });

  it('deve retornar zero para salário inválido', () => {
    const deposito = FGTSCalculatorService.calcularDepositoMensal(
      Money.zero(),
      TipoContrato.CLT_PADRAO,
    );
    expect(deposito.cents).toBe(0);
  });
});

// ─── 3. Juros Compostos Mensais (Correção Monetária) ────────────────────────
describe('CorrecaoMonetariaService — Juros Compostos', () => {
  it('deve acumular saldo com correção TR+3% a.a. em 12 meses', () => {
    const deposito = Money.fromCents(24000); // R$ 240,00/mês
    const resultado = CorrecaoMonetariaService.calcularSaldoComCorrecao(deposito, 12);

    // 12 meses × R$ 240 = R$ 2.880,00 sem correção
    // Com TR + 3% a.a. composto → deve ser > R$ 2.880,00
    expect(resultado.saldoCorrigido.cents).toBeGreaterThan(288000);
    expect(resultado.rendimentoTotal.isPositive()).toBe(true);
  });

  it('aplica o equivalente mensal de 3% efetivos ao ano com TR zero', () => {
    const resultado = CorrecaoMonetariaService.calcularSaldoComCorrecao(
      Money.fromReais(100000),
      2,
      { trMensal: new Decimal(0), ipcaMensal: new Decimal(0) },
    );
    expect(resultado.saldoCorrigido.cents).toBe(20024663);
  });

  it('deve retornar rendimento zero para 0 meses', () => {
    const deposito = Money.fromCents(24000);
    const resultado = CorrecaoMonetariaService.calcularSaldoComCorrecao(deposito, 0);
    expect(resultado.saldoCorrigido.cents).toBe(0);
    expect(resultado.rendimentoTotal.cents).toBe(0);
  });

  it('deve acumular corretamente em 60 meses (5 anos)', () => {
    const deposito = Money.fromCents(24000);
    const resultado = CorrecaoMonetariaService.calcularSaldoComCorrecao(deposito, 60);

    // 60 × 240 = R$ 14.400 bruto → com juros deve ser significativamente maior
    expect(resultado.saldoCorrigido.cents).toBeGreaterThan(1440000);
    // Mas não absurdamente maior (sanity check — com ~3.9% a.a. efetiva)
    expect(resultado.saldoCorrigido.cents).toBeLessThan(1700000);
  });
});

// ─── 4. Multa Rescisória (40%/20%/0%) ──────────────────────────────────────
describe('MultaService — Multa sobre Saldo Total Histórico', () => {
  const saldo = Money.fromCents(100000); // R$ 1.000,00

  it('deve aplicar 40% para dispensa sem justa causa', () => {
    const resultado = MultaService.calcular(saldo, TipoRescisao.DISPENSA_SEM_JUSTA_CAUSA);
    expect(resultado.percentualAplicado).toBe(40);
    expect(resultado.valorMulta.cents).toBe(40000); // R$ 400,00
  });

  it('deve aplicar 20% para acordo comum (Art. 484-A CLT)', () => {
    const resultado = MultaService.calcular(saldo, TipoRescisao.ACORDO_COMUM);
    expect(resultado.percentualAplicado).toBe(20);
    expect(resultado.valorMulta.cents).toBe(20000); // R$ 200,00
  });

  it('deve aplicar 20% para culpa recíproca', () => {
    const resultado = MultaService.calcular(saldo, TipoRescisao.CULPA_RECIPROCA);
    expect(resultado.percentualAplicado).toBe(20);
    expect(resultado.valorMulta.cents).toBe(20000);
  });

  it('deve retornar 0% para demissão voluntária', () => {
    const resultado = MultaService.calcular(saldo, TipoRescisao.DEMISSAO_VOLUNTARIA);
    expect(resultado.percentualAplicado).toBe(0);
    expect(resultado.valorMulta.cents).toBe(0);
  });

  it('deve retornar 0% para justa causa', () => {
    const resultado = MultaService.calcular(saldo, TipoRescisao.JUSTA_CAUSA);
    expect(resultado.percentualAplicado).toBe(0);
    expect(resultado.valorMulta.cents).toBe(0);
  });

  it('deve retornar 0% para doença grave (evento de saque, sem multa patronal)', () => {
    const resultado = MultaService.calcular(saldo, TipoRescisao.DOENCA_GRAVE);
    expect(resultado.percentualAplicado).toBe(0);
    expect(resultado.valorMulta.cents).toBe(0);
  });

  it('deve retornar 0% para aposentadoria (evento de saque, sem multa patronal)', () => {
    const resultado = MultaService.calcular(saldo, TipoRescisao.APOSENTADORIA);
    expect(resultado.percentualAplicado).toBe(0);
    expect(resultado.valorMulta.cents).toBe(0);
  });

  it('deve retornar 0% para falecimento (evento de saque, sem multa patronal)', () => {
    const resultado = MultaService.calcular(saldo, TipoRescisao.FALECIMENTO);
    expect(resultado.percentualAplicado).toBe(0);
    expect(resultado.valorMulta.cents).toBe(0);
  });
});

// ─── 5. Doença Grave — Saque Integral 100% ──────────────────────────────────
describe('DoencaGraveService — Saque por Doença Grave', () => {
  const saldo = Money.fromCents(500000); // R$ 5.000,00

  it('deve liberar 100% do saldo para câncer', () => {
    const resultado = DoencaGraveService.calcular(saldo, TipoDoencaGrave.CANCER);
    expect(resultado.percentualLiberado).toBe(100);
    expect(resultado.saldoDisponivel.cents).toBe(500000);
  });

  it('deve liberar 100% do saldo para HIV/AIDS', () => {
    const resultado = DoencaGraveService.calcular(saldo, TipoDoencaGrave.HIV_AIDS);
    expect(resultado.percentualLiberado).toBe(100);
    expect(resultado.saldoDisponivel.cents).toBe(saldo.cents);
  });

  it('deve liberar 100% do saldo para doença terminal', () => {
    const resultado = DoencaGraveService.calcular(saldo, TipoDoencaGrave.DOENCA_TERMINAL);
    expect(resultado.percentualLiberado).toBe(100);
    expect(resultado.saldoDisponivel.cents).toBe(saldo.cents);
  });
});

describe('CorrecaoMonetariaService — Cenários explícitos', () => {
  const indices = { trMensal: new Decimal(0), ipcaMensal: new Decimal('0.005') };

  it('mantém TR mesmo quando IPCA é maior', () => {
    const result = CorrecaoMonetariaService.calcularSaldoComCorrecao(
      Money.fromReais(240),
      12,
      indices,
    );
    expect(result.indexadorUtilizado).toBe('TR');
    expect(result.saldoCorrigido.cents).toBe(result.serie.at(-1)!.tr.cents);
    expect(result.serie.at(-1)!.ipca.cents).toBeGreaterThan(result.saldoCorrigido.cents);
  });

  it('usa IPCA apenas quando selecionado', () => {
    const result = CorrecaoMonetariaService.calcularSaldoComCorrecao(
      Money.fromReais(240),
      12,
      indices,
      'IPCA',
    );
    expect(result.indexadorUtilizado).toBe('IPCA');
    expect(result.saldoCorrigido.cents).toBe(result.serie.at(-1)!.ipca.cents);
  });

  it.each(['0', '-0.01'])(
    'capitaliza taxa IPCA %s sem dividir por zero nem suprimir deflação',
    (rate) => {
      const result = CorrecaoMonetariaService.calcularSaldoComCorrecao(
        Money.fromReais(100),
        2,
        { trMensal: new Decimal(0), ipcaMensal: new Decimal(rate) },
        'IPCA',
      );
      expect(result.saldoCorrigido.cents).toBe(rate === '0' ? 20000 : 19900);
      expect(result.rendimentoTotal.cents).toBe(rate === '0' ? 0 : -100);
    },
  );
});

// ─── 7. Saque-Aniversário (Faixas Oficiais) ────────────────────────────────
describe('SaqueAniversarioService — Tabela Oficial Caixa', () => {
  it('Faixa até R$ 500 → 50% + R$ 0', () => {
    const saldo = Money.fromReais(400);
    const resultado = SaqueAniversarioService.calcularParcela(saldo);
    expect(resultado.aliquota).toBe(50);
    expect(resultado.valorSaque.cents).toBe(20000); // R$ 200,00
  });

  it('Faixa R$ 500,01-R$ 1.000 → 40% + R$ 50', () => {
    const saldo = Money.fromReais(800);
    const resultado = SaqueAniversarioService.calcularParcela(saldo);
    expect(resultado.aliquota).toBe(40);
    // 800 × 40% + 50 = 320 + 50 = 370
    expect(resultado.valorSaque.cents).toBe(37000);
  });

  it('Faixa acima de R$ 20.000 → 5% + R$ 2.900', () => {
    const saldo = Money.fromReais(25000);
    const resultado = SaqueAniversarioService.calcularParcela(saldo);
    expect(resultado.aliquota).toBe(5);
    // 25000 × 5% + 2900 = 1250 + 2900 = 4150
    expect(resultado.valorSaque.cents).toBe(415000);
  });

  it('deve reter saldo na rescisão mas pagar multa integral', () => {
    const saldo = Money.fromCents(100000);
    const multa = Money.fromCents(40000);
    const impacto = SaqueAniversarioService.calcularImpactoRescisao(
      saldo,
      multa,
      TipoRescisao.DISPENSA_SEM_JUSTA_CAUSA,
    );

    expect(impacto.saldoFinal.cents).toBe(0);
    expect(impacto.multaFinal.cents).toBe(40000);
    expect(impacto.valorSaqueImediato.cents).toBe(40000);
  });
});

// ─── 8. Rescisão Completa (Integração) ──────────────────────────────────────
describe('FGTSCalculatorService.calcularRescisao — Integração', () => {
  it('deve calcular rescisão completa com dispensa sem justa causa', () => {
    const resultado = FGTSCalculatorService.calcularRescisao({
      salarioBruto: SALARIO_3000,
      mesesTrabalhados: 12,
      tipoRescisao: TipoRescisao.DISPENSA_SEM_JUSTA_CAUSA,
      tipoContrato: TipoContrato.CLT_PADRAO,
      incluirDecimoTerceiro: true,
      incluirFerias: true,
      avosDecimoTerceiro: 12,
      avosFerias: 12,
      saqueAniversario: false,
    });

    // Saldo > 0
    expect(resultado.saldoFinal.isPositive()).toBe(true);
    // Multa de 40%
    expect(resultado.multa.percentualAplicado).toBe(40);
    expect(resultado.multaFinal.isPositive()).toBe(true);
    // 13º = R$ 3.000
    expect(resultado.decimoTerceiro.cents).toBe(300000);
    // Férias + 1/3 = R$ 3.000 + R$ 1.000 = R$ 4.000
    expect(resultado.ferias.cents).toBe(400000);
    // Total > saldo + multa + verbas
    expect(resultado.total.isPositive()).toBe(true);
    expect(resultado.total.cents).toBeGreaterThan(
      resultado.saldoFinal.cents + resultado.multaFinal.cents,
    );
  });

  it('deve retornar multa zero para demissão voluntária', () => {
    const resultado = FGTSCalculatorService.calcularRescisao({
      salarioBruto: SALARIO_3000,
      mesesTrabalhados: 12,
      tipoRescisao: TipoRescisao.DEMISSAO_VOLUNTARIA,
      tipoContrato: TipoContrato.CLT_PADRAO,
      incluirDecimoTerceiro: false,
      incluirFerias: false,
      avosDecimoTerceiro: 0,
      avosFerias: 0,
      saqueAniversario: false,
    });

    expect(resultado.multaFinal.cents).toBe(0);
    expect(resultado.multa.percentualAplicado).toBe(0);
  });

  it('deve liberar saldo integral com doença grave', () => {
    const resultado = FGTSCalculatorService.calcularRescisao({
      salarioBruto: SALARIO_3000,
      mesesTrabalhados: 24,
      tipoRescisao: TipoRescisao.DOENCA_GRAVE,
      tipoContrato: TipoContrato.CLT_PADRAO,
      incluirDecimoTerceiro: false,
      incluirFerias: false,
      avosDecimoTerceiro: 0,
      avosFerias: 0,
      saqueAniversario: false,
      doencaGrave: TipoDoencaGrave.CANCER,
    });

    // Com doença grave, saldo é 100% disponível
    expect(resultado.doencaGrave).not.toBeNull();
    expect(resultado.doencaGrave!.percentualLiberado).toBe(100);
    expect(resultado.saldoFinal.isPositive()).toBe(true);
    // Doença grave é evento de saque, sem multa patronal (Art. 20, XIII, Lei 8.036/90)
    expect(resultado.multa.percentualAplicado).toBe(0);
    expect(resultado.multaFinal.cents).toBe(0);
  });

  it('deve reter saldo com saque-aniversário mas manter multa', () => {
    const resultado = FGTSCalculatorService.calcularRescisao({
      salarioBruto: SALARIO_3000,
      mesesTrabalhados: 12,
      tipoRescisao: TipoRescisao.DISPENSA_SEM_JUSTA_CAUSA,
      tipoContrato: TipoContrato.CLT_PADRAO,
      incluirDecimoTerceiro: false,
      incluirFerias: false,
      avosDecimoTerceiro: 0,
      avosFerias: 0,
      saqueAniversario: true,
    });

    // Saldo retido (saque-aniversário)
    expect(resultado.saldoFinal.cents).toBe(0);
    // Multa continua paga
    expect(resultado.multaFinal.isPositive()).toBe(true);
    // Saque-aniversário calculado
    expect(resultado.saqueAniversario).not.toBeNull();
    expect(resultado.saqueAniversario!.valorSaque.isPositive()).toBe(true);
  });
});

// ─── 9. Validação de Entradas ───────────────────────────────────────────────
