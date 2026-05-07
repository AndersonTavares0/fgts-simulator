import { describe, it, expect } from 'vitest';
const FGTSCalculator = require('../../src/js/calculator.js');

describe('FGTSCalculator', () => {
  const SALARIO_3000 = 300000; // R$ 3.000,00

  describe('calcularDepositoMensal', () => {
    it('deve calcular 8% para CLT normal', () => {
      const resultado = FGTSCalculator.calcularDepositoMensal(SALARIO_3000, false);
      expect(resultado).toBe(24000); // R$ 240,00
    });

    it('deve calcular 2% para Aprendiz', () => {
      const resultado = FGTSCalculator.calcularDepositoMensal(SALARIO_3000, true);
      expect(resultado).toBe(6000); // R$ 60,00
    });
  });

  describe('calcularSaldoFGTS', () => {
    it('deve calcular saldo com correção (TR+3%)', () => {
      // 12 meses de 240,00 com juros compostos deve ser > 2880,00
      const meses = 12;
      const resultado = FGTSCalculator.calcularSaldoFGTS(SALARIO_3000, meses, false);
      expect(resultado).toBeGreaterThan(288000);
      // Valor esperado aproximado: 240 * ((1.003266^12 - 1) / 0.003266) ≈ 2932
      expect(resultado).toBeCloseTo(293231, -3);
 
    });
  });

  describe('calcularMultaRescisoria', () => {
    it('deve calcular 40% de multa apenas para dispensa sem causa', () => {
      const saldo = 100000; // R$ 1.000,00
      expect(FGTSCalculator.calcularMultaRescisoria(saldo, 'dispensa_sem_causa')).toBe(40000);
      expect(FGTSCalculator.calcularMultaRescisoria(saldo, 'demissao_voluntaria')).toBe(0);
    });
  });

  describe('Saque-Aniversário', () => {
    it('deve calcular parcela baseada na tabela oficial (Saldo < 500)', () => {
      const saldo = 40000; // R$ 400,00
      // 50% + 0 = 200,00
      expect(FGTSCalculator.calcularParcelaSaqueAniversario(saldo)).toBe(20000);
    });

    it('deve calcular parcela baseada na tabela oficial (Saldo > 20000)', () => {
      const saldo = 2500000; // R$ 25.000,00
      // 5% + 2900,00 = 1250 + 2900 = 4150,00
      expect(FGTSCalculator.calcularParcelaSaqueAniversario(saldo)).toBe(415000);
    });

    it('deve reter o saldo na rescisão mas pagar multa integral', () => {
      const saldoBase = 100000;
      const multaBase = 40000;
      const resultado = FGTSCalculator.calcularImpactoRescisaoSaqueAniversario(saldoBase, multaBase);
      expect(resultado.saldoFinal).toBe(0);
      expect(resultado.multaFinal).toBe(40000);
    });
  });
});
