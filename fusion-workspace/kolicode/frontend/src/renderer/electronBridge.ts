/**
 * Electron Bridge - Renderer-side wrapper
 *
 * Provides typed, safe access to the Electron API exposed via contextBridge
 * in `frontend/src/preload/index.ts`.
 *
 * Falls back to a mock implementation when running outside of Electron
 * (e.g., during Vite dev server with browser-only mode).
 */

export interface PingResponse {
  pong: boolean;
  ts: number;
  echo?: unknown;
}

export interface OpenFileResult {
  canceled: boolean;
  filePaths: string[];
}

export interface ElectronAPI {
  invoke<T = unknown>(channel: string, ...args: unknown[]): Promise<T>;
  send(channel: string, ...args: unknown[]): void;
}

declare global {
  interface Window {
    electron?: ElectronAPI;
  }
}

/**
 * Check if running inside Electron renderer process.
 */
export function isElectron(): boolean {
  return typeof window !== 'undefined' && !!window.electron;
}

/**
 * Send a ping to the main process and receive pong response.
 */
export async function ping(payload?: unknown): Promise<PingResponse> {
  if (!isElectron()) {
    // Mock for browser-only mode
    return { pong: true, ts: Date.now(), echo: payload };
  }
  return window.electron!.invoke<PingResponse>('app:ping', payload);
}

/**
 * Request the main process to show an open-file dialog.
 */
export async function openFile(): Promise<OpenFileResult> {
  if (!isElectron()) {
    console.warn('[electronBridge] openFile called outside Electron - returning empty result');
    return { canceled: true, filePaths: [] };
  }
  return window.electron!.invoke<OpenFileResult>('app:open-file');
}

/**
 * Send a log message to the main process.
 */
export function log(message: string): void {
  if (!isElectron()) {
    console.log('[renderer-log]', message);
    return;
  }
  window.electron!.send('app:log', message);
}

export const electronBridge = {
  isElectron,
  ping,
  openFile,
  log
};

