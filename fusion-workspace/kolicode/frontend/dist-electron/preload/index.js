var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});

// src/preload/index.ts
var { contextBridge, ipcRenderer } = __require("electron");
contextBridge.exposeInMainWorld("koliAPI", {
  getBridgeStatus: () => ipcRenderer.invoke("bridge:status"),
  listProjects: () => ipcRenderer.invoke("projects:list"),
  onProjectUpdate: (callback) => {
    ipcRenderer.on("project-updated", callback);
  },
  createProject: (project) => ipcRenderer.invoke("create:project", project),
  deleteProject: (projectId) => ipcRenderer.invoke("delete:project", projectId),
  executeProject: (projectId) => ipcRenderer.invoke("execute:project", projectId)
});
//# sourceMappingURL=index.js.map
