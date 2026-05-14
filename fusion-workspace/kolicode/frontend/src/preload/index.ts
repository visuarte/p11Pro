import { contextBridge, ipcRenderer } from 'electron';

const invokeChannels = ['app:ping', 'app:open-file', 'debug:ping-pong', 'update-settings'] as const;
const sendChannels = ['app:log'] as const;
const onChannels = [] as const;

type InvokeChannel = (typeof invokeChannels)[number];
type SendChannel = (typeof sendChannels)[number];
type OnChannel = (typeof onChannels)[number];

const electronBridge = {
  invoke: (channel: InvokeChannel, ...args: unknown[]) => {
    if (!invokeChannels.includes(channel)) {
      throw new Error(`Invalid channel: ${channel}`);
    }

    return ipcRenderer.invoke(channel, ...args);
  },
  send: (channel: SendChannel, ...args: unknown[]) => {
    if (!sendChannels.includes(channel)) {
      throw new Error(`Invalid channel: ${channel}`);
    }

    return ipcRenderer.send(channel, ...args);
  },
  on: (channel: OnChannel, callback: (...args: unknown[]) => void) => {
    if (!onChannels.includes(channel)) {
      throw new Error(`Invalid channel: ${channel}`);
    }

    const listener = (_event: Electron.IpcRendererEvent, ...args: unknown[]) => callback(...args);
    ipcRenderer.on(channel, listener);
    return () => ipcRenderer.removeListener(channel, listener);
  },
};

contextBridge.exposeInMainWorld('electron', electronBridge);
contextBridge.exposeInMainWorld('api', electronBridge);
contextBridge.exposeInMainWorld('ipcRenderer', electronBridge);

export {};
