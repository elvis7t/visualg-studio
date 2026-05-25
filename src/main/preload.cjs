const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('visualg', {
  listExamples: () => ipcRenderer.invoke('examples:list'),
  readExample: (name) => ipcRenderer.invoke('examples:read', name),
  openFile: () => ipcRenderer.invoke('file:open'),
  openFilePath: (filePath) => ipcRenderer.invoke('file:openPath', filePath),
  saveFile: (payload) => ipcRenderer.invoke('file:save', payload),
  exportConsole: (payload) => ipcRenderer.invoke('console:export', payload),
  exportCode: (payload) => ipcRenderer.invoke('code:export', payload),
  printCode: (payload) => ipcRenderer.invoke('code:print', payload),
  exportFlowchartSvg: (payload) => ipcRenderer.invoke('flowchart:exportSvg', payload),
  exportFlowchartPng: (payload) => ipcRenderer.invoke('flowchart:exportPng', payload),
  updater: {
    check: () => ipcRenderer.invoke('updater:check'),
    download: () => ipcRenderer.invoke('updater:download'),
    install: () => ipcRenderer.invoke('updater:install'),
    onStatus: (callback) => {
      const listener = (_event, status) => callback(status);
      ipcRenderer.on('updater:status', listener);
      return () => ipcRenderer.off('updater:status', listener);
    }
  }
});
