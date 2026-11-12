import type { SimulationSnapshot } from '../application/Simulation';

/** Maior valor do eixo: cobre IPCA e TR, já que o cenário IPCA pode ultrapassar a TR. */
export function chartMax(data: SimulationSnapshot['timeline']): number {
  return Math.max(
    ...data.map((point) => Math.max(Number(point.trCents), Number(point.ipcaCents)) / 100),
    1,
  );
}
