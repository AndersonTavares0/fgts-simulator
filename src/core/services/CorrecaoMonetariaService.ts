import Decimal from 'decimal.js';
import { Money } from '../types';
import type { IndicesCorrecao, PontoCorrecao, ResultadoCorrecao } from '../types';

const JUROS_MENSAL = new Decimal('1.03').pow(new Decimal(1).dividedBy(12)).minus(1);
const TR_ESTIMADA_MENSAL = new Decimal('0.0008');
const IPCA_ESTIMADO_MENSAL = new Decimal('0.004');

/** Projeções independentes: TR + 3% a.a. ou comparação econômica pelo IPCA, sem piso automático. */
export class CorrecaoMonetariaService {
  static calcularSaldoComCorrecao(
    depositoMensal: Money,
    meses: number,
    indices?: IndicesCorrecao,
    cenario: 'TR' | 'IPCA' = 'TR',
    periodos?: readonly Decimal[],
    depositosExtras?: readonly Money[],
  ): ResultadoCorrecao {
    if (!Number.isFinite(meses) || meses < 0 || meses > 602) {
      throw new Error('Período de correção inválido.');
    }
    if (cenario !== 'TR' && cenario !== 'IPCA') throw new Error('Cenário de correção inválido.');
    const tr = indices?.trMensal ?? TR_ESTIMADA_MENSAL;
    const ipca = indices?.ipcaMensal ?? IPCA_ESTIMADO_MENSAL;
    if (
      !tr.isFinite() ||
      tr.lessThan(0) ||
      tr.greaterThan('0.1') ||
      !ipca.isFinite() ||
      ipca.lessThanOrEqualTo(-1) ||
      ipca.greaterThan('0.1')
    ) {
      throw new Error(
        'Índices mensais inválidos: TR entre 0 e 10%; IPCA maior que -100% e até 10%.',
      );
    }
    const taxaTR = JUROS_MENSAL.plus(tr);
    const taxaSelecionada = cenario === 'TR' ? taxaTR : ipca;
    const fracoes = periodos ?? [
      ...Array.from({ length: Math.floor(meses) }, () => new Decimal(1)),
      ...(meses % 1 ? [new Decimal(meses).minus(Math.floor(meses))] : []),
    ];
    if (
      fracoes.length > 602 ||
      fracoes.some(
        (fracao) => !fracao.isFinite() || fracao.lessThanOrEqualTo(0) || fracao.greaterThan(1),
      )
    ) {
      throw new Error('Frações de competência inválidas.');
    }
    if (
      depositosExtras &&
      (depositosExtras.length !== fracoes.length ||
        depositosExtras.some((deposito) => deposito.decimal.lessThan(0)))
    ) {
      throw new Error('Depósitos extras inválidos.');
    }
    let saldoTR = new Decimal(0);
    let saldoIPCA = new Decimal(0);
    let depositos = new Decimal(0);
    const serie: PontoCorrecao[] = [];
    const depositoBase = depositoMensal.isPositive() ? depositoMensal.decimal : new Decimal(0);
    for (const [index, fracao] of fracoes.entries()) {
      const deposito = depositoBase.times(fracao).plus(depositosExtras?.[index]?.decimal ?? 0);
      saldoTR = saldoTR.times(new Decimal(1).plus(taxaTR).pow(fracao)).plus(deposito);
      saldoIPCA = saldoIPCA.times(new Decimal(1).plus(ipca).pow(fracao)).plus(deposito);
      depositos = depositos.plus(deposito);
      serie.push({
        depositos: Money.fromCents(depositos),
        tr: Money.fromCents(saldoTR),
        ipca: Money.fromCents(saldoIPCA),
      });
    }
    const ultimo = serie.at(-1);
    const saldoCorrigido = (cenario === 'TR' ? ultimo?.tr : ultimo?.ipca) ?? Money.zero();
    return {
      saldoCorrigido,
      rendimentoTotal: saldoCorrigido.subtract(ultimo?.depositos ?? Money.zero()),
      indexadorUtilizado: cenario,
      taxaEfetivaAnual: new Decimal(1).plus(taxaSelecionada).pow(12).minus(1),
      serie,
    };
  }
}
