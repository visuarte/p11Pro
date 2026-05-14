import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import Datastore from '@seald-io/nedb';
import { logger } from '../utils/logger';

export interface DiagnosticEntry {
  type: string;
  source: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

let diagnosticsStore: Datastore<DiagnosticEntry> | null = null;
let diagnosticsStoreReady: Promise<Datastore<DiagnosticEntry>> | null = null;

function resolveDiagnosticsDbPath(): string {
  return (
    process.env.DIAGNOSTICS_DB_PATH ??
    path.join(os.homedir(), '.kolicode', 'diagnostics.db')
  );
}

export async function initializeDiagnosticsStore(): Promise<Datastore<DiagnosticEntry>> {
  if (diagnosticsStore) {
    return diagnosticsStore;
  }

  if (!diagnosticsStoreReady) {
    diagnosticsStoreReady = (async () => {
      const filePath = resolveDiagnosticsDbPath();
      await fs.mkdir(path.dirname(filePath), { recursive: true });

      const store = new Datastore<DiagnosticEntry>({
        filename: filePath,
        autoload: true,
        timestampData: true,
      });

      if (store.autoloadPromise) {
        await store.autoloadPromise;
      } else {
        await store.loadDatabaseAsync();
      }

      await store.ensureIndexAsync({ fieldName: 'type' });
      await store.ensureIndexAsync({ fieldName: 'source' });
      await store.ensureIndexAsync({ fieldName: 'createdAt' });

      diagnosticsStore = store;
      logger.info({
        message: 'Diagnostics datastore initialized',
        filePath,
      });

      return store;
    })();
  }

  return diagnosticsStoreReady;
}

export async function recordDiagnostic(entry: Omit<DiagnosticEntry, 'createdAt'>): Promise<void> {
  const store = await initializeDiagnosticsStore();

  await store.insertAsync({
    ...entry,
    createdAt: new Date().toISOString(),
  });
}

export function recordDiagnosticInBackground(entry: Omit<DiagnosticEntry, 'createdAt'>): void {
  void recordDiagnostic(entry).catch((error) => {
    logger.error({
      message: 'Failed to persist diagnostic entry',
      error: error instanceof Error ? error.message : error,
      entryType: entry.type,
      source: entry.source,
    });
  });
}

export async function getDiagnosticsStoreStatus(): Promise<{
  status: 'healthy' | 'unhealthy';
  path: string;
  count: number | null;
  details?: string;
}> {
  const filePath = resolveDiagnosticsDbPath();

  try {
    const store = await initializeDiagnosticsStore();
    const count = await store.countAsync({});

    return {
      status: 'healthy',
      path: filePath,
      count,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      path: filePath,
      count: null,
      details: error instanceof Error ? error.message : 'Unknown diagnostics error',
    };
  }
}
