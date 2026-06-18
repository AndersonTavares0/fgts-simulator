/**
 * Adapter: UIAdapter
 * Presentation layer — DOM manipulation and event binding.
 * Replaces the original script.js with full type safety.
 */

import { createIcons } from 'lucide';
import { TipoRescisao, TipoContrato } from '../core/types';
import type { ResultadoRescisao } from '../core/types';
import { FGTSCalculatorService } from '../core/services/FGTSCalculatorService';
import { FormatAdapter } from './FormatAdapter';
import { ContratoTrabalho } from '../core/entities/ContratoTrabalho';

// ─── Circunferência do donut (r=78, 2πr ≈ 490) ────────────────
const CIRCUM = 2 * Math.PI * 78;

/** HTML select value → TipoRescisao mapping */
const MOTIVO_MAP: Record<string, TipoRescisao> = {
  dispensa_sem_causa: TipoRescisao.DISPENSA_SEM_JUSTA_CAUSA,
  demissao_voluntaria: TipoRescisao.DEMISSAO_VOLUNTARIA,
  justa_causa: TipoRescisao.JUSTA_CAUSA,
  acordo_comum: TipoRescisao.ACORDO_COMUM,
  doenca_grave: TipoRescisao.DOENCA_GRAVE,
  aposentadoria: TipoRescisao.APOSENTADORIA,
  falecimento: TipoRescisao.FALECIMENTO,
  culpa_reciproca: TipoRescisao.CULPA_RECIPROCA,
  outra_saida: TipoRescisao.DEMISSAO_VOLUNTARIA,
};

export class UIAdapter {
  // ── DOM References ───────────────────────────────────────────
  private formEl!: HTMLFormElement;
  private salarioEl!: HTMLInputElement;
  private inicioEl!: HTMLInputElement;
  private terminoEl!: HTMLInputElement;
  private motivoEl!: HTMLSelectElement;
  private calcularBtn!: HTMLButtonElement;
  private incluir13El!: HTMLInputElement;
  private incluirFeriasEl!: HTMLInputElement;
  private saqueAniversarioEl!: HTMLInputElement;
  private isAprendizEl!: HTMLInputElement;
  private isDomesticoEl!: HTMLInputElement;
  private aprendiaOption!: HTMLElement;
  private domesticoOption!: HTMLElement;
  private healthDocsInfo!: HTMLElement;
  private exampleBtn!: HTMLButtonElement | null;
  private multaBadge!: HTMLElement | null;
  private donutTooltip!: HTMLElement | null;
  private accordionBtn!: HTMLButtonElement | null;
  private accordionContent!: HTMLElement | null;

  private saldoEl!: HTMLElement;
  private multaEl!: HTMLElement;
  private totalEl!: HTMLElement;
  private totalCard!: HTMLElement;
  private emptyState!: HTMLElement;
  private resultsContent!: HTMLElement;
  private resultsDate!: HTMLElement;
  private resultsMotivoEl!: HTMLElement;
  private breakdownList!: HTMLElement;
  private donutCenter!: HTMLElement;

  private dSaldo!: SVGCircleElement;
  private dMulta!: SVGCircleElement;
  private dProp!: SVGCircleElement;
  private dpSaldo!: SVGCircleElement;
  private dpMulta!: SVGCircleElement;
  private dpProp!: SVGCircleElement;

  private pctSaldo!: HTMLElement;
  private pctMulta!: HTMLElement;
  private pctProp!: HTMLElement;

  private barSaldo!: HTMLElement;
  private barMulta!: HTMLElement;
  private barProp!: HTMLElement;

  private resultsLiveRegion: HTMLElement | null = null;
  private isCalculating = false;

  // LGPD components
  private privacyBanner: HTMLElement | null = null;
  private privacyModal: HTMLElement | null = null;
  private privacyModalBackdrop: HTMLElement | null = null;
  private doencaGraveConsent: HTMLElement | null = null;
  private doencaGraveConsentCheck: HTMLInputElement | null = null;

