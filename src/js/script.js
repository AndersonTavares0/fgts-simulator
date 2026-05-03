/**
 * Script Principal - FGTS Simulator
 * Projeto de Extensão Universitária - UNINTER
 * Engenharia de Software
 *
 * Arquitetura modular seguindo princípios SOLID e DRY
 */

(function() {
  'use strict';

  // Referências DOM - Formulário
  const salarioEl = document.getElementById('salario');
  const inicioEl = document.getElementById('inicio');
  const terminoEl = document.getElementById('termino');
  const motivoEl = document.getElementById('motivo');
  const calcularBtn = document.getElementById('calcular');

  // Referências DOM - Resultados
  const saldoEl = document.getElementById('saldo');
  const multaEl = document.getElementById('multa');
  const totalEl = document.getElementById('total');

  // Referências DOM - Opções
  const incluir13El = document.getElementById('incluir13');
  const incluirFeriasEl = document.getElementById('incluirFerias');
  const saqueAniversarioEl = document.getElementById('saqueAniversario');

  // Referências DOM - Gráfico e Tema
  const donut = document.getElementById('donut');
  const toggleTheme = document.getElementById('toggleTheme');
  const modalOverlay = document.getElementById('modal');

  // Região live para acessibilidade (anúncio de resultados)
  let resultsLiveRegion = null;

  /**
   * Inicializa região live para anúncio de resultados
   */
  function initLiveRegion() {
    resultsLiveRegion = document.getElementById('results-live-region');

    if (!resultsLiveRegion) {
      resultsLiveRegion = document.createElement('div');
      resultsLiveRegion.id = 'results-live-region';
      resultsLiveRegion.setAttribute('aria-live', 'polite');
      resultsLiveRegion.setAttribute('aria-atomic', 'true');
      resultsLiveRegion.className = 'sr-only';
      resultsLiveRegion.style.cssText = 'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;';
      document.body.appendChild(resultsLiveRegion);
    }
  }

  /**
   * Anuncia resultados para leitores de tela
   * @param {Object} resultado - Objeto com valores calculados
   */
  function announceResults(resultado) {
    if (!resultsLiveRegion) return;

    const mensagem = `Cálculo concluído. ` +
                     `Saldo FGTS: ${formatBRLFromCents(resultado.saldoFinal)}. ` +
                     `Multa e extras: ${formatBRLFromCents(resultado.multaFinal)}. ` +
                     `Total a receber: ${formatBRLFromCents(resultado.total)}.`;

    resultsLiveRegion.textContent = mensagem;

    // Limpa após 5 segundos
    setTimeout(() => {
      resultsLiveRegion.textContent = '';
    }, 5000);
  }

  /**
   * Exibe mensagem de erro inline com acessibilidade
   * @param {string} message - Mensagem de erro
   * @param {HTMLElement} element - Elemento associado ao erro
   */
  function showError(message, element) {
    // Remove erros anteriores
    clearErrors();

    if (element) {
      element.setAttribute('aria-invalid', 'true');
      element.style.borderColor = '#dc2626';

      // Cria label de erro associado
      const errorLabel = document.createElement('span');
      errorLabel.className = 'error-message';
      errorLabel.id = element.id + '-error';
      errorLabel.textContent = message;
      errorLabel.style.cssText = 'color:#dc2626;font-size:14px;margin-top:4px;display:block;';
      errorLabel.setAttribute('role', 'alert');

      element.parentNode.appendChild(errorLabel);
      element.setAttribute('aria-describedby', errorLabel.id);
    } else {
      // Erro genérico
      alert(message);
    }
  }

  /**
   * Limpa todas as mensagens de erro
   */
  function clearErrors() {
    // Remove labels de erro
    document.querySelectorAll('.error-message').forEach(el => el.remove());

    // Reseta estados de invalidade
    document.querySelectorAll('[aria-invalid="true"]').forEach(el => {
      el.setAttribute('aria-invalid', 'false');
      el.style.borderColor = '';
      el.removeAttribute('aria-describedby');
    });
  }

  /**
   * Formata inteiro em centavos para string monetária BRL
   * @param {number} cents - Valor em centavos
   * @returns {string} - Valor formatado como moeda brasileira
   */
  function formatBRLFromCents(cents) {
    const formatter = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
    return formatter.format(cents / 100);
  }

  /**
   * Valida formulário antes do cálculo
   * @returns {{valid: boolean, data?: Object}}
   */
  function validateForm() {
    clearErrors();

    // Sanitiza salário
    const salarioCents = ValidationModule.sanitizeMonetaryValue(salarioEl.value);
    const salarioValidation = ValidationModule.validateSalario(salarioCents);

    if (!salarioValidation.valid) {
      showError(salarioValidation.error, salarioEl);
      return { valid: false };
    }

    // Parse e valida datas
    const inicio = ValidationModule.parseDate(inicioEl.value);
    const termino = ValidationModule.parseDate(terminoEl.value);

    const periodoValidation = ValidationModule.validatePeriodo(inicio, termino);

    if (!periodoValidation.valid) {
      showError(periodoValidation.error, terminoEl);
      return { valid: false };
    }

    // Valida motivo
    const motivoValidation = ValidationModule.validateMotivo(motivoEl.value);

    if (!motivoValidation.valid) {
      showError(motivoValidation.error, motivoEl);
      return { valid: false };
    }

    // Calcula meses trabalhados com precisão CLT
    const mesesTrabalhados = ValidationModule.calcularMesesTrabalhados(inicio, termino);

    return {
      valid: true,
      data: {
        salarioCents,
        inicio,
        termino,
        motivo: motivoEl.value,
        mesesTrabalhados,
        incluirDecimoTerceiro: incluir13El.checked,
        incluirFerias: incluirFeriasEl.checked,
        saqueAniversario: saqueAniversarioEl.checked
      }
    };
  }

  /**
   * Atualiza UI com resultados do cálculo
   * @param {Object} resultado - Resultado do cálculo
   */
  function updateUI(resultado) {
    // Atualiza valores
    saldoEl.textContent = formatBRLFromCents(resultado.saldoFinal);
    multaEl.textContent = formatBRLFromCents(resultado.multaFinal + resultado.decimoterceiro + resultado.ferias);
    totalEl.textContent = formatBRLFromCents(resultado.total);

    // Atualiza gráfico donut
    const denom = resultado.total || 1;
    donut.style.setProperty('--pSaldo', ((resultado.saldoFinal / denom) * 100).toFixed(2) + '%');
    donut.style.setProperty('--pMulta', ((resultado.multaFinal / denom) * 100).toFixed(2) + '%');
    donut.style.setProperty('--pProp', (((resultado.decimoterceiro + resultado.ferias) / denom) * 100).toFixed(2) + '%');

    // Announce para leitores de tela
    announceResults(resultado);
  }

  /**
   * Handler principal do botão Calcular
   */
  function handleCalcular() {
    try {
      const validation = validateForm();

      if (!validation.valid) {
        return;
      }

      const { data } = validation;

      // Executa cálculo usando módulo especializado
      const resultado = FGTSCalculator.calcularRescisaoCompleta({
        salarioCents: data.salarioCents,
        mesesTrabalhados: data.mesesTrabalhados,
        motivo: data.motivo,
        incluirDecimoTerceiro: data.incluirDecimoTerceiro,
        incluirFerias: data.incluirFerias,
        saqueAniversario: data.saqueAniversario
      });

      updateUI(resultado);

    } catch (error) {
      console.error('Erro no cálculo:', error);
      showError('Ocorreu um erro ao calcular. Por favor, tente novamente.', null);
    }
  }

  /**
   * Inicializa modal de explicação
   */
  function initModal() {
    const explicarBtn = document.getElementById('explicar');
    const closeModalBtn = document.getElementById('closeModal');

    if (!explicarBtn || !closeModalBtn) return;

    explicarBtn.addEventListener('click', function() {
      modalOverlay.style.display = 'grid';
      closeModalBtn.focus();
    });

    closeModalBtn.addEventListener('click', function() {
      modalOverlay.style.display = 'none';
      explicarBtn.focus();
    });

    // Fecha modal com ESC
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && modalOverlay.style.display === 'grid') {
        modalOverlay.style.display = 'none';
        explicarBtn.focus();
      }
    });

    // Fecha ao clicar fora
    modalOverlay.addEventListener('click', function(e) {
      if (e.target === modalOverlay) {
        modalOverlay.style.display = 'none';
        explicarBtn.focus();
      }
    });
  }

  /**
   * Inicialização da aplicação
   */
  function init() {
    // Inicializa módulos
    ThemeManager.init(toggleTheme);
    initLiveRegion();
    initModal();

    // Configura handler do botão calcular
    calcularBtn.addEventListener('click', handleCalcular);

    // Permite cálculo com Enter nos inputs
    [salarioEl, inicioEl, terminoEl].forEach(function(input) {
      input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleCalcular();
        }
      });
    });

    // Força tema claro no início (fallback)
    if (!document.body.getAttribute('data-theme')) {
      document.body.setAttribute('data-theme', 'light');
    }
  }

  // Inicializa quando DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();