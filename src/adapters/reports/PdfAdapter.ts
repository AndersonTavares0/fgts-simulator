import { jsPDF } from 'jspdf';
import { isSimulationSnapshot } from '../../application/Simulation';
import type { SimulationSnapshot } from '../../application/Simulation';
import { TipoContrato } from '../../core/types';
import { FormatAdapter } from '../FormatAdapter';
import { totalCaption } from '../../ui/presentation';

const CONTRACT: Record<TipoContrato, string> = {
  [TipoContrato.CLT_PADRAO]: 'CLT padrão',
  [TipoContrato.APRENDIZ]: 'Contrato de aprendizagem',
  [TipoContrato.DOMESTICO]: 'Trabalho doméstico',
};

// Relatório monocromático: texto preto, filetes cinza, nenhum preenchimento.
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

  let y = 0;

  const header = (): void => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(MUTED);
    doc.text('SIMULADOR DE FGTS', LEFT, 13);
    doc.text(stamp(snapshot.createdAt), RIGHT, 13, { align: 'right' });
    doc.setDrawColor(RULE);
    doc.setLineWidth(0.3);
    doc.line(LEFT, 16, RIGHT, 16);
    y = 24;
  };

  const footer = (): void => {
    const total = doc.getNumberOfPages();
    for (let page = 1; page <= total; page += 1) {
      doc.setPage(page);
      doc.setDrawColor(RULE);
      doc.setLineWidth(0.2);
      doc.line(LEFT, 285, RIGHT, 285);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.4);
      doc.setTextColor(MUTED);
      doc.text(`Simulador de FGTS · registro ${snapshot.id} · dados pessoais`, LEFT, 288.5);
      doc.text(`Página ${page} de ${total}`, RIGHT, 288.5, { align: 'right' });
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
    y += 7;
    ensure(9 + keepWith);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.6);
    doc.setTextColor(INK);
    doc.text(title.toUpperCase(), LEFT, y);
    y += 2;
    doc.setDrawColor(RULE);
    doc.setLineWidth(0.3);
    doc.line(LEFT, y, RIGHT, y);
    y += 4.4;
  };

  const paragraph = (text: string, size = 7.6, width = WIDTH, x = LEFT): void => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(size);
    doc.setTextColor(MUTED);
    for (const line of doc.splitTextToSize(text, width)) {
      ensure(3.6);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(size);
      doc.setTextColor(MUTED);
      doc.text(line, x, y);
      y += size * 0.46;
    }
  };

  const rows = (
    items: Array<[string, string]>,
    strongLast = false,
    width = WIDTH,
    x = LEFT,
  ): void => {
    for (const [index, [label, cents]] of items.entries()) {
      const strong = strongLast && index === items.length - 1;
      ensure(5.4);
      doc.setFont('helvetica', strong ? 'bold' : 'normal');
      doc.setFontSize(8.4);
      doc.setTextColor(INK);
      doc.text(label, x, y);
      doc.text(FormatAdapter.amount(cents), x + width, y, { align: 'right' });
      doc.setDrawColor(RULE);
      doc.setLineWidth(0.15);
      doc.line(x, y + 1.6, x + width, y + 1.6);
      y += 5.4;
    }
  };

  header();

  // Título e total
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(INK);
  doc.text('Relatório de simulação', LEFT, y + 2);
  y += 7.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.4);
  doc.setTextColor(MUTED);
  const period = `Vínculo de ${FormatAdapter.civilDate(inputStart(snapshot))} a ${FormatAdapter.civilDate(inputEnd(snapshot))} · ${
    snapshot.input.scenario === 'TR' ? 'TR + 3% ao ano' : 'IPCA comparativo'
  }`;
  doc.text(period, LEFT, y);
  y += 9;

  doc.setFontSize(7.2);
  doc.setTextColor(MUTED);
  doc.text('TOTAL ESTIMADO', LEFT, y);
  y += 3;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(INK);
  doc.text(`${FormatAdapter.amount(snapshot.result.totalCents)}`, LEFT + 7, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.text('R$', LEFT, y + 6);
  y += 10;

  const retained = snapshot.result.saldoRetidoCents !== '0';
  const hasTotal = BigInt(snapshot.result.totalCents) > 0n;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.6);
  doc.setTextColor(INK);
  doc.text(
    hasTotal ? totalCaption(snapshot.result) : 'Nenhuma parcela a receber neste cenário.',
    LEFT,
    y,
  );
  y += 4;
  doc.setFontSize(7.2);
  doc.setTextColor(MUTED);
  doc.text(
    !hasTotal
      ? 'O saldo permanece no FGTS. Estimativa bruta, sem descontos.'
      : retained
        ? 'O saldo retido no FGTS não entra neste total. Estimativa bruta, sem descontos.'
        : 'Estimativa bruta, sem descontos e sem garantia de saque.',
    LEFT,
    y,
  );
  y += 7;

  // Resumo em duas colunas
  const column = (WIDTH - GAP) / 2;
  const summaryTop = y;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(MUTED);
  doc.text('FGTS', LEFT, y);
  doc.text('RESCISÃO', LEFT + column + GAP, y);
  y += 2;
  doc.setDrawColor(RULE_DARK);
  doc.setLineWidth(0.3);
  doc.line(LEFT, y, LEFT + column, y);
  doc.line(LEFT + column + GAP, y, RIGHT, y);
  y += 4;
  const fgtsRows = [
    ['Saldo total no FGTS', snapshot.result.saldoBaseCents] as [string, string],
    ['Disponível para saque', snapshot.result.saldoDisponivelCents] as [string, string],
    ['Retido no FGTS', snapshot.result.saldoRetidoCents] as [string, string],
  ];
  const rescisaoRows = [
    ['Multa rescisória', snapshot.result.multaCents] as [string, string],
    ['13º proporcional', snapshot.result.decimoTerceiroCents] as [string, string],
    ['Férias + 1/3', snapshot.result.feriasCents] as [string, string],
  ];
  const savedY = y;
  rows(fgtsRows, false, column, LEFT);
  const leftEnd = y;
  y = savedY;
  rows(rescisaoRows, false, column, LEFT + column + GAP);
  y = Math.max(leftEnd, y) + 2;
  void summaryTop;

  // Dados contratuais
  section('Dados contratuais');
  const input = snapshot.input;
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
  const factColumn = WIDTH / 4;
  for (let index = 0; index < facts.length; index += 4) {
    ensure(8.4);
    facts.slice(index, index + 4).forEach(([label, value], columnIndex) => {
      const x = LEFT + columnIndex * factColumn;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.4);
      doc.setTextColor(MUTED);
      doc.text(label.toUpperCase(), x, y);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(INK);
      doc.text(doc.splitTextToSize(value, factColumn - 4)[0] ?? value, x, y + 4);
    });
    y += 7.6;
  }
  if (input.thirteenthMode === 'actual' && input.thirteenthEntries?.length) {
    section('Remunerações do 13º informadas', 12);
    paragraph('Valores brutos informados por competência; não comprovam recolhimento.');
    rows(
      input.thirteenthEntries.map((entry) => [
        FormatAdapter.civilDate(entry.competencia),
        entry.remuneracaoCents,
      ]),
    );
  }

  // Memória de cálculo
  section('Memória de cálculo');
  const verbas = (
    BigInt(snapshot.result.multaCents) +
    BigInt(snapshot.result.decimoTerceiroCents) +
    BigInt(snapshot.result.feriasCents)
  ).toString();
  rows(
    [
      ['Depósitos acumulados', snapshot.result.depositosCents],
      ['Rendimento estimado no cenário', snapshot.result.rendimentoCents],
      ['Saldo do FGTS com correção', snapshot.result.saldoBaseCents],
      ['Verbas rescisórias (multa + 13º + férias)', verbas],
      ['Total estimado', snapshot.result.totalCents],
    ],
    true,
  );

  // Série mensal: tabela única até 8 competências, duas colunas até 24, paginada acima.
  section('Evolução mensal (valores acumulados)', 24);
  paragraph(
    'Valores em reais por competência. O IPCA é comparação econômica, não garantia legal.',
    7.2,
  );
  y += 1.2;

  const drawMonthHeader = (x: number, width: number, headerY: number): void => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(INK);
    doc.text('Competência', x, headerY);
    doc.text('Depósitos', x + width - 38, headerY, { align: 'right' });
    doc.text('Saldo TR', x + width - 19, headerY, { align: 'right' });
    doc.text('IPCA', x + width, headerY, { align: 'right' });
    doc.setDrawColor(RULE_DARK);
    doc.setLineWidth(0.3);
    doc.line(x, headerY + 1.4, x + width, headerY + 1.4);
  };

  const drawMonthRow = (
    x: number,
    width: number,
    rowY: number,
    point: SimulationSnapshot['timeline'][number],
  ): void => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(INK);
    doc.text(FormatAdapter.civilDate(point.competencia), x, rowY);
    doc.text(FormatAdapter.amount(point.depositosCents), x + width - 38, rowY, { align: 'right' });
    doc.text(FormatAdapter.amount(point.trCents), x + width - 19, rowY, { align: 'right' });
    doc.text(FormatAdapter.amount(point.ipcaCents), x + width, rowY, { align: 'right' });
  };

  const timeline = snapshot.timeline;
  if (timeline.length > 8 && timeline.length <= 24) {
    const half = Math.ceil(timeline.length / 2);
    const tableWidth = (WIDTH - 8) / 2;
    const top = y;
    drawMonthHeader(LEFT, tableWidth, top);
    drawMonthHeader(LEFT + tableWidth + 8, tableWidth, top);
    let leftY = top + 5;
    let rightY = top + 5;
    for (const point of timeline.slice(0, half)) {
      drawMonthRow(LEFT, tableWidth, leftY, point);
      leftY += 4;
    }
    for (const point of timeline.slice(half)) {
      drawMonthRow(LEFT + tableWidth + 8, tableWidth, rightY, point);
      rightY += 4;
    }
    y = Math.max(leftY, rightY);
  } else {
    const drawHeader = (): void => {
      drawMonthHeader(LEFT, WIDTH, y);
      y += 4.6;
    };
    ensure(16);
    drawHeader();
    for (const point of timeline) {
      if (y + 4 > BOTTOM) {
        addPage();
        drawHeader();
      }
      drawMonthRow(LEFT, WIDTH, y, point);
      y += 4.2;
    }
  }

  // Um aviso curto no lugar da lista completa: o relatório é estimativa, não extrato.
  y += 3;
  paragraph(
    'Estimativa educativa e bruta, sem IRRF/INSS: não substitui o extrato da CAIXA, o cálculo de folha ou orientação profissional, nem representa diferenças da ADI 5090.',
    7.2,
  );

  footer();
  return doc.output('blob');
}

function inputStart(snapshot: SimulationSnapshot): string {
  return snapshot.input.startDate;
}

function inputEnd(snapshot: SimulationSnapshot): string {
  return snapshot.input.endDate;
}
