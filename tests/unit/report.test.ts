import { describe, expect, it } from 'vitest';
import { simulate } from '../../src/application/Simulation';
import type { SimulationInput } from '../../src/application/Simulation';
import { createReport } from '../../src/adapters/reports/PdfAdapter';
import { totalCaption } from '../../src/ui/presentation';
import { TipoContrato, TipoRescisao } from '../../src/core/types';

const INPUT: SimulationInput = {
  salaryCents: '300000',
  startDate: '2025-01-01',
  endDate: '2025-12-31',
  terminationType: TipoRescisao.DISPENSA_SEM_JUSTA_CAUSA,
  contractType: TipoContrato.CLT_PADRAO,
  include13: true,
  includeVacation: true,
  thirteenthMonths: 4,
  vacationMonths: 5,
  birthdayWithdrawal: false,
  trMonthly: '0.0008',
  ipcaMonthly: '0.004',
  scenario: 'TR',
};

describe('relatório PDF', () => {
  it('explica quando parte do saldo fica retida', () => {
    const base = {
      saldoRetidoCents: '0',
      saldoDisponivelCents: '1000',
      multaCents: '100',
      decimoTerceiroCents: '0',
      feriasCents: '0',
    };
    expect(totalCaption(base)).toBe('Saldo do FGTS + verbas da rescisão.');
    expect(totalCaption({ ...base, saldoRetidoCents: '120000' })).toBe(
      'Disponível para saque + verbas da rescisão.',
    );
    expect(totalCaption({ ...base, multaCents: '0' })).toBe('Saldo do FGTS para saque.');
    expect(totalCaption({ ...base, saldoDisponivelCents: '0', saldoRetidoCents: '1000' })).toBe(
      'Verbas rescisórias; saldo retido no FGTS.',
    );
  });

  it('no saque-aniversário o total exclui o saldo retido', () => {
    const snapshot = simulate({ ...INPUT, birthdayWithdrawal: true });
    expect(snapshot.result.saldoRetidoCents).not.toBe('0');
    expect(BigInt(snapshot.result.saldoDisponivelCents)).toBeLessThan(
      BigInt(snapshot.result.saldoBaseCents),
    );
    expect(totalCaption(snapshot.result)).toContain('saldo retido no FGTS');
  });

  it('na dispensa sem justa causa todo o saldo fica disponível', () => {
    const snapshot = simulate(INPUT);
    expect(snapshot.result.saldoRetidoCents).toBe('0');
    expect(snapshot.result.saldoDisponivelCents).toBe(snapshot.result.saldoBaseCents);
  });

  // O PDF é monocromático e de uma página de propósito (poupa tinta e papel): estes testes
  // guardam essa regra para que um redesenho não a quebre sem querer.
  const pdfText = async (input: SimulationInput): Promise<string> =>
    new TextDecoder('latin1').decode(await (await createReport(simulate(input))).arrayBuffer());
  const pageCount = (pdf: string): number => (pdf.match(/\/Type \/Page(?!s)/g) ?? []).length;

  it('cabe em uma página no caso comum (12 meses)', async () => {
    expect(pageCount(await pdfText(INPUT))).toBe(1);
    expect(pageCount(await pdfText({ ...INPUT, birthdayWithdrawal: true }))).toBe(1);
  });

  it('em vínculo longo mostra o resumo anual na primeira página e a série mensal em anexo', async () => {
    const pdf = await pdfText({ ...INPUT, startDate: '2020-03-10' });
    expect(pageCount(pdf)).toBe(2);
    expect(pdf).toContain('RESUMO ANUAL');
    expect(pdf).toContain('ANEXO');
  });

  it('usa só preto e cinza e nenhuma área preenchida', async () => {
    const pdf = await pdfText({ ...INPUT, startDate: '2020-03-10', birthdayWithdrawal: true });
    for (const [, r, g, b] of pdf.matchAll(/([\d.]+) ([\d.]+) ([\d.]+) (?:rg|RG)\b/g)) {
      expect(r).toBe(g);
      expect(g).toBe(b);
    }
    expect(pdf).not.toMatch(/\nf\*?\n/);
    expect(pdf).not.toMatch(/\nB\*?\n/);
  });
});
