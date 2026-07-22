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

  // DevTools can be opened with F12 or Ctrl+Shift+I (Cmd+Option+I on Mac)
  // if (isDev) {
  //   mainWindow.webContents.openDevTools();
  // }

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

ipcMain.handle('delete-image', async (_event, config, repository, tag) => {
  try {
    const client = new RegistryClient(config.registryUrl, config.username, config.password);
    await client.deleteImage(repository, tag);
    return { success: true };
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

MIT License

Copyright (c) 2025 Adrian Shajkofci

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`,
    buttons: ['OK'],
  });
});
