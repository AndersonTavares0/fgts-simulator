/**
 * Módulo de Cálculo FGTS - FGTS Simulator
 * Responsável por todos os cálculos relacionados ao FGTS e verbas rescisórias
 * Projeto de Extensão Universitária - UNINTER
 *
 * Base legal: Lei 8.036/1990 e alterações posteriores
 */

const FGTSCalculator = (function() {
  'use strict';

  // Constantes legais
  const PERCENTUAL_FGTS_PADRAO = 8; // 8% do salário (CLT normal)
  const PERCENTUAL_FGTS_APRENDIZ = 2; // 2% para aprendiz
  const PERCENTUAL_MULTA = 40; // 40% sobre saldo para dispensa sem justa causa
  
  // Taxas de atualização (Art. 13 da Lei 8.036/1990)
  const JUROS_ANUAL = 3; // 3% ao ano
  const JUROS_MENSAL = Math.pow(1 + JUROS_ANUAL / 100, 1 / 12) - 1;
  const TR_ESTIMADA_MENSAL = 0.0008; // Estimativa conservadora de TR (0.08% ao mês)

  // NOTA: FGTS não possui teto de contribuição
  // Diferente do INSS, o FGTS incide sobre a totalidade da remuneração (Art. 15 da Lei 8.036/1990)
  // Mesmo executivos com salários elevados têm depósito integral de 8%

  /**
   * Calcula depósito mensal do FGTS com precisão de centavos
   * @param {number} salarioCents - Salário em centavos
   * @param {boolean} isAprendiz - Se é contrato de aprendizagem (2%)
   * @returns {number} - Depósito mensal em centavos
   */
  function calcularDepositoMensal(salarioCents, isAprendiz = false) {
    if (!isValidSalario(salarioCents)) {
      return 0;
    }

    const percentual = isAprendiz ? PERCENTUAL_FGTS_APRENDIZ : PERCENTUAL_FGTS_PADRAO;

    // FGTS incide sobre 100% do salário (sem teto)
    return Math.round((salarioCents * percentual) / 100);
  }

  /**
   * Calcula total acumulado do FGTS considerando meses trabalhados e correção
   * @param {number} salarioCents - Salário em centavos
   * @param {number} meses - Número de meses
   * @param {boolean} isAprendiz - Se é aprendiz
   * @returns {number} - Total acumulado com juros e TR em centavos
   */
  function calcularSaldoFGTS(salarioCents, meses, isAprendiz = false) {
    if (!isValidSalario(salarioCents) || meses <= 0) {
      return 0;
    }

    const depositoMensal = calcularDepositoMensal(salarioCents, isAprendiz);
    const taxaTotalMensal = JUROS_MENSAL + TR_ESTIMADA_MENSAL;
    
    // Cálculo de Juros Compostos sobre depósitos mensais (Série de pagamentos)
    // FV = P * [((1 + i)^n - 1) / i]
    // Onde P = depósito, i = taxa, n = meses
    let saldoAcumulado = 0;
    
    if (taxaTotalMensal > 0) {
      saldoAcumulado = depositoMensal * (Math.pow(1 + taxaTotalMensal, meses) - 1) / taxaTotalMensal;
    } else {
      saldoAcumulado = depositoMensal * meses;
    }

    return Math.round(saldoAcumulado);
  }

  /**
   * Calcula multa rescisória de 40% sobre o saldo do FGTS
   * @param {number} saldoCents - Saldo do FGTS em centavos
   * @param {string} motivo - Motivo da rescisão
   * @returns {number} - Multa em centavos
   */
  function calcularMultaRescisoria(saldoCents, motivo) {
    if (saldoCents <= 0) {
      return 0;
    }

    // Multa apenas para dispensa sem justa causa
    if (motivo !== 'dispensa_sem_causa') {
      return 0;
    }

    // 40% do saldo, arredondado para centavos
    return Math.round((saldoCents * PERCENTUAL_MULTA) / 100);
  }

  /**
   * Calcula 13º salário proporcional
   * @param {number} salarioCents - Salário em centavos
   * @param {number} mesesTrabalhados - Meses trabalhados no ano
   * @returns {number} - 13º proporcional em centavos
   */
  function calcularDecimoTerceiro(salarioCents, mesesTrabalhados) {
    if (!isValidSalario(salarioCents) || mesesTrabalhados <= 0) {
      return 0;
    }

    // Limite de 12 meses
    const mesesBase = Math.min(mesesTrabalhados, 12);

    // 13º = salário × (meses / 12)
    return Math.round((salarioCents * mesesBase) / 12);
  }

  /**
   * Calcula férias proporcionais + 1/3 constitucional
   * @param {number} salarioCents - Salário em centavos
   * @param {number} mesesTrabalhados - Meses trabalhados
   * @returns {number} - Férias + 1/3 em centavos
   */
  function calcularFeriasProporcionais(salarioCents, mesesTrabalhados) {
    if (!isValidSalario(salarioCents) || mesesTrabalhados <= 0) {
      return 0;
    }

    // Limite de 12 meses
    const mesesBase = Math.min(mesesTrabalhados, 12);

    // Férias proporcionais = salário × (meses / 12)
    const feriasProporcionais = Math.round((salarioCents * mesesBase) / 12);

    // 1/3 constitucional = férias / 3
    const tercoConstitucional = Math.round(feriasProporcionais / 3);

    return feriasProporcionais + tercoConstitucional;
  }

  /**
   * Calcula o valor anual do Saque-Aniversário com base na tabela oficial da Caixa
   * @param {number} saldoCents - Saldo base do FGTS
   * @returns {number} - Valor do saque anual (parcela) em centavos
   */
  function calcularParcelaSaqueAniversario(saldoCents) {
    const saldoReais = saldoCents / 100;
    let aliquota = 0;
    let parcelaAdicional = 0;

    if (saldoReais <= 500) {
      aliquota = 0.50;
      parcelaAdicional = 0;
    } else if (saldoReais <= 1000) {
      aliquota = 0.40;
      parcelaAdicional = 50;
    } else if (saldoReais <= 5000) {
      aliquota = 0.30;
      parcelaAdicional = 150;
    } else if (saldoReais <= 10000) {
      aliquota = 0.20;
      parcelaAdicional = 650;
    } else if (saldoReais <= 15000) {
      aliquota = 0.15;
      parcelaAdicional = 1150;
    } else if (saldoReais <= 20000) {
      aliquota = 0.10;
      parcelaAdicional = 1900;
    } else {
      aliquota = 0.05;
      parcelaAdicional = 2900;
    }

    return Math.round((saldoCents * aliquota) + (parcelaAdicional * 100));
  }

  /**
   * Calcula o impacto do Saque Aniversário na rescisão
   * NOTA: No Saque-Aniversário, o trabalhador NÃO saca o saldo na rescisão, 
   * mas recebe a multa de 40% integral sobre os depósitos feitos pelo empregador.
   * @param {number} saldoBaseCents - Saldo base do FGTS em centavos
   * @param {number} multaBaseCents - Multa base em centavos
   * @returns {{saldoFinal: number, multaFinal: number, valorSaqueImediato: number}}
   */
  function calcularImpactoRescisaoSaqueAniversario(saldoBaseCents, multaBaseCents) {
    // Na rescisão, quem optou pelo Saque-Aniversário:
    // 1. Recebe a multa de 40% (multaBaseCents) - Integral
    // 2. NÃO recebe o saldo principal (fica retido para saques anuais futuros)
    
    return {
      saldoFinal: 0, // Saldo fica retido
      multaFinal: multaBaseCents, // Multa é paga integralmente
      valorSaqueImediato: multaBaseCents // Apenas a multa é sacada na hora
    };
  }

  /**
   * Valida se salário está dentro dos limites aceitáveis
   * @param {number} salarioCents - Salário em centavos
   * @returns {boolean}
   */
  function isValidSalario(salarioCents) {
    return typeof salarioCents === 'number' &&
           !isNaN(salarioCents) &&
           isFinite(salarioCents) &&
           salarioCents > 0;
  }

  /**
   * Calcula resumo completo da rescisão
   * @param {Object} params - Parâmetros do cálculo
   * @param {number} params.salarioCents - Salário em centavos
   * @param {number} params.mesesTrabalhados - Meses trabalhados
   * @param {string} params.motivo - Motivo da rescisão
   * @param {boolean} params.incluirDecimoTerceiro - Incluir 13º salário
   * @param {boolean} params.incluirFerias - Incluir férias proporcionais
   * @param {boolean} params.saqueAniversario - Usar modalidade saque aniversário
   * @returns {{
   *   saldoBase: number,
   *   multaBase: number,
   *   decimoTerceiro: number,
   *   ferias: number,
   *   saldoFinal: number,
   *   multaFinal: number,
   *   total: number,
   *   detalhes: Object
   * }}
   */
  function calcularRescisaoCompleta(params) {
    const {
      salarioCents,
      mesesTrabalhados,
      motivo,
      incluirDecimoTerceiro = false,
      incluirFerias = false,
      saqueAniversario = false
    } = params;

    // Cálculos base
    const saldoBase = calcularSaldoFGTS(salarioCents, mesesTrabalhados);
    const multaBase = calcularMultaRescisoria(saldoBase, motivo);

    // Verbas proporcionais
    const decimoTerceiro = incluirDecimoTerceiro
      ? calcularDecimoTerceiro(salarioCents, mesesTrabalhados)
      : 0;

    const ferias = incluirFerias
      ? calcularFeriasProporcionais(salarioCents, mesesTrabalhados)
      : 0;

    // Aplicar regras do saque aniversário se aplicável
    let saldoFinal = saldoBase;
    let multaFinal = multaBase;
    let valorSaqueParcelaAnual = 0;

    if (saqueAniversario) {
      const saqueCalc = calcularImpactoRescisaoSaqueAniversario(saldoBase, multaBase);
      saldoFinal = saqueCalc.saldoFinal;
      multaFinal = saqueCalc.multaFinal;
      valorSaqueParcelaAnual = calcularParcelaSaqueAniversario(saldoBase);
    }

    // Total geral
    const total = saldoFinal + multaFinal + decimoTerceiro + ferias;

    return {
      saldoBase,
      multaBase,
      decimoTerceiro,
      ferias,
      saldoFinal,
      multaFinal,
      total,
      detalhes: {
        mesesTrabalhados,
        motivo,
        saqueAniversario,
        valorSaqueParcelaAnual,
        depositoMensalFGTS: calcularDepositoMensal(salarioCents),
        tetoAplicado: false,
        correcaoEstimada: saldoBase - (calcularDepositoMensal(salarioCents) * mesesTrabalhados)
      }
    };
  }

  // API pública do módulo
  return {
    calcularDepositoMensal,
    calcularSaldoFGTS,
    calcularMultaRescisoria,
    calcularDecimoTerceiro,
    calcularFeriasProporcionais,
    calcularParcelaSaqueAniversario,
    calcularImpactoRescisaoSaqueAniversario,
    calcularRescisaoCompleta,
    isValidSalario,
    // Constantes exportadas
    PERCENTUAL_FGTS_PADRAO,
    PERCENTUAL_FGTS_APRENDIZ,
    PERCENTUAL_MULTA
  };
})();

// Export para ambientes que suportam modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FGTSCalculator;
}