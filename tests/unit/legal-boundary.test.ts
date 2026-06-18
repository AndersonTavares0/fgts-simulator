import { describe, it, expect } from 'vitest';
import { Money, TipoRescisao, TipoContrato, TipoDoencaGrave } from '../../src/core/types';
import { FGTSCalculatorService } from '../../src/core/services/FGTSCalculatorService';
import { MultaService } from '../../src/core/services/MultaService';
import { DoencaGraveService } from '../../src/core/services/DoencaGraveService';

describe('Legal Boundary Tests - Serious Illness (Doença Grave)', () => {
  it('should allow 100% withdrawal for Cancer (Neoplasia Maligna)', () => {
    const saldoFGTS = Money.fromReais(10000);
    const result = DoencaGraveService.calcular(saldoFGTS, TipoDoencaGrave.CANCER);

    expect(result.saldoDisponivel.reais).toBe(10000);
    expect(result.percentualLiberado).toBe(100);
    expect(result.tipoDoenca).toBe(TipoDoencaGrave.CANCER);
    expect(result.fundamentoLegal).toContain('Art. 20, XI');
  });

  it('should allow 100% withdrawal for HIV/AIDS', () => {
    const saldoFGTS = Money.fromReais(5000);
    const result = DoencaGraveService.calcular(saldoFGTS, TipoDoencaGrave.HIV_AIDS);

    expect(result.saldoDisponivel.reais).toBe(5000);
    expect(result.percentualLiberado).toBe(100);
    expect(result.fundamentoLegal).toContain('Art. 20, XIII');
  });

  it('should allow 100% withdrawal for Terminal Illness', () => {
    const saldoFGTS = Money.fromReais(15000);
    const result = DoencaGraveService.calcular(saldoFGTS, TipoDoencaGrave.DOENCA_TERMINAL);

    expect(result.saldoDisponivel.reais).toBe(15000);
    expect(result.percentualLiberado).toBe(100);
    expect(result.fundamentoLegal).toContain('Art. 20, XIV');
  });

  it('should validate eligibility for all serious illness types', () => {
    const tipos = [
      TipoDoencaGrave.CANCER,
      TipoDoencaGrave.HIV_AIDS,
      TipoDoencaGrave.DOENCA_TERMINAL,
      TipoDoencaGrave.OUTRA_GRAVE,
    ];

    tipos.forEach((tipo) => {
      expect(DoencaGraveService.isDoencaQualificada(tipo)).toBe(true);
      expect(DoencaGraveService.getDescricao(tipo)).toBeTruthy();
    });
  });

  it('should calculate full resignation with Serious Illness (100% balance, no fine)', () => {
    const result = FGTSCalculatorService.calcularRescisao({
      salarioBruto: Money.fromReais(3000),
      mesesTrabalhados: 24,
      tipoRescisao: TipoRescisao.DOENCA_GRAVE,
      tipoContrato: TipoContrato.CLT_PADRAO,
      incluirDecimoTerceiro: true,
      incluirFerias: true,
      saqueAniversario: false,
      doencaGrave: TipoDoencaGrave.CANCER,
    });

    expect(result.saldoFinal.isPositive()).toBe(true);
    expect(result.multaFinal.cents).toBe(0);
    expect(result.doencaGrave).not.toBeNull();
    expect(result.doencaGrave?.percentualLiberado).toBe(100);
  });
});

describe('Legal Boundary Tests - Acordo Comum (Art. 484-A CLT)', () => {
  it('should apply 20% fine (not 40%) for Acordo Comum', () => {
    const saldoFGTS = Money.fromReais(10000);
    const result = MultaService.calcular(saldoFGTS, TipoRescisao.ACORDO_COMUM);

    expect(result.percentualAplicado).toBe(20);
    expect(result.valorMulta.reais).toBe(2000); // 20% of 10000
    expect(result.fundamentoLegal).toContain('Art. 484-A');
  });

  it('should limit withdrawal to 80% of balance for Acordo Comum', () => {
    const result = FGTSCalculatorService.calcularRescisao({
      salarioBruto: Money.fromReais(3000),
      mesesTrabalhados: 24,
      tipoRescisao: TipoRescisao.ACORDO_COMUM,
      tipoContrato: TipoContrato.CLT_PADRAO,
      incluirDecimoTerceiro: true,
      incluirFerias: true,
      saqueAniversario: false,
    });

    // Fine should be 20% (not 40%)
    expect(result.multa.percentualAplicado).toBe(20);
    // Art. 484-A CLT limits immediate FGTS withdrawal to 80% of the balance.
    expect(result.saldoFinal.cents).toBe(result.saldoBase.percentage(80).cents);
    expect(result.saldoRetido.cents).toBe(result.saldoBase.percentage(20).cents);
  });

  it('should retain balance for voluntary resignation and just cause', () => {
    const tipos = [TipoRescisao.DEMISSAO_VOLUNTARIA, TipoRescisao.JUSTA_CAUSA];

    tipos.forEach((tipoRescisao) => {
      const result = FGTSCalculatorService.calcularRescisao({
        salarioBruto: Money.fromReais(3000),
        mesesTrabalhados: 24,
        tipoRescisao,
        tipoContrato: TipoContrato.CLT_PADRAO,
        incluirDecimoTerceiro: false,
        incluirFerias: false,
        saqueAniversario: false,
      });

      expect(result.saldoFinal.cents).toBe(0);
      expect(result.saldoRetido.cents).toBe(result.saldoBase.cents);
    });
  });

  it('should verify 20% fine applies to total historical balance', () => {
    const saldoFGTS = Money.fromReais(15000);
    const result = MultaService.calcular(saldoFGTS, TipoRescisao.ACORDO_COMUM);

    // 20% of 15000 = 3000
    expect(result.valorMulta.reais).toBe(3000);
    expect(result.percentualAplicado).toBe(20);
  });
});