  /** Initializes the adapter, capturing DOM references and binding events */
  init(): void {
    this.bindElements();
    this.bindEvents();
    this.resultsLiveRegion = document.getElementById('results-live-region');
  }

  private bindElements(): void {
    this.formEl = document.getElementById('fgtsForm') as HTMLFormElement;
    this.salarioEl = document.getElementById('salario') as HTMLInputElement;
    this.inicioEl = document.getElementById('inicio') as HTMLInputElement;
    this.terminoEl = document.getElementById('termino') as HTMLInputElement;
    this.motivoEl = document.getElementById('motivo') as HTMLSelectElement;
    this.calcularBtn = document.getElementById('calcular') as HTMLButtonElement;
    this.incluir13El = document.getElementById('incluir13') as HTMLInputElement;
    this.incluirFeriasEl = document.getElementById('incluirFerias') as HTMLInputElement;
    this.saqueAniversarioEl = document.getElementById('saqueAniversario') as HTMLInputElement;
    this.isAprendizEl = document.getElementById('isAprendiz') as HTMLInputElement;
    this.isDomesticoEl = document.getElementById('isDomestico') as HTMLInputElement;
    this.aprendiaOption = this.isAprendizEl.closest('.option-toggle') as HTMLElement;
    this.domesticoOption = this.isDomesticoEl.closest('.option-toggle') as HTMLElement;
    this.healthDocsInfo = document.getElementById('healthDocsInfo')!;
    this.exampleBtn = document.getElementById('exampleBtn') as HTMLButtonElement | null;
    this.multaBadge = document.getElementById('multaBadge') as HTMLElement | null;
    this.donutTooltip = document.getElementById('donutTooltip') as HTMLElement | null;
    this.accordionBtn = document.getElementById('accordionBtn') as HTMLButtonElement | null;
    this.accordionContent = document.getElementById('accordionContent') as HTMLElement | null;

    this.saldoEl = document.getElementById('saldo')!;
    this.multaEl = document.getElementById('multa')!;
    this.totalEl = document.getElementById('total')!;
    this.totalCard = document.querySelector('.metric-card.featured')!;
    this.emptyState = document.getElementById('emptyState')!;
    this.resultsContent = document.getElementById('resultsContent')!;
    this.resultsDate = document.getElementById('results-date')!;
    this.resultsMotivoEl = document.getElementById('results-motivo-badge')!;
    this.breakdownList = document.getElementById('breakdownList')!;
    this.donutCenter = document.getElementById('donut-center')!;

    this.dSaldo = document.getElementById('d-saldo') as unknown as SVGCircleElement;
    this.dMulta = document.getElementById('d-multa') as unknown as SVGCircleElement;
    this.dProp = document.getElementById('d-prop') as unknown as SVGCircleElement;

    this.dpSaldo = document.getElementById('dp-saldo') as unknown as SVGCircleElement;
    this.dpMulta = document.getElementById('dp-multa') as unknown as SVGCircleElement;
    this.dpProp = document.getElementById('dp-prop') as unknown as SVGCircleElement;

    this.pctSaldo = document.getElementById('pct-saldo')!;
    this.pctMulta = document.getElementById('pct-multa')!;
    this.pctProp = document.getElementById('pct-prop')!;

    this.barSaldo = document.getElementById('bar-saldo')!;
    this.barMulta = document.getElementById('bar-multa')!;
    this.barProp = document.getElementById('bar-prop')!;

    // LGPD components
    this.privacyBanner = document.getElementById('privacyBanner');
    this.privacyModal = document.getElementById('privacyModal');
    this.privacyModalBackdrop = document.getElementById('privacyModalBackdrop');
    this.doencaGraveConsent = document.getElementById('doencaGraveConsent');
    this.doencaGraveConsentCheck = document.getElementById(
      'doencaGraveConsentCheck',
    ) as HTMLInputElement | null;
  }

