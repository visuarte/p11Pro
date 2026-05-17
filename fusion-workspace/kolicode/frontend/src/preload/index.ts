const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('koliAPI', {
  getBridgeStatus: () => ipcRenderer.invoke('bridge:status'),
  listProjects: () => ipcRenderer.invoke('projects:list'),
  onProjectUpdate: (callback: (event: Electron.IpcRendererEvent, ...args: any[]) => void) => {
    ipcRenderer.on('project-updated', callback);
  },
  createProject: (project: any) => ipcRenderer.invoke('create:project', project),
  deleteProject: (projectId: string) => ipcRenderer.invoke('delete:project', projectId),
  executeProject: (projectId: string) => ipcRenderer.invoke('execute:project', projectId)
});