describe('Legal Boundary Tests - Fine Integrity', () => {
  it('should apply 40% fine for Dispensa sem Justa Causa', () => {
    const saldoFGTS = Money.fromReais(10000);
    const result = MultaService.calcular(saldoFGTS, TipoRescisao.DISPENSA_SEM_JUSTA_CAUSA);

    expect(result.percentualAplicado).toBe(40);
    expect(result.valorMulta.reais).toBe(4000);
  });

  it('should apply 0% fine for Demissao Voluntaria', () => {
    const saldoFGTS = Money.fromReais(10000);
    const result = MultaService.calcular(saldoFGTS, TipoRescisao.DEMISSAO_VOLUNTARIA);

    expect(result.percentualAplicado).toBe(0);
    expect(result.valorMulta.reais).toBe(0);
  });

  it('should apply 0% fine for Justa Causa', () => {
    const saldoFGTS = Money.fromReais(10000);
    const result = MultaService.calcular(saldoFGTS, TipoRescisao.JUSTA_CAUSA);

    expect(result.percentualAplicado).toBe(0);
    expect(result.valorMulta.reais).toBe(0);
  });
});

describe('Legal Boundary Tests - Saque-Aniversario Exceptions', () => {
  it('should retain balance on dismissal without cause when birthday withdrawal is active', () => {
    const result = FGTSCalculatorService.calcularRescisao({
      salarioBruto: Money.fromReais(3000),
      mesesTrabalhados: 24,
      tipoRescisao: TipoRescisao.DISPENSA_SEM_JUSTA_CAUSA,
      tipoContrato: TipoContrato.CLT_PADRAO,
      incluirDecimoTerceiro: false,
      incluirFerias: false,
      saqueAniversario: true,
    });

    expect(result.saldoFinal.cents).toBe(0);
    expect(result.saldoRetido.cents).toBe(result.saldoBase.cents);
    expect(result.multaFinal.isPositive()).toBe(true);
  });

  it('should preserve full balance for retirement even with birthday withdrawal active', () => {
    const result = FGTSCalculatorService.calcularRescisao({
      salarioBruto: Money.fromReais(3000),
      mesesTrabalhados: 24,
      tipoRescisao: TipoRescisao.APOSENTADORIA,
      tipoContrato: TipoContrato.CLT_PADRAO,
      incluirDecimoTerceiro: false,
      incluirFerias: false,
      saqueAniversario: true,
    });

    expect(result.saldoFinal.cents).toBe(result.saldoBase.cents);
    expect(result.saldoRetido.cents).toBe(0);
  });
});

describe('Legal Boundary Tests - Contract Types', () => {
  it('should apply 8% deposit for CLT standard contract', () => {
    const salario = Money.fromReais(3000);
    const deposito = FGTSCalculatorService.calcularDepositoMensal(salario, TipoContrato.CLT_PADRAO);

    // 8% of 3000 = 240
    expect(deposito.reais).toBe(240);
  });

  it('should apply 2% deposit for Aprendiz contract', () => {
    const salario = Money.fromReais(3000);
    const deposito = FGTSCalculatorService.calcularDepositoMensal(salario, TipoContrato.APRENDIZ);

    // 2% of 3000 = 60
    expect(deposito.reais).toBe(60);
  });

  it('should apply 8% deposit for Domestic workers + 3.2% multa (LC 150/2015)', () => {
    const deposito = FGTSCalculatorService.calcularDepositoMensal(
      Money.fromReais(3000),
      TipoContrato.DOMESTICO,
    );

    // 8% of 3000 = 240
    expect(deposito.reais).toBe(240);
  });

  it('should apply 50% of domestic indemnity reserve for reciprocal fault', () => {
    const result = FGTSCalculatorService.calcularRescisao({
      salarioBruto: Money.fromReais(3000),
      mesesTrabalhados: 10,
      tipoRescisao: TipoRescisao.CULPA_RECIPROCA,
      tipoContrato: TipoContrato.DOMESTICO,
      incluirDecimoTerceiro: false,
      incluirFerias: false,
      saqueAniversario: false,
    });

    // Reserve = 3,000 * 3.2% * 10 = 960; reciprocal fault pays 50% = 480.
    expect(result.multa.valorMulta.reais).toBe(480);
    expect(result.multa.fundamentoLegal).toContain('interpretação analógica');
  });

  it('should include domestic worker contract type in enum', () => {
    const tipos = Object.values(TipoContrato);
    expect(tipos).toContain(TipoContrato.DOMESTICO);
  });
});