  private bindEvents(): void {
    this.formEl.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleCalcular();
    });

    this.salarioEl.addEventListener('input', (e) => this.handleCurrencyMask(e));

    // Real-time calculation on blur/change (non-exclusive inputs only)
    const inputs = [
      this.salarioEl,
      this.inicioEl,
      this.terminoEl,
      this.motivoEl,
      this.incluir13El,
      this.incluirFeriasEl,
    ];

    inputs.forEach((input) => {
      input.addEventListener('blur', () => this.handleCalcular());
      input.addEventListener('change', () => this.handleCalcular());
    });

    // Contract type mutual exclusivity (CLT constraint)
    this.isAprendizEl.addEventListener('change', () => {
      if (this.isAprendizEl.checked) {
        this.enforceMutualExclusion(this.isDomesticoEl, this.domesticoOption);
      } else {
        this.enableOption(this.domesticoOption);
      }
      this.handleCalcular();
    });

    this.isDomesticoEl.addEventListener('change', () => {
      if (this.isDomesticoEl.checked) {
        this.enforceMutualExclusion(this.isAprendizEl, this.aprendiaOption);
      } else {
        this.enableOption(this.aprendiaOption);
      }
      this.handleCalcular();
    });

    // Saque-Aniversário: trigger UI recalculation
    this.saqueAniversarioEl.addEventListener('change', () => {
      this.handleCalcular();
    });

    // Show/hide medical info box and consent based on selected reason
    this.motivoEl.addEventListener('change', () => {
      const isDoencaGrave = this.motivoEl.value === 'doenca_grave';
      this.healthDocsInfo.style.display = isDoencaGrave ? 'flex' : 'none';
      if (this.doencaGraveConsent) {
        this.doencaGraveConsent.style.display = isDoencaGrave ? 'flex' : 'none';
        // Reset consent when switching away from disease
        if (!isDoencaGrave && this.doencaGraveConsentCheck) {
          this.doencaGraveConsentCheck.checked = false;
        }
      }
      this.updateMultaBadge();
    });

    // Example button
    this.exampleBtn?.addEventListener('click', () => this.loadExample());

    // Accordion
    this.accordionBtn?.addEventListener('click', () => this.toggleAccordion());

    // Donut chart interactions
    this.bindDonutInteractions();

    // LGPD privacy banner and modal
    this.bindPrivacyComponents();
  }

  private handleCurrencyMask(e: Event): void {
    const input = e.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, '');
    if (value === '') {
      input.value = '';
      return;
    }
    const num = parseInt(value, 10) / 100;
    input.value = num.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  private loadExample(): void {
    this.salarioEl.value = '3.000,00';
    this.inicioEl.value = '2022-01-01';
    const today = new Date().toISOString().split('T')[0] ?? '';
    this.terminoEl.value = today;
    this.motivoEl.value = 'dispensa_sem_causa';
    this.incluir13El.checked = true;
    this.incluirFeriasEl.checked = true;
    this.saqueAniversarioEl.checked = false;
    this.isAprendizEl.checked = false;
    this.isDomesticoEl.checked = false;
    this.enableOption(this.aprendiaOption);
    this.enableOption(this.domesticoOption);
    this.healthDocsInfo.style.display = 'none';
    if (this.doencaGraveConsent) {
      this.doencaGraveConsent.style.display = 'none';
    }
    if (this.doencaGraveConsentCheck) {
      this.doencaGraveConsentCheck.checked = false;
    }
    this.updateMultaBadge();
    this.handleCalcular();
  }

  private updateMultaBadge(): void {
    if (!this.multaBadge) return;

    const multaPercentages: Record<string, number> = {
      dispensa_sem_causa: 40,
      acordo_comum: 20,
      culpa_reciproca: 20,
      demissao_voluntaria: 0,
      justa_causa: 0,
      doenca_grave: 0,
      aposentadoria: 0,
      falecimento: 0,
      outra_saida: 0,
    };

    const percent = multaPercentages[this.motivoEl.value] ?? 0;
    let colorClass = 'bg-gray-500';
    let text = 'Multa: 0%';

    if (percent === 40) {
      colorClass = 'bg-green-500';
      text = 'Multa: 40% do FGTS';
    } else if (percent === 20) {
      colorClass = 'bg-yellow-500';
      text = 'Multa: 20% do FGTS';
    }

    this.multaBadge.className = `multa-badge ${colorClass}`;
    this.multaBadge.textContent = text;
  }

  /** CLT constraint: contract types Aprendiz (2%) and Doméstico (3.2%) are mutually exclusive */
  private enforceMutualExclusion(
    targetCheckbox: HTMLInputElement,
    targetOption: HTMLElement,
  ): void {
    targetCheckbox.checked = false;
    targetOption.style.opacity = '0.45';
    targetOption.style.pointerEvents = 'none';
    targetOption.setAttribute('aria-disabled', 'true');
  }

  /** Re-enable a previously excluded contract type option */
  private enableOption(option: HTMLElement): void {
    option.style.opacity = '';
    option.style.pointerEvents = '';
    option.removeAttribute('aria-disabled');
  }

  /** Validate contract type constraints before calculation */
  private validateContractConstraints(): string | null {
    if (this.isAprendizEl.checked && this.isDomesticoEl.checked) {
      return 'Contrato de Aprendizagem e Trabalhador Doméstico são mutuamente exclusivos.';
    }
    return null;
  }

  private toggleAccordion(): void {
    if (!this.accordionBtn || !this.accordionContent) return;

    const isExpanded = this.accordionBtn.getAttribute('aria-expanded') === 'true';
    this.accordionBtn.setAttribute('aria-expanded', String(!isExpanded));
    this.accordionContent.style.display = isExpanded ? 'none' : 'block';
  }

  private bindDonutInteractions(): void {
    if (!this.donutTooltip) return;

    const segments = [
      { el: this.dSaldo, name: 'Saldo FGTS' },
      { el: this.dMulta, name: 'Multa Rescisória' },
      { el: this.dProp, name: '13º e Férias' },
    ];

    const showSegmentTooltip = (target: SVGCircleElement, name: string) => {
      const value = target.getAttribute('data-value');
      if (value && this.donutTooltip) {
        this.donutTooltip.textContent = `${name}: R$ ${value}`;
        this.donutTooltip.style.display = 'block';
        target.style.strokeWidth = '26px';
        target.style.filter = 'brightness(1.3) drop-shadow(0 0 6px currentColor)';
      }
    };

    const hideSegmentTooltip = (target: SVGCircleElement) => {
      if (this.donutTooltip) {
        this.donutTooltip.style.display = 'none';
      }
      target.style.strokeWidth = '';
      target.style.filter = '';
    };

    segments.forEach((segment) => {
      segment.el.addEventListener('mouseenter', (e) => {
        showSegmentTooltip(e.target as SVGCircleElement, segment.name);
      });

      segment.el.addEventListener('mouseleave', (e) => {
        hideSegmentTooltip(e.target as SVGCircleElement);
      });

      segment.el.addEventListener('mousemove', (e) => {
        if (this.donutTooltip) {
          this.donutTooltip.style.left = `${e.clientX + 10}px`;
          this.donutTooltip.style.top = `${e.clientY + 10}px`;
        }
      });

      segment.el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const target = e.target as SVGCircleElement;
          const isShowing = this.donutTooltip?.style.display === 'block';
          if (isShowing) {
            hideSegmentTooltip(target);
          } else {
            showSegmentTooltip(target, segment.name);
          }
        }
      });

      segment.el.addEventListener('blur', (e) => {
        hideSegmentTooltip(e.target as SVGCircleElement);
      });
    });

    // Interactive legend toggles
    const legendItems = document.querySelectorAll('.legend-item[data-legend]');
    const segmentMap: Record<string, SVGCircleElement[]> = {
      saldo: [this.dSaldo, this.dpSaldo],
      multa: [this.dMulta, this.dpMulta],
      prop: [this.dProp, this.dpProp],
    };

    legendItems.forEach((item) => {
      item.addEventListener('click', () => {
        const legend = item.getAttribute('data-legend');
        if (!legend || !segmentMap[legend]) return;

        const circles = segmentMap[legend];
        if (!circles) return;

        const firstCircle = circles[0];
        if (!firstCircle) return;

        const isChecked = item.getAttribute('aria-checked') === 'true';
        const newChecked = !isChecked;

        item.setAttribute('aria-checked', String(newChecked));
        circles.forEach((c) => c.classList.toggle('donut-segment-hidden', !newChecked));
      });

      item.addEventListener('keydown', (e: Event) => {
        const ke = e as KeyboardEvent;
        if (ke.key === 'Enter' || ke.key === ' ') {
          e.preventDefault();
          (e.target as HTMLElement).click();
        }
      });
    });
  }

  // ── LGPD Privacy Components ───────────────────────────────

  private bindPrivacyComponents(): void {
    const PRIVACY_DISMISSED_KEY = 'fgts_privacy_dismissed';

    // Check if banner was previously dismissed
    try {
      if (localStorage.getItem(PRIVACY_DISMISSED_KEY) === 'true' && this.privacyBanner) {
        this.privacyBanner.style.display = 'none';
      }
    } catch {
      /* localStorage unavailable */
    }

    // Dismiss banner
    document.getElementById('dismissPrivacyBanner')?.addEventListener('click', () => {
      if (this.privacyBanner) {
        this.privacyBanner.style.display = 'none';
        try {
          localStorage.setItem(PRIVACY_DISMISSED_KEY, 'true');
        } catch {
          /* localStorage unavailable */
        }
      }
    });

    // Open privacy modal
    document.getElementById('privacyLink')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.openPrivacyModal();
    });

    // Open privacy modal from footer button
    document.getElementById('footerPrivacyBtn')?.addEventListener('click', () => {
      this.openPrivacyModal();
    });

    // Close modal
    document.getElementById('closePrivacyModal')?.addEventListener('click', () => {
      this.closePrivacyModal();
    });

    // Close modal on backdrop click
    this.privacyModalBackdrop?.addEventListener('click', () => {
      this.closePrivacyModal();
    });

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.privacyModal?.style.display !== 'none') {
        this.closePrivacyModal();
      }
    });
  }

  private openPrivacyModal(): void {
    if (!this.privacyModal) return;
    this.privacyModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // Focus trap: focus the close button
    const closeBtn = document.getElementById('closePrivacyModal');
    closeBtn?.focus();

    // Re-initialize Lucide icons in modal
    createIcons();
  }

  private closePrivacyModal(): void {
    if (!this.privacyModal) return;
    this.privacyModal.style.display = 'none';
    document.body.style.overflow = '';
  }

  /** Checks if user has consented to health data processing */
  private hasHealthConsent(): boolean {
    return this.doencaGraveConsentCheck?.checked ?? false;
  }

  // ── Validation & Calculation ─────────────────────────────────

  private handleCalcular(): void {
    if (this.isCalculating) return;

    this.setLoading(true);

    try {
      this.clearErrors();

      // Guard: enforce legal constraints before calculation
      const constraintError = this.validateContractConstraints();
      if (constraintError) {
        this.showError(constraintError, null);
        return;
      }

      // LGPD: Check health data consent for disease grave
      const motivoValue = this.motivoEl.value;
      if (motivoValue === 'doenca_grave' && !this.hasHealthConsent()) {
        this.showError(
          'Para simular saque por doença grave, é necessário consentir com o tratamento dos seus dados de saúde (LGPD Art. 11).',
          this.doencaGraveConsent,
        );
        return;
      }

      // Validate required fields
      const errors = this.validateRequiredFields();
      if (errors.length > 0) {
        this.showErrors(errors);
        return;
      }

      // Parse and validate salary
      const salario = FormatAdapter.parseMonetaryInput(this.salarioEl.value);
      if (!salario) {
        this.showError('Informe um salário válido maior que zero.', this.salarioEl);
        return;
      }

      // Parse dates
      const inicio = FormatAdapter.parseDate(this.inicioEl.value);
      const termino = FormatAdapter.parseDate(this.terminoEl.value);

      if (!inicio || !termino) {
        this.showError('Datas de início e término são obrigatórias.', this.terminoEl);
        return;
      }

      // Contract validation
      const validacao = ContratoTrabalho.validar({
        salarioBruto: salario,
        dataInicio: inicio,
        dataTermino: termino,
      });

      if (!validacao.valid) {
        this.showError(validacao.error!, this.terminoEl);
        return;
      }

      // Calculate months
      const mesesTrabalhados = ContratoTrabalho.calcularMesesTrabalhados(inicio, termino);

      // Map reason
      const tipoRescisao = MOTIVO_MAP[motivoValue] ?? TipoRescisao.DEMISSAO_VOLUNTARIA;

      // Detect contract type (CLT, Apprentice, or Domestic)
      const tipoContrato = this.isDomesticoEl.checked
        ? TipoContrato.DOMESTICO
        : this.isAprendizEl.checked
          ? TipoContrato.APRENDIZ
          : TipoContrato.CLT_PADRAO;

      // Calculate total historical deposit for fine (Art. 18, Lei 8.036/1990)
      const depositoMensal = FGTSCalculatorService.calcularDepositoMensal(salario, tipoContrato);
      const depositoHistoricoTotal = depositoMensal.multiply(mesesTrabalhados);

      // Execute calculation
      const resultado = FGTSCalculatorService.calcularRescisao({
        salarioBruto: salario,
        mesesTrabalhados,
        tipoRescisao,
        tipoContrato,
        incluirDecimoTerceiro: this.incluir13El.checked,
        incluirFerias: this.incluirFeriasEl.checked,
        saqueAniversario: this.saqueAniversarioEl.checked,
        depositoHistoricoTotal,
      });

      this.updateUI(resultado);
    } catch (err) {
      console.error('Calculation error:', err);
      this.showError('Ocorreu um erro ao calcular. Por favor, tente novamente.', null);
    } finally {
      this.setLoading(false);
    }
  }

  /** Validates all required fields and returns array of errors with element references */
  private validateRequiredFields(): Array<{ message: string; element: HTMLElement }> {
    const errors: Array<{ message: string; element: HTMLElement }> = [];

    // Salary
    const salarioValue = this.salarioEl.value.trim();
    if (!salarioValue) {
      errors.push({ message: 'Salário bruto é obrigatório.', element: this.salarioEl });
    }

    // Start date
    const inicioValue = this.inicioEl.value.trim();
    if (!inicioValue) {
      errors.push({ message: 'Data de início é obrigatória.', element: this.inicioEl });
    }

    // End date
    const terminoValue = this.terminoEl.value.trim();
    if (!terminoValue) {
      errors.push({ message: 'Data de término é obrigatória.', element: this.terminoEl });
    }

    // Reason (select always has a value, but double-check)
    const motivoValue = this.motivoEl.value;
    if (!motivoValue) {
      errors.push({ message: 'Motivo da saída é obrigatório.', element: this.motivoEl });
    }

    return errors;
  }

  private setLoading(isLoading: boolean): void {
    this.isCalculating = isLoading;
    this.calcularBtn.disabled = isLoading;

    if (isLoading) {
      this.calcularBtn.setAttribute('aria-busy', 'true');
      this.calcularBtn.innerHTML = `
        <svg class="icon-sm loading-spinner" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
          <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round">
            <animate attributeName="stroke-dasharray" from="0 60" to="60 0" dur="1s" repeatCount="indefinite"/>
          </path>
        </svg>
        <span>Calculando...</span>
      `;
    } else {
      this.calcularBtn.removeAttribute('aria-busy');
      this.calcularBtn.innerHTML = `
        <i data-lucide="calculator" class="icon-sm" aria-hidden="true"></i>
        <span>Calcular Rescisão</span>
      `;
      createIcons();
    }
  }

  // ── UI Update ────────────────────────────────────────────────

  private updateUI(resultado: ResultadoRescisao): void {
    const { saldoFinal, multaFinal, decimoTerceiro, ferias, total, detalhes } = resultado;
    const extras = multaFinal.add(decimoTerceiro).add(ferias);

    // Main metric cards
    this.saldoEl.textContent = saldoFinal.toBRL();
    this.multaEl.textContent = extras.toBRL();
    this.totalEl.textContent = total.toBRL();

    // Header
    this.resultsDate.textContent = FormatAdapter.formatDateFull(new Date());
    const rescisaoInfo = FormatAdapter.getRescisaoLabel(detalhes.tipoRescisao);
    this.resultsMotivoEl.textContent = rescisaoInfo.label;
    this.resultsMotivoEl.className = `results-badge ${rescisaoInfo.cssClass}`;

    // Donut
    this.updateDonut(
      saldoFinal.cents,
      multaFinal.cents,
      decimoTerceiro.cents + ferias.cents,
      total.cents,
    );
    this.donutCenter.textContent = total.isPositive()
      ? total.toBRL().replace('R$', '').trim()
      : '—';

    // Percentages
    const pct = (part: number, tot: number) => FormatAdapter.formatPercent(part, tot);
    this.pctSaldo.textContent = pct(saldoFinal.cents, total.cents);
    this.pctMulta.textContent = pct(multaFinal.cents, total.cents);
    this.pctProp.textContent = pct(decimoTerceiro.cents + ferias.cents, total.cents);

    // Progress bar
    this.barSaldo.style.width = pct(saldoFinal.cents, total.cents);
    this.barMulta.style.width = pct(multaFinal.cents, total.cents);
    this.barProp.style.width = pct(decimoTerceiro.cents + ferias.cents, total.cents);

    // Breakdown
    this.updateBreakdown(resultado);

    // Show results
    this.emptyState.style.display = 'none';
    this.resultsContent.style.display = 'flex';

    // Accessibility
    this.announceResults(resultado);

    // Success flash
    this.totalCard.classList.add('calc-flash');
    setTimeout(() => {
      this.totalCard.classList.remove('calc-flash');
    }, 600);

    // Re-instantiate Lucide icons only on new elements
    createIcons();
  }

  private updateDonut(saldo: number, multa: number, prop: number, total: number): void {
    const denom = total || 1;
    const saldoArc = (saldo / denom) * CIRCUM;
    const multaArc = (multa / denom) * CIRCUM;
    const propArc = (prop / denom) * CIRCUM;

    const saldoOffset = CIRCUM * 0.25;
    const multaOffset = saldoOffset - saldoArc;
    const propOffset = multaOffset - multaArc;

    this.setDonutArc(this.dSaldo, saldoArc, saldoOffset);
    this.setDonutArc(this.dMulta, multaArc, multaOffset);
    this.setDonutArc(this.dProp, propArc, propOffset);

    this.setDonutArc(this.dpSaldo, saldoArc, saldoOffset);
    this.setDonutArc(this.dpMulta, multaArc, multaOffset);
    this.setDonutArc(this.dpProp, propArc, propOffset);

    // Add data attributes for tooltips
    const formatValue = (cents: number) =>
      (cents / 100).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

    this.dSaldo.setAttribute('data-value', formatValue(saldo));
    this.dMulta.setAttribute('data-value', formatValue(multa));
    this.dProp.setAttribute('data-value', formatValue(prop));
  }

  private setDonutArc(el: SVGCircleElement, value: number, offset: number): void {
    el.setAttribute('stroke-dasharray', `${value} ${CIRCUM - value}`);
    el.setAttribute('stroke-dashoffset', String(offset));
  }

  private updateBreakdown(resultado: ResultadoRescisao): void {
    const correcaoLabel =
      resultado.correcao.indexadorUtilizado === 'TR'
        ? 'Correção estimada (TR + 3% a.a.)'
        : 'Correção estimada (IPCA como piso ADI 5090)';

    const items = [
      { label: 'Saldo FGTS', value: resultado.saldoFinal, color: 'var(--donut-saldo)' },
      {
        label: 'Saldo retido na conta FGTS',
        value: resultado.saldoRetido,
        color: 'var(--muted)',
      },
      {
        label: `Multa Rescisória (${resultado.multa.percentualAplicado}%)`,
        value: resultado.multaFinal,
        color: 'var(--donut-multa)',
      },
      { label: '13º Proporcional', value: resultado.decimoTerceiro, color: 'var(--donut-prop)' },
      { label: 'Férias Proporcionais + ⅓', value: resultado.ferias, color: 'var(--amber)' },
      {
        label: correcaoLabel,
        value: resultado.detalhes.correcaoEstimada,
        color: 'var(--teal)',
      },
    ];

    this.breakdownList.innerHTML = '';
    items.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'breakdown-row' + (item.value.cents <= 0 ? ' zero' : '');

      const labelSpan = document.createElement('span');
      labelSpan.className = 'breakdown-row-label';

      const dotSpan = document.createElement('span');
      dotSpan.className = 'breakdown-dot';
      dotSpan.style.background = item.color;
      labelSpan.appendChild(dotSpan);

      labelSpan.appendChild(document.createTextNode(` ${item.label}`));

      const valueSpan = document.createElement('span');
      valueSpan.className = 'breakdown-value';
      valueSpan.textContent = item.value.toBRL();

      row.appendChild(labelSpan);
      row.appendChild(valueSpan);
      this.breakdownList.appendChild(row);
    });

    // Birthday Withdrawal info box
    const infoBox = document.getElementById('saqueAniversarioInfo');
    const valorSaqueAnualEl = document.getElementById('valorSaqueAnual');
    if (resultado.saqueAniversario && infoBox && valorSaqueAnualEl) {
      infoBox.style.display = 'flex';
      valorSaqueAnualEl.textContent = resultado.saqueAniversario.valorSaque.toBRL();
    } else if (infoBox) {
      infoBox.style.display = 'none';
    }

    // Saque-Aniversário restriction warning (Art. 20-D, Lei 8.036/90)
    const restrictionBox = document.getElementById('saqueAniversarioRestriction');
    if (restrictionBox) {
      restrictionBox.style.display = resultado.saqueAniversario ? 'flex' : 'none';
      const restrictionText = restrictionBox.querySelector('p');
      if (restrictionText && resultado.saqueAniversario) {
        restrictionText.textContent = resultado.saldoRetido.isZero()
          ? 'Saque-Aniversário ativo: esta hipótese legal preserva o saque integral do saldo do FGTS.'
          : 'Atenção: com o Saque-Aniversário ativo, você não pode sacar o saldo integral do FGTS na rescisão. Apenas a multa rescisória (40%/20%) permanece disponível para saque imediato.';
      }
    }
  }

  // ── Errors & Accessibility ───────────────────────────────────

  private showError(message: string, element: HTMLElement | null): void {
    this.clearErrors();
    this.hideResults();
    if (element) {
      this.renderFieldError(message, element);
    } else {
      alert(message);
    }
  }

  private showErrors(errors: Array<{ message: string; element: HTMLElement }>): void {
    this.clearErrors();
    this.hideResults();
    errors.forEach(({ message, element }) => {
      this.renderFieldError(message, element);
    });
  }

  private renderFieldError(message: string, element: HTMLElement): void {
    element.setAttribute('aria-invalid', 'true');
    const err = document.createElement('span');
    err.className = 'error-message';
    err.id = element.id + '-error';
    err.setAttribute('role', 'alert');
    err.textContent = message;
    element.parentElement?.insertAdjacentElement('afterend', err);
    element.setAttribute('aria-describedby', err.id);
  }

  private hideResults(): void {
    this.resultsContent.style.display = 'none';
    this.emptyState.style.display = 'flex';
  }

  private clearErrors(): void {
    document.querySelectorAll('.error-message').forEach((el) => el.remove());
    document.querySelectorAll('[aria-invalid="true"]').forEach((el) => {
      el.setAttribute('aria-invalid', 'false');
      el.removeAttribute('aria-describedby');
    });
  }

  private announceResults(resultado: ResultadoRescisao): void {
    if (!this.resultsLiveRegion) return;
    this.resultsLiveRegion.textContent =
      `Cálculo concluído. Saldo FGTS: ${resultado.saldoFinal.toBRL()}. ` +
      `Multa e extras: ${resultado.multaFinal.toBRL()}. ` +
      `Total a receber: ${resultado.total.toBRL()}.`;
    setTimeout(() => {
      this.resultsLiveRegion!.textContent = '';
    }, 5000);
  }
}
