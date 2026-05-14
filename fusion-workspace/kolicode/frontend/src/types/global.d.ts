// [TRACE-ID: FASE-0-SKELETON-004]
// Tipado global para la API inyectada por Electron Preload

export interface ElectronAPI {
  invoke: <T = unknown>(channel: string, ...args: unknown[]) => Promise<T>;
  send: (channel: string, ...args: unknown[]) => void;
  on: (channel: string, callback: (...args: unknown[]) => void) => () => void;
}

declare global {
  interface Window {
    api: ElectronAPI;
    electron?: ElectronAPI;
    // backward-compat alias used in some modules
    ipcRenderer?: ElectronAPI;
  }
}

export {};
