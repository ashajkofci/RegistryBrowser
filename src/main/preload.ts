import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  saveCredentials: (credentials: any) => ipcRenderer.invoke('save-credentials', credentials),
  getCredentials: () => ipcRenderer.invoke('get-credentials'),
  clearCredentials: () => ipcRenderer.invoke('clear-credentials'),
  testConnection: (config: any) => ipcRenderer.invoke('test-connection', config),
  getRepositories: (config: any) => ipcRenderer.invoke('get-repositories', config),
  getTags: (config: any, repository: string) => ipcRenderer.invoke('get-tags', config, repository),
  getManifest: (config: any, repository: string, tag: string) => 
    ipcRenderer.invoke('get-manifest', config, repository, tag),
  showAbout: () => ipcRenderer.invoke('show-about'),
});
