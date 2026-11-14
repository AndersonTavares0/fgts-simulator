/**
 * Limites de entrada do simulador.
 *
 * Só `inicioFgts` tem base legal: o FGTS foi criado pela Lei 5.107/1966 e passou a valer em
 * 01/01/1967 (Decreto 59.820/1966), então não há depósito anterior. `anosMax` cobre toda a
 * história do FGTS (≈ 60 anos). `salarioMaxCentavos` NÃO é da lei (a base do FGTS não tem teto):
 * é um limite do simulador, folgado, que existe para pegar erro de digitação.
 */
export const LIMITES = {
  inicioFgts: '1967-01-01',
  anosMax: 60,
  salarioMaxCentavos: 1_000_000_000n,
} as const;

/** Competências no período máximo (60 anos × 12 meses + as duas pontas parciais). */
export const MAX_COMPETENCIAS = LIMITES.anosMax * 12 + 2;
