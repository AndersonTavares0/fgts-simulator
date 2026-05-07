/**
 * Adapter: UIAdapter
 * Camada de apresentação — manipulação do DOM e binding de eventos.
 * Substitui o script.js original com type safety completa.
 */

import { TipoRescisao, TipoContrato } from '../core/types';
import type { ResultadoRescisao } from '../core/types';
import { FGTSCalculatorService } from '../core/services/FGTSCalculatorService';
import { FormatAdapter } from './FormatAdapter';
import { ContratoTrabalho } from '../core/entities/ContratoTrabalho';

// ─── Circunferência do donut (r=78, 2πr ≈ 490) ────────────────
const CIRCUM = 2 * Math.PI * 78;

/** Mapeamento de valor do select HTML → TipoRescisao */
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
  // ── Referências DOM ─────────────────────────────────────────
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
  private healthDocsInfo!: HTMLElement;

  private saldoEl!: HTMLElement;
  private multaEl!: HTMLElement;
  private totalEl!: HTMLElement;
  private emptyState!: HTMLElement;
  private resultsContent!: HTMLElement;
  private resultsDate!: HTMLElement;
  private resultsMotivoEl!: HTMLElement;
  private breakdownList!: HTMLElement;
  private donutCenter!: HTMLElement;

  private dSaldo!: SVGCircleElement;
  private dMulta!: SVGCircleElement;
  private dProp!: SVGCircleElement;

  private pctSaldo!: HTMLElement;
  private pctMulta!: HTMLElement;
  private pctProp!: HTMLElement;

  private barSaldo!: HTMLElement;
  private barMulta!: HTMLElement;
  private barProp!: HTMLElement;

  private resultsLiveRegion: HTMLElement | null = null;

  /** Inicializa o adapter, capturando referências DOM e ligando eventos */
  init(): void {
    this.bindElements();
    this.bindEvents();
    this.bindModalEvents();
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
    this.healthDocsInfo = document.getElementById('healthDocsInfo')!;

    this.saldoEl = document.getElementById('saldo')!;
    this.multaEl = document.getElementById('multa')!;
    this.totalEl = document.getElementById('total')!;
    this.emptyState = document.getElementById('emptyState')!;
    this.resultsContent = document.getElementById('resultsContent')!;
    this.resultsDate = document.getElementById('results-date')!;
    this.resultsMotivoEl = document.getElementById('results-motivo-badge')!;
    this.breakdownList = document.getElementById('breakdownList')!;
    this.donutCenter = document.getElementById('donut-center')!;

    this.dSaldo = document.getElementById('d-saldo') as unknown as SVGCircleElement;
    this.dMulta = document.getElementById('d-multa') as unknown as SVGCircleElement;
    this.dProp = document.getElementById('d-prop') as unknown as SVGCircleElement;

    this.pctSaldo = document.getElementById('pct-saldo')!;
    this.pctMulta = document.getElementById('pct-multa')!;
    this.pctProp = document.getElementById('pct-prop')!;

    this.barSaldo = document.getElementById('bar-saldo')!;
    this.barMulta = document.getElementById('bar-multa')!;
    this.barProp = document.getElementById('bar-prop')!;
  }

  private bindEvents(): void {
    this.formEl.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleCalcular();
    });

    this.salarioEl.addEventListener('input', (e) => this.handleCurrencyMask(e));

    // Show/hide medical info box based on selected reason
    this.motivoEl.addEventListener('change', () => {
      const isDoencaGrave = this.motivoEl.value === 'doenca_grave';
      this.healthDocsInfo.style.display = isDoencaGrave ? 'flex' : 'none';
    });
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

  private bindModalEvents(): void {
    const overlay = document.getElementById('modal');
    const openBtn = document.getElementById('explicar');
    const closeBtn = document.getElementById('closeModal');
    const closeBtn2 = document.getElementById('closeModal2');

    if (!overlay || !openBtn) return;

    const open = (): void => {
      overlay.style.display = 'grid';
      closeBtn?.focus();
    };
    const close = (): void => {
      overlay.style.display = 'none';
      openBtn.focus();
    };

    openBtn.addEventListener('click', open);
    closeBtn?.addEventListener('click', close);
    closeBtn2?.addEventListener('click', close);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.style.display === 'grid') close();
    });
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });
  }

  // ── Validação e Cálculo ──────────────────────────────────────

  private handleCalcular(): void {
    try {
      this.clearErrors();

      // Parse e validação do salário
      const salario = FormatAdapter.parseMonetaryInput(this.salarioEl.value);
      if (!salario) {
        this.showError('Informe um salário válido maior que zero.', this.salarioEl);
        return;
      }

      // Parse de datas
      const inicio = FormatAdapter.parseDate(this.inicioEl.value);
      const termino = FormatAdapter.parseDate(this.terminoEl.value);

      if (!inicio || !termino) {
        this.showError('Datas de início e término são obrigatórias.', this.terminoEl);
        return;
      }

      // Validação do contrato
      const validacao = ContratoTrabalho.validar({
        salarioBruto: salario,
        dataInicio: inicio,
        dataTermino: termino,
      });

      if (!validacao.valid) {
        this.showError(validacao.error!, this.terminoEl);
        return;
      }

      // Calcular meses
      const mesesTrabalhados = ContratoTrabalho.calcularMesesTrabalhados(inicio, termino);

      // Mapear motivo
      const motivoValue = this.motivoEl.value;
      const tipoRescisao = MOTIVO_MAP[motivoValue] ?? TipoRescisao.DEMISSAO_VOLUNTARIA;

      // Detectar tipo de contrato (CLT, Aprendiz, ou Doméstico)
      const tipoContrato = this.isDomesticoEl.checked
        ? TipoContrato.DOMESTICO
        : this.isAprendizEl.checked
          ? TipoContrato.APRENDIZ
          : TipoContrato.CLT_PADRAO;

      // Calcular depósito histórico total para multa (Art. 18, Lei 8.036/1990)
      const depositoMensal = FGTSCalculatorService.calcularDepositoMensal(salario, tipoContrato);
      const depositoHistoricoTotal = depositoMensal.multiply(mesesTrabalhados);

      // Executar cálculo
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
      console.error('Erro no cálculo:', err);
      this.showError('Ocorreu um erro ao calcular. Por favor, tente novamente.', null);
    }
  }

  // ── Atualização da UI ───────────────────────────────────────

  private updateUI(resultado: ResultadoRescisao): void {
    const { saldoFinal, multaFinal, decimoTerceiro, ferias, total, detalhes } = resultado;
    const extras = multaFinal.add(decimoTerceiro).add(ferias);

    // Cards principais
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

    // Percentuais
    const pct = (part: number, tot: number) => FormatAdapter.formatPercent(part, tot);
    this.pctSaldo.textContent = pct(saldoFinal.cents, total.cents);
    this.pctMulta.textContent = pct(multaFinal.cents, total.cents);
    this.pctProp.textContent = pct(decimoTerceiro.cents + ferias.cents, total.cents);

    // Barra de progresso
    this.barSaldo.style.width = pct(saldoFinal.cents, total.cents);
    this.barMulta.style.width = pct(multaFinal.cents, total.cents);
    this.barProp.style.width = pct(decimoTerceiro.cents + ferias.cents, total.cents);

    // Breakdown
    this.updateBreakdown(resultado);

    // Exibir resultados
    this.emptyState.style.display = 'none';
    this.resultsContent.style.display = 'flex';

    // Acessibilidade
    this.announceResults(resultado);

    // Re-instancia ícones Lucide apenas nos elementos novos
    const lucide = window.lucide;
    if (lucide) {
      const newIcons = this.resultsContent.querySelectorAll(
        '[data-lucide]:not(.lucide-initialized)',
      );
      if (newIcons.length > 0) {
        lucide.createIcons({ nodes: Array.from(newIcons) });
        newIcons.forEach((el) => el.classList.add('lucide-initialized'));
      }
    }
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
  }

  private setDonutArc(el: SVGCircleElement, value: number, offset: number): void {
    el.setAttribute('stroke-dasharray', `${value} ${CIRCUM - value}`);
    el.setAttribute('stroke-dashoffset', String(offset));
  }

  private updateBreakdown(resultado: ResultadoRescisao): void {
    const items = [
      { label: 'Saldo FGTS', value: resultado.saldoFinal, color: 'var(--donut-saldo)' },
      {
        label: `Multa Rescisória (${resultado.multa.percentualAplicado}%)`,
        value: resultado.multaFinal,
        color: 'var(--donut-multa)',
      },
      { label: '13º Proporcional', value: resultado.decimoTerceiro, color: 'var(--donut-prop)' },
      { label: 'Férias Proporcionais + ⅓', value: resultado.ferias, color: 'var(--amber)' },
      {
        label: `Correção Estimada (${resultado.correcao.indexadorUtilizado}+3%)`,
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

    // Saque-Aniversário info box
    const infoBox = document.getElementById('saqueAniversarioInfo');
    const valorSaqueAnualEl = document.getElementById('valorSaqueAnual');
    if (resultado.saqueAniversario && infoBox && valorSaqueAnualEl) {
      infoBox.style.display = 'flex';
      valorSaqueAnualEl.textContent = resultado.saqueAniversario.valorSaque.toBRL();
    } else if (infoBox) {
      infoBox.style.display = 'none';
    }
  }

  // ── Erros e Acessibilidade ──────────────────────────────────

  private showError(message: string, element: HTMLElement | null): void {
    this.clearErrors();
    if (element) {
      element.setAttribute('aria-invalid', 'true');
      const err = document.createElement('span');
      err.className = 'error-message';
      err.id = element.id + '-error';
      err.setAttribute('role', 'alert');
      err.textContent = message;
      element.parentNode?.appendChild(err);
      element.setAttribute('aria-describedby', err.id);
    } else {
      alert(message);
    }
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
