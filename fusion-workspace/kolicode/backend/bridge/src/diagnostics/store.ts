import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import Datastore from '@seald-io/nedb';
import type { RequestMetadata } from '../grpc/generated/kolicode/common/v1/RequestMetadata';
import type { DiagnosticCapture } from '../grpc/generated/kolicode/diagnostic/v1/DiagnosticCapture';
import { logger } from '../utils/logger';

type DiagnosticLevel = 'info' | 'warn' | 'error';

export interface DiagnosticEntry {
  type: string;
  source: string;
  level: DiagnosticLevel;
  message: string;
  metadata?: Record<string, unknown>;
  capture?: DiagnosticCapture;
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
      await store.ensureIndexAsync({ fieldName: 'level' });
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

function stringifyMetadata(
  metadata?: Record<string, unknown>
): Record<string, string> {
  if (!metadata) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(metadata)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [
        key,
        typeof value === 'string' ? value : JSON.stringify(value),
      ])
  );
}

function buildRequestMetadata(
  metadataLabels: Record<string, string>
): RequestMetadata {
  const { requestId, sessionId, userId, traceId, ...labels } = metadataLabels;

  return {
    requestId: requestId ?? '',
    sessionId: sessionId ?? '',
    userId: userId ?? '',
    traceId: traceId ?? '',
    labels,
  };
}

function resolveDiagnosticLayer(source: string): DiagnosticCapture['layer'] {
  if (source.startsWith('frontend.')) {
    return 'DIAGNOSTIC_LAYER_FRONTEND';
  }

  if (source.startsWith('engine.') || source.includes('thunderkoli') || source.includes('universalengine') || source.includes('designstudio')) {
    return 'DIAGNOSTIC_LAYER_ENGINE';
  }

  return 'DIAGNOSTIC_LAYER_BRIDGE';
}

function resolveDiagnosticSeverity(level: DiagnosticLevel): DiagnosticCapture['severity'] {
  switch (level) {
    case 'info':
      return 'DIAGNOSTIC_SEVERITY_INFO';
    case 'warn':
      return 'DIAGNOSTIC_SEVERITY_WARN';
    case 'error':
      return 'DIAGNOSTIC_SEVERITY_ERROR';
    default:
      return 'DIAGNOSTIC_SEVERITY_UNSPECIFIED';
  }
}

export function buildDiagnosticCapture(
  entry: Omit<DiagnosticEntry, 'createdAt' | 'capture'>,
  createdAt: string
): DiagnosticCapture {
  const labels = stringifyMetadata(entry.metadata);
  const payload = Buffer.from(
    JSON.stringify({
      type: entry.type,
      source: entry.source,
      level: entry.level,
      message: entry.message,
      metadata: entry.metadata ?? {},
    }),
    'utf8'
  );

  return {
    metadata: buildRequestMetadata(labels),
    layer: resolveDiagnosticLayer(entry.source),
    timestampMs: String(Date.parse(createdAt)),
    labels,
    payload,
    source: entry.source,
    type: entry.type,
    severity: resolveDiagnosticSeverity(entry.level),
    message: entry.message,
  };
}

export async function recordDiagnostic(entry: Omit<DiagnosticEntry, 'createdAt'>): Promise<void> {
  const store = await initializeDiagnosticsStore();
  const createdAt = new Date().toISOString();
  const capture = entry.capture ?? buildDiagnosticCapture(entry, createdAt);

  await store.insertAsync({
    ...entry,
    capture,
    createdAt,
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
