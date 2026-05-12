// [TRACE-ID: FASE-0-SKELETON-004]
// Tipado global para la API inyectada por Electron Preload

export interface ElectronAPI {
  invoke: (channel: string, data?: any) => Promise<any>;
  on: (channel: string, callback: (...args: any[]) => void) => () => void;
}

declare global {
  interface Window {
    api: ElectronAPI;
    // backward-compat alias used in some modules
    ipcRenderer?: ElectronAPI;
  }
}

export {};
