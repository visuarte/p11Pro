import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  invoke: (channel: string, ...args: any[]) => {
    const valid = ['app:ping', 'app:open-file'];
    if (!valid.includes(channel)) throw new Error(`Invalid channel: ${channel}`);
    return ipcRenderer.invoke(channel, ...args);
  },
  send: (channel: string, ...args: any[]) => {
    const valid = ['app:log'];
    if (!valid.includes(channel)) throw new Error(`Invalid channel: ${channel}`);
    return ipcRenderer.send(channel, ...args);
  }
});

export {};

