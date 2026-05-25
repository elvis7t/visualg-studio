import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pkg from 'electron-updater';
import { buildCodePrintHtml, defaultCodeFileName } from './code-output.js';
import { listExampleNames, readExample } from './examples.js';

const { autoUpdater } = pkg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');
const appIcon = path.join(rootDir, 'resources/icon.ico');

let mainWindow = null;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 980,
    minHeight: 640,
    title: 'VisuAlg Studio',
    icon: appIcon,
    backgroundColor: '#282a36',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  await mainWindow.loadFile(path.join(rootDir, 'src/renderer/index.html'));
}

// Auto-Updater configuration and events
autoUpdater.autoDownload = false;
if (!app.isPackaged && existsSync(path.join(rootDir, 'dev-app-update.yml'))) {
  autoUpdater.forceDevUpdateConfig = true;
}

autoUpdater.on('checking-for-update', () => {
  mainWindow?.webContents.send('updater:status', { state: 'checking' });
});

autoUpdater.on('update-available', (info) => {
  mainWindow?.webContents.send('updater:status', { state: 'available', info });
});

autoUpdater.on('update-not-available', (info) => {
  mainWindow?.webContents.send('updater:status', { state: 'not-available', info });
});

autoUpdater.on('error', (err) => {
  mainWindow?.webContents.send('updater:status', { state: 'error', error: err.message });
});

autoUpdater.on('download-progress', (progressObj) => {
  mainWindow?.webContents.send('updater:status', { state: 'downloading', progress: progressObj });
});

autoUpdater.on('update-downloaded', (info) => {
  mainWindow?.webContents.send('updater:status', { state: 'downloaded', info });
});

// IPC handlers for auto-updater
ipcMain.handle('updater:check', async () => {
  try {
    return { success: true, result: await autoUpdater.checkForUpdates() };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('updater:download', async () => {
  try {
    return { success: true, result: await autoUpdater.downloadUpdate() };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('updater:install', async () => {
  autoUpdater.quitAndInstall();
  return { success: true };
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

ipcMain.handle('examples:list', async () => {
  return listExampleNames();
});

ipcMain.handle('examples:read', async (_event, name) => {
  return readExample(name);
});

ipcMain.handle('file:open', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Abrir algoritmo',
    filters: [{ name: 'Visualg', extensions: ['alg'] }],
    properties: ['openFile']
  });

  if (result.canceled || !result.filePaths[0]) return null;
  const filePath = result.filePaths[0];
  return { filePath, content: await readFile(filePath, 'utf8') };
});

ipcMain.handle('file:openPath', async (_event, filePath) => {
  return { filePath, content: await readFile(filePath, 'utf8') };
});

ipcMain.handle('file:save', async (_event, payload) => {
  let filePath = payload.filePath;

  if (!filePath) {
    const result = await dialog.showSaveDialog({
      title: 'Salvar algoritmo',
      defaultPath: 'algoritmo.alg',
      filters: [{ name: 'Visualg', extensions: ['alg'] }]
    });

    if (result.canceled || !result.filePath) return null;
    filePath = result.filePath;
  }

  await writeFile(filePath, payload.content, 'utf8');
  return { filePath };
});

ipcMain.handle('console:export', async (_event, payload) => {
  const result = await dialog.showSaveDialog({
    title: 'Exportar saída do console',
    defaultPath: 'saida-console.txt',
    filters: [{ name: 'Texto', extensions: ['txt'] }]
  });

  if (result.canceled || !result.filePath) return null;
  await writeFile(result.filePath, payload.content ?? '', 'utf8');
  return { filePath: result.filePath };
});

ipcMain.handle('code:export', async (_event, payload) => {
  const result = await dialog.showSaveDialog({
    title: 'Exportar código',
    defaultPath: defaultCodeFileName(payload?.fileName),
    filters: [
      { name: 'Visualg', extensions: ['alg'] },
      { name: 'Texto', extensions: ['txt'] }
    ]
  });

  if (result.canceled || !result.filePath) return null;
  await writeFile(result.filePath, payload?.content ?? '', 'utf8');
  return { filePath: result.filePath };
});

ipcMain.handle('code:print', async (_event, payload) => {
  const printWindow = new BrowserWindow({
    width: 940,
    height: 760,
    minWidth: 720,
    minHeight: 520,
    show: true,
    title: payload?.title ?? 'Algoritmo',
    icon: appIcon,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const html = buildCodePrintHtml({
    title: payload?.title ?? 'Algoritmo',
    content: payload?.content ?? ''
  });

  await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
  return { opened: true };
});

ipcMain.handle('flowchart:exportSvg', async (_event, payload) => {
  const result = await dialog.showSaveDialog({
    title: 'Exportar fluxograma SVG',
    defaultPath: payload?.fileName ?? 'fluxograma.svg',
    filters: [{ name: 'SVG', extensions: ['svg'] }]
  });

  if (result.canceled || !result.filePath) return null;
  await writeFile(result.filePath, payload?.content ?? '', 'utf8');
  return { filePath: result.filePath };
});

ipcMain.handle('flowchart:exportPng', async (_event, payload) => {
  const result = await dialog.showSaveDialog({
    title: 'Exportar fluxograma PNG',
    defaultPath: payload?.fileName ?? 'fluxograma.png',
    filters: [{ name: 'PNG', extensions: ['png'] }]
  });

  if (result.canceled || !result.filePath) return null;
  const base64 = String(payload?.dataUrl ?? '').replace(/^data:image\/png;base64,/, '');
  await writeFile(result.filePath, Buffer.from(base64, 'base64'));
  return { filePath: result.filePath };
});
