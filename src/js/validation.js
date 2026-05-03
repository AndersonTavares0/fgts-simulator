/**
 * Módulo de Validação - FGTS Simulator
 * Responsável por sanitizar e validar entradas do usuário
 * Projeto de Extensão Universitária - UNINTER
 */

const ValidationModule = (function() {
  'use strict';

  // Constantes de validação
  const MIN_SALARIO = 0.01;
  // FGTS não possui teto legal - incide sobre totalidade da remuneração
  // Valor máximo prático para validação de entrada (evita overflow e entradas maliciosas)
  const MAX_SALARIO_VALIDACAO = 1000000.00; // R$ 1 milhão como limite técnico
  const DIAS_MINIMO_MES_COMPLETO = 15;

  /**
   * Valida se um valor é um número positivo válido
   * @param {number} value - Valor a validar
   * @returns {boolean}
   */
  function isValidPositiveNumber(value) {
    return typeof value === 'number' && !isNaN(value) && isFinite(value) && value > 0;
  }

  /**
   * Sanitiza e converte valor monetário para centavos
   * @param {string|number} value - Valor de entrada
   * @returns {number|null} - Valor em centavos ou null se inválido
   */
  function sanitizeMonetaryValue(value) {
    if (typeof value === 'string') {
      // Remove formatação brasileira (R$, pontos, espaços) e troca vírgula por ponto
      const cleaned = value.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.');
      value = parseFloat(cleaned);
    }

    if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
      return null;
    }

    // Arredonda para centavos
    return Math.round(value * 100);
  }

  /**
   * Valida salário dentro dos limites aceitáveis
   * @param {number} salarioCents - Salário em centavos
   * @returns {{valid: boolean, error?: string}}
   */
  function validateSalario(salarioCents) {
    if (salarioCents === null || salarioCents <= 0) {
      return { valid: false, error: 'Salário deve ser maior que zero.' };
    }

    const salarioReais = salarioCents / 100;

    if (salarioReais < MIN_SALARIO) {
      return {
        valid: false,
        error: `Salário mínimo permitido: R$ ${MIN_SALARIO.toFixed(2)}.`
      };
    }

    if (salarioReais > MAX_SALARIO_VALIDACAO) {
      return {
        valid: false,
        error: `Valor excede limite técnico de R$ ${MAX_SALARIO_VALIDACAO.toLocaleString('pt-BR', {minimumFractionDigits: 2})}. Para fins de cálculo, este valor é aceitável.`
      };
    }

    return { valid: true };
  }

  /**
   * Parse seguro de data no formato YYYY-MM-DD
   * @param {string} dateString - Data no formato YYYY-MM-DD
   * @returns {Date|null}
   */
  function parseDate(dateString) {
    if (!dateString || typeof dateString !== 'string') {
      return null;
    }

    const parts = dateString.split('-');
    if (parts.length !== 3) {
      return null;
    }

    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);

    // Validação básica de componentes
    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      return null;
    }

    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return null;
    }

    const date = new Date(year, month - 1, day);

    // Verifica se a data é válida (ex: 31/02 não existe)
    if (date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day) {
      return null;
    }

    return date;
  }

  /**
   * Valida período entre duas datas
   * @param {Date} inicio - Data de início
   * @param {Date} termino - Data de término
   * @returns {{valid: boolean, error?: string}}
   */
  function validatePeriodo(inicio, termino) {
    if (!inicio || !termino) {
      return { valid: false, error: 'Datas de início e término são obrigatórias.' };
    }

    if (termino < inicio) {
      return { valid: false, error: 'Data de término não pode ser anterior à data de início.' };
    }

    // Limite máximo de 50 anos
    const maxDias = 50 * 365;
    const diffTime = Math.abs(termino - inicio);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > maxDias) {
      return {
        valid: false,
        error: 'Período máximo permitido: 50 anos.'
      };
    }

    return { valid: true };
  }

  /**
   * Calcula meses trabalhados considerando regra CLT (15+ dias = mês completo)
   * @param {Date} inicio - Data de início
   * @param {Date} termino - Data de término
   * @returns {number} - Meses trabalhados (pode ser fracionado)
   */
  function calcularMesesTrabalhados(inicio, termino) {
    if (!inicio || !termino || termino < inicio) {
      return 0;
    }

    const y1 = inicio.getFullYear();
    const m1 = inicio.getMonth();
    const d1 = inicio.getDate();

    const y2 = termino.getFullYear();
    const m2 = termino.getMonth();
    const d2 = termino.getDate();

    // Meses completos entre as datas
    let mesesCompletos = (y2 - y1) * 12 + (m2 - m1);

    // Ajuste baseado nos dias
    if (d2 < d1) {
      mesesCompletos--;
    }

    // Calcular fração do mês final
    let fracaoMes = 0;

    // Se o dia de término for >= 15, conta como mês completo adicional
    if (d2 >= DIAS_MINIMO_MES_COMPLETO) {
      // Já foi considerado no cálculo acima se d2 >= d1
      // Se d2 < d1, adicionamos 1 mês completo
      if (d2 < d1) {
        mesesCompletos++;
        fracaoMes = 0;
      }
    } else {
      // Fração proporcional dos dias trabalhados no último mês
      const diasNoMesFinal = new Date(y2, m2 + 1, 0).getDate();
      fracaoMes = d2 / diasNoMesFinal;

      // Se d2 < d1, já decrementamos, então adicionamos a fração
      if (d2 < d1) {
        mesesCompletos++;
      }
    }

    // Retorna meses com precisão de 2 casas decimais
    return Math.max(0, parseFloat((mesesCompletos + fracaoMes).toFixed(2)));
  }

  /**
   * Valida motivo da rescisão
   * @param {string} motivo - Motivo da saída
   * @returns {{valid: boolean, error?: string}}
   */
  function validateMotivo(motivo) {
    const motivosValidos = [
      'dispensa_sem_causa',
      'demissao_voluntaria',
      'outra_saida'
    ];

    if (!motivosValidos.includes(motivo)) {
      return { valid: false, error: 'Motivo da saída inválido.' };
    }

    return { valid: true };
  }

  // API pública do módulo
  return {
    sanitizeMonetaryValue,
    validateSalario,
    parseDate,
    validatePeriodo,
    calcularMesesTrabalhados,
    validateMotivo,
    isValidPositiveNumber,
    DIAS_MINIMO_MES_COMPLETO
  };
})();

// Export para ambientes que suportam modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ValidationModule;
}