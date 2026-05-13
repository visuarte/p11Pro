// [TRACE-ID: FASE-0-SKELETON-003]
// Acción: Exposición segura de canales IPC (Context Bridge).
// Seguridad: Zero-Trust. Solo se permiten canales registrados en la lista blanca.

import { contextBridge, ipcRenderer } from 'electron';

const VALID_CHANNELS = [
  'debug:ping-pong',
  // 'vector:process',
  // 'color:calibrate',
];

const electronApi = {
  invoke: async (channel: string, data: any) => {
    if (VALID_CHANNELS.includes(channel)) {
      return await ipcRenderer.invoke(channel, data);
    } else {
      console.error(`[ERROR] [Preload] Intento de acceso a canal IPC no autorizado: ${channel}`);
      throw new Error(`Canal IPC '${channel}' no autorizado en el Preload.`);
    }
  },
  on: (channel: string, callback: (...args: any[]) => void) => {
    if (VALID_CHANNELS.includes(channel)) {
      const subscription = (_event: any, ...args: any[]) => callback(...args);
      ipcRenderer.on(channel, subscription);
      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    }
  }
};

contextBridge.exposeInMainWorld('api', electronApi);

console.log('[INFO] [Preload] Aduana IPC inicializada y blindada.');

