// src/preload/index.ts
import { contextBridge, ipcRenderer } from "electron";
var invokeChannels = ["app:ping", "app:open-file", "debug:ping-pong", "update-settings"];
var sendChannels = ["app:log"];
var onChannels = [];
var electronBridge = {
  invoke: (channel, ...args) => {
    if (!invokeChannels.includes(channel)) {
      throw new Error(`Invalid channel: ${channel}`);
    }
    return ipcRenderer.invoke(channel, ...args);
  },
  send: (channel, ...args) => {
    if (!sendChannels.includes(channel)) {
      throw new Error(`Invalid channel: ${channel}`);
    }
    return ipcRenderer.send(channel, ...args);
  },
  on: (channel, callback) => {
    if (!onChannels.includes(channel)) {
      throw new Error(`Invalid channel: ${channel}`);
    }
    const listener = (_event, ...args) => callback(...args);
    ipcRenderer.on(channel, listener);
    return () => ipcRenderer.removeListener(channel, listener);
  }
};
contextBridge.exposeInMainWorld("electron", electronBridge);
contextBridge.exposeInMainWorld("api", electronBridge);
contextBridge.exposeInMainWorld("ipcRenderer", electronBridge);
//# sourceMappingURL=index.js.map
