import { jsPDF } from 'jspdf';
import { isSimulationSnapshot } from '../../application/Simulation';
import type { SimulationSnapshot } from '../../application/Simulation';
import { TipoContrato } from '../../core/types';
import { FormatAdapter } from '../FormatAdapter';
import { breakdownSteps, compositionParts, totalCaption } from '../../ui/presentation';

const CONTRACT: Record<TipoContrato, string> = {
  [TipoContrato.CLT_PADRAO]: 'CLT padrão',
  [TipoContrato.APRENDIZ]: 'Contrato de aprendizagem',
  [TipoContrato.DOMESTICO]: 'Trabalho doméstico',
};

// Relatório monocromático e de uma página, de propósito: poupa tinta e papel.
// Só texto preto/cinza e filetes finos; nenhuma área preenchida.
const INK = '#111111';
const MUTED = '#555555';
const RULE = '#9a9a9a';
const RULE_DARK = '#333333';

const LEFT = 18;
const RIGHT = 192;
const WIDTH = RIGHT - LEFT;
const BOTTOM = 276;
const GAP = 6;

function stamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const day = date.toLocaleDateString('pt-BR');
  const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${day}, ${time}`;
}

const compact = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 });

export async function createReport(snapshot: SimulationSnapshot): Promise<Blob> {
  if (!isSimulationSnapshot(snapshot)) {
    throw new Error('Simulação inválida ou incompatível. Não foi possível gerar o relatório.');
  }

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: false });
  doc.setLanguage('pt-BR');
  doc.setCreationDate(new Date(snapshot.createdAt));
  doc.setProperties({
    title: 'Relatório de simulação de FGTS e rescisão',
    subject: 'Estimativa educacional com valores originais da simulação',
    author: 'Simulador de FGTS',
    creator: `Simulador de FGTS ${snapshot.appVersion}`,
    keywords: 'FGTS, rescisão, estimativa, simulação',
  });

  const { input, result, timeline } = snapshot;
  let y = 0;

  const text = (
    value: string,
    x: number,
    at: number,
    options: {
      size?: number;
      bold?: boolean;
      color?: string;
      align?: 'left' | 'right' | 'center';
    } = {},
  ): void => {
    doc.setFont('helvetica', options.bold ? 'bold' : 'normal');
    doc.setFontSize(options.size ?? 8.4);
    doc.setTextColor(options.color ?? INK);
    doc.text(value, x, at, options.align ? { align: options.align } : undefined);
  };

  const rule = (x1: number, x2: number, at: number, color = RULE, width = 0.2): void => {
    doc.setDrawColor(color);
    doc.setLineWidth(width);
    doc.line(x1, at, x2, at);
  };

  const header = (): void => {
    text('SIMULADOR DE FGTS', LEFT, 13, { size: 7.2, color: MUTED });
    text(stamp(snapshot.createdAt), RIGHT, 13, { size: 7.2, color: MUTED, align: 'right' });
    rule(LEFT, RIGHT, 16, RULE, 0.3);
    y = 24;
  };

  const footer = (): void => {
    const total = doc.getNumberOfPages();
    for (let page = 1; page <= total; page += 1) {
      doc.setPage(page);
      rule(LEFT, RIGHT, 285);
      text(`Simulador de FGTS · registro ${snapshot.id} · dados pessoais`, LEFT, 288.5, {
        size: 6.4,
        color: MUTED,
      });
      text(`Página ${page} de ${total}`, RIGHT, 288.5, {
        size: 6.4,
        color: MUTED,
        align: 'right',
      });
    }
  };

  const addPage = (): void => {
    doc.addPage();
    header();
  };

  const ensure = (height: number): void => {
    if (y + height > BOTTOM) addPage();
  };

  const section = (title: string, keepWith = 16): void => {
    y += 5.5;
    ensure(9 + keepWith);
    text(title.toUpperCase(), LEFT, y, { size: 8.6, bold: true });
    y += 2;
    rule(LEFT, RIGHT, y, RULE, 0.3);
    y += 4.6;
  };

  const paragraph = (value: string, size = 7.6): void => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(size);
    for (const line of doc.splitTextToSize(value, WIDTH)) {
      ensure(3.6);
      text(line, LEFT, y, { size, color: MUTED });
      y += size * 0.46;
    }
  };

  header();

  // ---------- Título e total ----------
  text('Relatório de simulação', LEFT, y + 1, { size: 16, bold: true });
  y += 6.5;
  text(
    `Vínculo de ${FormatAdapter.civilDate(input.startDate)} a ${FormatAdapter.civilDate(input.endDate)} · ${
      input.scenario === 'TR' ? 'TR + 3% ao ano' : 'IPCA comparativo'
    }`,
    LEFT,
    y,
    { size: 8.4, color: MUTED },
  );
  y += 8;
  text('TOTAL ESTIMADO', LEFT, y, { size: 7.2, color: MUTED });
  y += 9;
  text('R$', LEFT, y, { size: 12 });
  text(FormatAdapter.amount(result.totalCents), LEFT + 7.5, y, { size: 26, bold: true });
  y += 5.5;

  const retained = result.saldoRetidoCents !== '0';
  const hasTotal = BigInt(result.totalCents) > 0n;
  text(hasTotal ? totalCaption(result) : 'Nenhuma parcela a receber neste cenário.', LEFT, y, {
    size: 8.6,
  });
  y += 3.8;
  text(
    !hasTotal
      ? 'O saldo permanece no FGTS. Estimativa bruta, sem descontos.'
      : retained
        ? 'O saldo retido no FGTS não entra neste total. Estimativa bruta, sem descontos.'
        : 'Estimativa bruta, sem descontos e sem garantia de saque.',
    LEFT,
    y,
    { size: 7.2, color: MUTED },
  );
  y += 7;

  // ---------- Resumo em duas colunas ----------
  const column = (WIDTH - GAP) / 2;
  const summary = (x: number, title: string, items: Array<[string, string]>): void => {
    text(title, x, y, { size: 7, bold: true, color: MUTED });
    rule(x, x + column, y + 2, RULE_DARK, 0.3);
    items.forEach(([label, cents], index) => {
      const at = y + 7 + index * 5.2;
      text(label, x, at, { size: 8.4 });
      text(FormatAdapter.amount(cents), x + column, at, { size: 8.4, bold: true, align: 'right' });
      rule(x, x + column, at + 1.6, RULE, 0.15);
    });
  };
  summary(LEFT, 'NO SEU FGTS', [
    ['Saldo total', result.saldoBaseCents],
    ['Disponível para saque', result.saldoDisponivelCents],
    ['Retido', result.saldoRetidoCents],
  ]);
  summary(LEFT + column + GAP, 'NA SAÍDA DO EMPREGO', [
    ['Multa rescisória', result.multaCents],
    ['13º proporcional', result.decimoTerceiroCents],
    ['Férias + 1/3', result.feriasCents],
  ]);
  y += 24;

  // ---------- De onde vem o total: barra só de contorno ----------
  const total = Number(result.totalCents);
  const shown = compositionParts.filter((part) => Number(result[part.key]) > 0);
  if (total > 0 && shown.length > 0) {
    text('DE ONDE VEM O TOTAL', LEFT, y, { size: 7, bold: true, color: MUTED });
    y += 2.6;
    let x = LEFT;
    doc.setDrawColor(INK);
    doc.setLineWidth(0.3);
    for (const part of shown) {
      const share = Number(result[part.key]) / total;
      const width = WIDTH * share;
      doc.rect(x, y, width, 5.2);
      if (width > 11) {
        text(`${Math.round(share * 100)}%`, x + width / 2, y + 3.6, {
          size: 7,
          bold: true,
          align: 'center',
        });
      }
      x += width;
    }
    y += 9.6;
    const slot = WIDTH / shown.length;
    shown.forEach((part, index) => {
      const lx = LEFT + index * slot;
      text(part.label, lx, y, { size: 7, color: MUTED });
      text(FormatAdapter.amount(result[part.key]), lx, y + 3.4, { size: 8, bold: true });
    });
    y += 4;
  }

  // ---------- Como chegamos nesses valores ----------
  section('Como chegamos nesses valores', 46);
  breakdownSteps(snapshot).forEach((step, index) => {
    ensure(6.4);
    doc.setDrawColor(INK);
    doc.setLineWidth(0.25);
    doc.circle(LEFT + 2.1, y - 1.1, 2.1, 'S');
    text(String(index + 1), LEFT + 2.1, y - 0.2, { size: 6.6, bold: true, align: 'center' });
    text(step.label, LEFT + 7.5, y, { size: 8.4, bold: true });
    text(step.hint, LEFT + 62, y, { size: 7, color: MUTED });
    text(FormatAdapter.amount(result[step.key]), RIGHT, y, {
      size: 8.6,
      bold: true,
      align: 'right',
    });
    rule(LEFT, RIGHT, y + 1.9, RULE, 0.15);
    y += 6.1;
  });
  ensure(8);
  rule(LEFT, RIGHT, y - 2.4, RULE_DARK, 0.4);
  text('Total estimado', LEFT + 7.5, y + 1.2, { size: 9, bold: true });
  text(`R$ ${FormatAdapter.amount(result.totalCents)}`, RIGHT, y + 1.2, {
    size: 9.6,
    bold: true,
    align: 'right',
  });
  y += 5.4;

  // ---------- Evolução do saldo: gráfico só de linhas ----------
  if (timeline.length > 1) {
    section('Como o seu saldo cresce', 46);
    const plotX = LEFT + 14;
    const plotW = WIDTH - 14;
    const plotH = timeline.length <= 12 ? 27 : 16;
    const peak =
      Math.max(
        1,
        ...timeline.flatMap((p) => [
          Number(p.trCents),
          Number(p.ipcaCents),
          Number(p.depositosCents),
        ]),
      ) / 100;
    const stepV = 10 ** Math.max(0, Math.floor(Math.log10(peak)) - 1);
    const maxV = Math.ceil(peak / stepV) * stepV;
    const px = (i: number): number => plotX + (i / (timeline.length - 1)) * plotW;
    const py = (v: number): number => y + plotH - (v / maxV) * plotH;

    for (const share of [0, 0.5, 1]) {
      const gy = y + plotH - share * plotH;
      rule(plotX, plotX + plotW, gy, RULE, 0.15);
      text(compact.format(maxV * share).replace(/\s/g, ' '), plotX - 2, gy + 1, {
        size: 6.4,
        color: MUTED,
        align: 'right',
      });
    }

    const stride = Math.max(1, Math.ceil(timeline.length / 120));
    const indexes = timeline
      .map((_, i) => i)
      .filter((i) => i % stride === 0 || i === timeline.length - 1);
    const series = (key: 'trCents' | 'ipcaCents' | 'depositosCents'): Array<[number, number]> =>
      indexes.map((i) => [px(i), py(Number(timeline[i]![key]) / 100)]);
    const draw = (
      key: 'trCents' | 'ipcaCents' | 'depositosCents',
      width: number,
      dash: number[],
    ) => {
      const points = series(key);
      doc.setDrawColor(key === 'trCents' ? INK : RULE_DARK);
      doc.setLineWidth(width);
      doc.setLineDashPattern(dash, 0);
      doc.lines(
        points.slice(1).map(([x, yy], i) => [x - points[i]![0], yy - points[i]![1]]),
        points[0]![0],
        points[0]![1],
        [1, 1],
        'S',
        false,
      );
      doc.setLineDashPattern([], 0);
    };
    draw('depositosCents', 0.3, [0.5, 1]);
    draw('ipcaCents', 0.35, [2, 1.3]);
    draw('trCents', 0.7, []);

    const last = timeline[timeline.length - 1]!;
    text(FormatAdapter.civilDate(timeline[0]!.competencia), plotX, y + plotH + 4.2, {
      size: 6.6,
      color: MUTED,
    });
    text(FormatAdapter.civilDate(last.competencia), plotX + plotW, y + plotH + 4.2, {
      size: 6.6,
      color: MUTED,
      align: 'right',
    });

    // Legenda alinhada à direita, na mesma linha das datas.
    const legend: Array<[string, number[], number]> = [
      ['Seu saldo (TR + 3%)', [], 0.7],
      ['O que a empresa depositou', [0.5, 1], 0.3],
      ['Só pelo IPCA (comparação)', [2, 1.3], 0.35],
    ];
    const widths = legend.map(([label]) => doc.getTextWidth(label) + 10);
    let lx = plotX + (plotW - widths.reduce((a, b) => a + b, 0)) / 2;
    legend.forEach(([label, dash, width], i) => {
      doc.setDrawColor(i === 0 ? INK : RULE_DARK);
      doc.setLineWidth(width);
      doc.setLineDashPattern(dash, 0);
      doc.line(lx, y + plotH + 3.6, lx + 5, y + plotH + 3.6);
      doc.setLineDashPattern([], 0);
      text(label, lx + 6.5, y + plotH + 4.2, { size: 6.6, color: MUTED });
      lx += widths[i]!;
    });
    y += plotH + 6;
  }

  // ---------- Dados informados ----------
  section('O que você informou', 18);
  const facts: Array<[string, string]> = [
    ['Salário mensal', FormatAdapter.centsToBRL(input.salaryCents)],
    ['Contrato', CONTRACT[input.contractType]],
    ['Admissão', FormatAdapter.civilDate(input.startDate)],
    ['Término', FormatAdapter.civilDate(input.endDate)],
    ['Motivo', FormatAdapter.getRescisaoLabel(input.terminationType)],
    ['Saque-aniversário', input.birthdayWithdrawal ? 'Sim' : 'Não'],
    ['13º pendente', input.include13 ? `${input.thirteenthMonths} de 12 avos` : 'Não incluído'],
    [
      'Férias pendentes',
      input.includeVacation ? `${input.vacationMonths} de 12 avos` : 'Não incluído',
    ],
    ['Cenário', input.scenario === 'TR' ? 'TR + 3% ao ano' : 'IPCA comparativo'],
    ['TR mensal', `${FormatAdapter.rateToPercent(input.trMonthly)}% a.m.`],
    ['IPCA mensal', `${FormatAdapter.rateToPercent(input.ipcaMonthly)}% a.m.`],
    [
      'FGTS do 13º',
      input.thirteenthMode === 'actual'
        ? 'Bases informadas'
        : input.thirteenthMode === 'estimate'
          ? 'Estimativa'
          : 'Não incluído',
    ],
  ];
  const factColumn = WIDTH / 6;
  for (let index = 0; index < facts.length; index += 6) {
    ensure(8);
    facts.slice(index, index + 6).forEach(([label, value], columnIndex) => {
      const x = LEFT + columnIndex * factColumn;
      text(label.toUpperCase(), x, y, { size: 5.8, color: MUTED });
      // Encolhe a fonte até caber; só corta se nem a menor couber.
      let size = 7.4;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(size);
      while (size > 5.8 && doc.getTextWidth(value) > factColumn - 2.5) {
        size -= 0.2;
        doc.setFontSize(size);
      }
      text(doc.splitTextToSize(value, factColumn - 2.5)[0] ?? value, x, y + 3.6, {
        size,
        bold: true,
      });
    });
    y += 7.6;
  }
  if (input.thirteenthMode === 'actual' && input.thirteenthEntries?.length) {
    paragraph(
      `Remunerações de 13º informadas (brutas; não comprovam recolhimento): ${input.thirteenthEntries
        .map(
          (entry) =>
            `${FormatAdapter.civilDate(entry.competencia)} ${FormatAdapter.centsToBRL(entry.remuneracaoCents)}`,
        )
        .join(' · ')}.`,
      7,
    );
  }

  // ---------- Série mensal ----------
  // Até 24 meses a série inteira cabe na mesma página (blocos lado a lado). Acima disso a página
  // 1 mostra o saldo no fim de cada ano e a série mensal completa segue num anexo compacto.
  const monthHeader = (x: number, width: number, at: number): void => {
    text('Competência', x, at, { size: 6.2, bold: true });
    text('Depósitos', x + width * 0.57, at, { size: 6.2, bold: true, align: 'right' });
    text('Saldo TR', x + width * 0.79, at, { size: 6.2, bold: true, align: 'right' });
    text('IPCA', x + width, at, { size: 6.2, bold: true, align: 'right' });
    rule(x, x + width, at + 1.4, RULE_DARK, 0.3);
  };
  const monthRow = (
    x: number,
    width: number,
    at: number,
    point: SimulationSnapshot['timeline'][number],
  ): void => {
    text(FormatAdapter.civilDate(point.competencia), x, at, { size: 6.6 });
    text(FormatAdapter.amount(point.depositosCents), x + width * 0.57, at, {
      size: 6.6,
      align: 'right',
    });
    text(FormatAdapter.amount(point.trCents), x + width * 0.79, at, {
      size: 6.6,
      align: 'right',
    });
    text(FormatAdapter.amount(point.ipcaCents), x + width, at, { size: 6.6, align: 'right' });
  };
  const widest = Math.max(
    ...timeline.flatMap((p) => [p.trCents, p.ipcaCents, p.depositosCents].map((c) => c.length)),
  );
  // Valores de cinco dígitos ou mais não cabem em três blocos estreitos; usa dois.
  const blocks = widest > 6 ? 2 : 3;
  const ROW = 3.8;
  const drawBlocks = (points: Array<SimulationSnapshot['timeline'][number]>): void => {
    const per = Math.ceil(points.length / blocks);
    const gap = 6;
    const tableWidth = (WIDTH - gap * (blocks - 1)) / blocks;
    ensure(5 + per * ROW);
    const top = y;
    for (let b = 0; b < blocks; b += 1) {
      const x = LEFT + b * (tableWidth + gap);
      monthHeader(x, tableWidth, top);
      points.slice(b * per, (b + 1) * per).forEach((point, row) => {
        monthRow(x, tableWidth, top + 5 + row * ROW, point);
      });
    }
    y = top + 5 + per * ROW;
  };

  if (timeline.length <= 4) {
    section('Evolução mensal (valores acumulados)', 22);
    ensure(16);
    monthHeader(LEFT, WIDTH, y);
    y += 4.6;
    for (const point of timeline) {
      monthRow(LEFT, WIDTH, y, point);
      y += 4.2;
    }
  } else if (timeline.length <= 24) {
    section('Evolução mensal (valores acumulados)', 22);
    drawBlocks(timeline);
  } else {
    const yearEnds = timeline.filter(
      (point, index) =>
        index === timeline.length - 1 ||
        point.competencia.slice(0, 4) !== timeline[index + 1]!.competencia.slice(0, 4),
    );
    if (yearEnds.length <= 24) {
      section('Resumo anual (saldo no fim de cada ano)', 22);
      drawBlocks(yearEnds);
    }
    paragraph('A série mensal completa está no anexo, na página seguinte.', 7);
  }

  // Um aviso curto no lugar da lista completa: o relatório é estimativa, não extrato.
  y += 2.5;
  paragraph(
    'Estimativa educativa e bruta, sem IRRF/INSS: não substitui o extrato da CAIXA, o cálculo de folha ou orientação profissional, nem representa diferenças da ADI 5090.',
    7,
  );

  if (timeline.length > 24) {
    addPage();
    section('Anexo: evolução mensal (valores acumulados)', 10);
    paragraph(
      'Valores em reais por competência. O IPCA é comparação econômica, não garantia legal.',
      7,
    );
    y += 1;
    const rowsPer = Math.floor((BOTTOM - y - 6) / ROW);
    for (let i = 0; i < timeline.length; i += rowsPer * blocks) {
      if (i > 0) addPage();
      drawBlocks(timeline.slice(i, i + rowsPer * blocks));
    }
  }

  footer();
  return doc.output('blob');
}
