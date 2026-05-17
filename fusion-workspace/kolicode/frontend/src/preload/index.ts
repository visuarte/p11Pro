const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('koliAPI', {
  getBridgeStatus: () => ipcRenderer.invoke('bridge:status'),
  listProjects: () => ipcRenderer.invoke('projects:list'),
  onProjectUpdate: (callback: (event: Electron.IpcRendererEvent, ...args: any[]) => void) => {
    ipcRenderer.on('project-updated', callback);
  },
  executeProject: (projectId: string) => ipcRenderer.invoke('execute:project', projectId)
});