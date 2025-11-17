import { app, BrowserWindow, ipcMain, dialog, Menu } from 'electron';
import * as path from 'path';
import Store from 'electron-store';
import { RegistryClient } from '../lib/registryClient';

const store: any = new Store();

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Remove default menu (can be accessed with Alt key on Windows/Linux)
  Menu.setApplicationMenu(null);

  // In development, __dirname is dist/main, so we go up to project root then to src/renderer
  // In production (packaged), the file will be in the app.asar or extracted
  const isDev = !app.isPackaged;
  const htmlPath = isDev
    ? path.join(__dirname, '../../src/renderer/index.html')
    : path.join(__dirname, '../renderer/index.html');
  
  mainWindow.loadFile(htmlPath);

  // Open DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC Handlers
ipcMain.handle('save-credentials', async (_event, credentials) => {
  try {
    store.set('credentials', credentials);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('get-credentials', async () => {
  try {
    const credentials = store.get('credentials');
    return { success: true, credentials };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('clear-credentials', async () => {
  try {
    store.delete('credentials');
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('test-connection', async (_event, config) => {
  try {
    const client = new RegistryClient(config.registryUrl, config.username, config.password);
    await client.testConnection();
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('get-repositories', async (_event, config) => {
  try {
    const client = new RegistryClient(config.registryUrl, config.username, config.password);
    const repositories = await client.getRepositories();
    return { success: true, repositories };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('get-tags', async (_event, config, repository) => {
  try {
    const client = new RegistryClient(config.registryUrl, config.username, config.password);
    const tags = await client.getTags(repository);
    return { success: true, tags };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('get-manifest', async (_event, config, repository, tag) => {
  try {
    const client = new RegistryClient(config.registryUrl, config.username, config.password);
    const manifest = await client.getManifest(repository, tag);
    return { success: true, manifest };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('show-about', async () => {
  dialog.showMessageBox({
    type: 'info',
    title: 'About Registry Browser',
    message: 'Registry Browser',
    detail: `Version: ${app.getVersion()}

A Docker registry browser application.

MIT Licensed

© 2025`,
    buttons: ['OK'],
  });
});
