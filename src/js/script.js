/**
 * Script Principal — FGTS Simulator (Refatorado)
 * Orquestrador da nova UI de Dashboard
 * Projeto de Extensão Universitária — UNINTER
 */

(function () {
  'use strict';

  // ── Referências DOM — Formulário ──────────────────────────────
  const salarioEl        = document.getElementById('salario');
  const inicioEl         = document.getElementById('inicio');
  const terminoEl        = document.getElementById('termino');
  const motivoEl         = document.getElementById('motivo');
  const calcularBtn      = document.getElementById('calcular');
  const incluir13El      = document.getElementById('incluir13');
  const incluirFeriasEl  = document.getElementById('incluirFerias');
  const saqueAniversarioEl = document.getElementById('saqueAniversario');

  // ── Referências DOM — Resultados ─────────────────────────────
  const saldoEl      = document.getElementById('saldo');
  const multaEl      = document.getElementById('multa');
  const totalEl      = document.getElementById('total');
  const emptyState   = document.getElementById('emptyState');
  const resultsContent = document.getElementById('resultsContent');

  // Donut SVG
  const dSaldo = document.getElementById('d-saldo');
  const dMulta = document.getElementById('d-multa');
  const dProp  = document.getElementById('d-prop');
  const donutCenter = document.getElementById('donut-center');

  // Legenda + Percentuais
  const pctSaldo = document.getElementById('pct-saldo');
  const pctMulta = document.getElementById('pct-multa');
  const pctProp  = document.getElementById('pct-prop');

  // Barra de progresso
  const barSaldo = document.getElementById('bar-saldo');
  const barMulta = document.getElementById('bar-multa');
  const barProp  = document.getElementById('bar-prop');

  // Breakdown
  const breakdownList = document.getElementById('breakdownList');

  // Header dos resultados
  const resultsDate       = document.getElementById('results-date');
  const resultsMotivoEl   = document.getElementById('results-motivo-badge');

  // Live region
  let resultsLiveRegion = null;

  // ── Circunferência do donut (r=78, 2πr ≈ 490) ────────────────
  const CIRCUM = 2 * Math.PI * 78; // ~490

  // ── Utilitários ──────────────────────────────────────────────
  const fmt = (cents) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
  const pct = (part, total) => total > 0 ? ((part / total) * 100).toFixed(1) + '%' : '0%';

  // ── Live Region ──────────────────────────────────────────────
  function initLiveRegion() {
    resultsLiveRegion = document.getElementById('results-live-region');
  }

  function announceResults(resultado) {
    if (!resultsLiveRegion) return;
    resultsLiveRegion.textContent =
      `Cálculo concluído. Saldo FGTS: ${fmt(resultado.saldoFinal)}. ` +
      `Multa e extras: ${fmt(resultado.multaFinal)}. ` +
      `Total a receber: ${fmt(resultado.total)}.`;
    setTimeout(() => { resultsLiveRegion.textContent = ''; }, 5000);
  }

  // ── Erros inline ─────────────────────────────────────────────
  function showError(message, element) {
    clearErrors();
    if (element) {
      element.setAttribute('aria-invalid', 'true');
      const err = document.createElement('span');
      err.className = 'error-message';
      err.id = element.id + '-error';
      err.setAttribute('role', 'alert');
      err.textContent = message;
      element.parentNode.appendChild(err);
      element.setAttribute('aria-describedby', err.id);
    } else {
      alert(message);
    }
  }

  function clearErrors() {
    document.querySelectorAll('.error-message').forEach(el => el.remove());
    document.querySelectorAll('[aria-invalid="true"]').forEach(el => {
      el.setAttribute('aria-invalid', 'false');
      el.removeAttribute('aria-describedby');
    });
  }

  // ── Donut SVG ─────────────────────────────────────────────────
  function setDonutArc(el, value, offset) {
    el.setAttribute('stroke-dasharray', `${value} ${CIRCUM - value}`);
    el.setAttribute('stroke-dashoffset', offset);
  }

  function updateDonut(saldo, multa, prop, total) {
    const denom = total || 1;
    const saldoArc = (saldo / denom) * CIRCUM;
    const multaArc = (multa / denom) * CIRCUM;
    const propArc  = (prop  / denom) * CIRCUM;

    // stroke-dashoffset: começa no topo (-90°) → offset = CIRCUM/4 + 90° offset
    const saldoOffset = CIRCUM * 0.25;
    const multaOffset = saldoOffset - saldoArc;
    const propOffset  = multaOffset - multaArc;

    setDonutArc(dSaldo, saldoArc, saldoOffset);
    setDonutArc(dMulta, multaArc, multaOffset);
    setDonutArc(dProp,  propArc,  propOffset);
  }

  // ── Badge do motivo ───────────────────────────────────────────
  function updateMotivoBadge(motivo) {
    const map = {
      dispensa_sem_causa: { label: 'Dispensa sem justa causa', cls: 'dispensa' },
      demissao_voluntaria: { label: 'Demissão voluntária',     cls: 'voluntaria' },
      outra_saida:         { label: 'Outra saída',             cls: 'outra' }
    };
    const m = map[motivo] || map.outra_saida;
    resultsMotivoEl.textContent = m.label;
    resultsMotivoEl.className = `results-badge ${m.cls}`;
  }

  // ── Breakdown detalhado ───────────────────────────────────────
  function updateBreakdown(resultado) {
    const items = [
      { label: 'Saldo FGTS',              value: resultado.saldoFinal,    color: 'var(--donut-saldo)' },
      { label: 'Multa Rescisória (40%)',   value: resultado.multaFinal,    color: 'var(--donut-multa)' },
      { label: '13º Proporcional',         value: resultado.decimoTerceiro, color: 'var(--donut-prop)' },
      { label: 'Férias Proporcionais + ⅓', value: resultado.ferias,        color: 'var(--amber)' }
    ];

    breakdownList.innerHTML = '';
    items.forEach(item => {
      const row = document.createElement('div');
      row.className = 'breakdown-row' + (item.value === 0 ? ' zero' : '');
      row.innerHTML = `
        <span class="breakdown-row-label">
          <span class="breakdown-dot" style="background:${item.color}"></span>
          ${item.label}
        </span>
        <span class="breakdown-value">${fmt(item.value)}</span>
      `;
      breakdownList.appendChild(row);
    });
  }

  // ── Atualização da UI com resultado ──────────────────────────
  function updateUI(resultado) {
    const { saldoFinal, multaFinal, decimoTerceiro, ferias, total, detalhes } = resultado;
    const extras = multaFinal + decimoTerceiro + ferias;

    // Cards principais
    saldoEl.textContent = fmt(saldoFinal);
    multaEl.textContent = fmt(extras);
    totalEl.textContent = fmt(total);

    // Header
    resultsDate.textContent = new Date().toLocaleDateString('pt-BR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
    updateMotivoBadge(detalhes.motivo);

    // Donut
    updateDonut(saldoFinal, multaFinal, decimoTerceiro + ferias, total);
    donutCenter.textContent = total > 0 ? fmt(total).replace('R$', '').trim() : '—';

    // Percentuais na legenda
    pctSaldo.textContent = pct(saldoFinal, total);
    pctMulta.textContent = pct(multaFinal, total);
    pctProp.textContent  = pct(decimoTerceiro + ferias, total);

    // Barra de progresso
    barSaldo.style.width = pct(saldoFinal, total);
    barMulta.style.width = pct(multaFinal, total);
    barProp.style.width  = pct(decimoTerceiro + ferias, total);

    // Breakdown detalhado
    updateBreakdown(resultado);

    // Exibir resultados / ocultar empty state
    emptyState.style.display   = 'none';
    resultsContent.style.display = 'flex';

    // Anuncia para leitores de tela
    announceResults(resultado);

    // Re-instancia ícones Lucide nos elementos recém-inseridos
    if (window.lucide) { window.lucide.createIcons(); }
  }

  // ── Validação e Cálculo ───────────────────────────────────────
  function validateForm() {
    clearErrors();

    const salarioCents = ValidationModule.sanitizeMonetaryValue(salarioEl.value);
    const salarioVal = ValidationModule.validateSalario(salarioCents);
    if (!salarioVal.valid) { showError(salarioVal.error, salarioEl); return { valid: false }; }

    const inicio   = ValidationModule.parseDate(inicioEl.value);
    const termino  = ValidationModule.parseDate(terminoEl.value);
    const periodoVal = ValidationModule.validatePeriodo(inicio, termino);
    if (!periodoVal.valid) { showError(periodoVal.error, terminoEl); return { valid: false }; }

    const motivoVal = ValidationModule.validateMotivo(motivoEl.value);
    if (!motivoVal.valid) { showError(motivoVal.error, motivoEl); return { valid: false }; }

    const mesesTrabalhados = ValidationModule.calcularMesesTrabalhados(inicio, termino);

    return {
      valid: true,
      data: {
        salarioCents,
        inicio, termino,
        motivo: motivoEl.value,
        mesesTrabalhados,
        incluirDecimoTerceiro: incluir13El.checked,
        incluirFerias:         incluirFeriasEl.checked,
        saqueAniversario:      saqueAniversarioEl.checked
      }
    };
  }

  function handleCalcular() {
    try {
      const validation = validateForm();
      if (!validation.valid) return;

      const { data } = validation;
      const resultado = FGTSCalculator.calcularRescisaoCompleta({
        salarioCents:          data.salarioCents,
        mesesTrabalhados:      data.mesesTrabalhados,
        motivo:                data.motivo,
        incluirDecimoTerceiro: data.incluirDecimoTerceiro,
        incluirFerias:         data.incluirFerias,
        saqueAniversario:      data.saqueAniversario
      });

      updateUI(resultado);

    } catch (err) {
      console.error('Erro no cálculo:', err);
      showError('Ocorreu um erro ao calcular. Por favor, tente novamente.', null);
    }
  }

  // ── Modal ─────────────────────────────────────────────────────
  function initModal() {
    const overlay    = document.getElementById('modal');
    const openBtn    = document.getElementById('explicar');
    const closeBtn   = document.getElementById('closeModal');
    const closeBtn2  = document.getElementById('closeModal2');

    if (!overlay || !openBtn) return;

    const open  = () => { overlay.style.display = 'grid'; closeBtn && closeBtn.focus(); };
    const close = () => { overlay.style.display = 'none'; openBtn.focus(); };

    openBtn.addEventListener('click', open);
    closeBtn  && closeBtn.addEventListener('click',  close);
    closeBtn2 && closeBtn2.addEventListener('click', close);

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && overlay.style.display === 'grid') close();
    });
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  }

  // ── Init ──────────────────────────────────────────────────────
  function init() {
    ThemeManager.init(document.getElementById('toggleTheme'));
    initLiveRegion();
    initModal();

    calcularBtn.addEventListener('click', handleCalcular);

    [salarioEl, inicioEl, terminoEl].forEach(input => {
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); handleCalcular(); }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();