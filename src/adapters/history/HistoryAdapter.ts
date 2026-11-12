import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import { isSimulationSnapshot } from '../../application/Simulation';
import type { SimulationSnapshot } from '../../application/Simulation';
import { TipoRescisao } from '../../core/types';

interface HistoryDatabase extends DBSchema {
  simulations: { key: string; value: unknown };
}

interface Connection {
  promise: Promise<IDBPDatabase<HistoryDatabase>>;
}

let connection: Connection | undefined;
let connectionError: Error | undefined;

function getDatabase(): Promise<IDBPDatabase<HistoryDatabase>> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(
      new Error(
        'Este navegador não oferece IndexedDB. Use um navegador atualizado com armazenamento local permitido.',
      ),
    );
  }
  if (connectionError) {
    const error = connectionError;
    connectionError = undefined;
    return Promise.reject(error);
  }
  if (connection) return connection.promise;

  let closed = false;
  let database: IDBPDatabase<HistoryDatabase> | undefined;
  let rejectOpening: (error: Error) => void = () => undefined;
  const reset = () => {
    closed = true;
    database?.close();
    if (connection === current) connection = undefined;
  };
  const current: Connection = {
    promise: new Promise((resolve, reject) => {
      rejectOpening = reject;
      openDB<HistoryDatabase>('fgts-simulator-history', 1, {
        upgrade(db) {
          db.createObjectStore('simulations', { keyPath: 'id' });
        },
        blocked() {
          reset();
          rejectOpening(
            new Error('Histórico bloqueado. Feche outras abas deste aplicativo e tente novamente.'),
          );
        },
        blocking() {
          reset();
        },
        terminated() {
          reset();
          connectionError = new Error(
            'A conexão com o histórico foi interrompida. Tente novamente para reabrir o banco.',
          );
          rejectOpening(connectionError);
        },
      }).then(
        (db) => {
          database = db;
          if (closed) {
            db.close();
            // Another tab asked for an upgrade while this one was opening: settle the
            // promise instead of leaving every later read pending forever.
            rejectOpening(
              new Error(
                'Histórico bloqueado. Feche outras abas deste aplicativo e tente novamente.',
              ),
            );
            return;
          }
          resolve(db);
        },
        (error: unknown) => {
          reset();
          reject(error);
        },
      );
    }),
  };
  connection = current;
  current.promise = current.promise.catch((error: unknown) => {
    reset();
    throw error;
  });
  return current.promise;
}

async function withDatabase<T>(
  operation: string,
  action: (db: IDBPDatabase<HistoryDatabase>) => Promise<T>,
): Promise<T> {
  try {
    return await action(await getDatabase());
  } catch (error) {
    const name = error instanceof Error ? error.name : '';
    let detail = error instanceof Error ? error.message : 'Erro de armazenamento desconhecido.';
    if (name === 'QuotaExceededError') {
      detail = 'Espaço local insuficiente. Exclua registros que não precisa e tente novamente.';
    } else if (name === 'SecurityError' || name === 'InvalidStateError') {
      detail = 'Permita o armazenamento local neste navegador e tente novamente.';
    } else if (name === 'VersionError') {
      detail =
        'O histórico pertence a uma versão mais recente. Atualize o aplicativo e reabra a página.';
    } else if (name === 'AbortError') {
      detail = 'A transação foi interrompida e não foi confirmada. Tente novamente.';
    }
    throw new Error(`Não foi possível ${operation} o histórico. ${detail}`, { cause: error });
  }
}

export interface StoredSimulations {
  snapshots: SimulationSnapshot[];
  /** Registros de outra versão ou corrompidos: preservados no banco, nunca listados. */
  skipped: number;
}

export async function listSimulations(): Promise<StoredSimulations> {
  return withDatabase('ler', async (db) => {
    const transaction = db.transaction('simulations', 'readonly');
    const [records] = await Promise.all([transaction.store.getAll(), transaction.done]);
    const snapshots: SimulationSnapshot[] = [];
    let skipped = 0;
    for (const record of records) {
      if (isSimulationSnapshot(record)) snapshots.push(record);
      else skipped += 1;
    }
    return {
      snapshots: snapshots.sort(
        (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt) || a.id.localeCompare(b.id),
      ),
      skipped,
    };
  });
}

export async function saveSimulation(
  snapshot: SimulationSnapshot,
  allowSensitive = false,
): Promise<void> {
  if (!isSimulationSnapshot(snapshot)) {
    throw new Error('Simulação inválida ou incompatível. O histórico não foi alterado.');
  }
  const savedSnapshot = structuredClone(snapshot);
  if (
    savedSnapshot.input.terminationType === TipoRescisao.DOENCA_GRAVE &&
    allowSensitive !== true
  ) {
    throw new Error('Autorize explicitamente o armazenamento de dados de saúde antes de salvar.');
  }
  await withDatabase('salvar', async (db) => {
    const transaction = db.transaction('simulations', 'readwrite');
    await Promise.all([transaction.store.put(savedSnapshot), transaction.done]);
  });
}

export async function deleteSimulation(id: string): Promise<void> {
  if (typeof id !== 'string' || !id.trim()) throw new Error('Identificador de simulação inválido.');
  await withDatabase('alterar', async (db) => {
    const transaction = db.transaction('simulations', 'readwrite');
    await Promise.all([transaction.store.delete(id), transaction.done]);
  });
}

export async function clearSimulations(): Promise<void> {
  await withDatabase('limpar', async (db) => {
    const transaction = db.transaction('simulations', 'readwrite');
    await Promise.all([transaction.store.clear(), transaction.done]);
  });
}
