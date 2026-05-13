/**
 * Global type definitions for the Electron API exposed via contextBridge
 * in `frontend/src/preload/index.ts`.
 *
 * These augment the Window interface so `window.electron` is typed
 * across the renderer codebase.
 */

export interface ElectronAPI {
  invoke<T = unknown>(channel: string, ...args: unknown[]): Promise<T>;
  send(channel: string, ...args: unknown[]): void;
}

declare global {
  interface Window {
    electron?: ElectronAPI;
  }
}

export {};
