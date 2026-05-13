import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { createMainWindow } from './window.js';
import { registerIpcHandlers } from './ipc-handlers.js';

let mainWindow: BrowserWindow | null = null;

function onReady() {
  mainWindow = createMainWindow();
  registerIpcHandlers(mainWindow);

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools({ mode: 'bottom' });
  }
}

app.whenReady().then(onReady);

app.on('window-all-closed', () => {
  // On macOS it's common for apps to stay open until explicitly closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) onReady();
});

// Graceful exit handlers
process.on('SIGTERM', () => {
  if (mainWindow) mainWindow.close();
  app.quit();
});

export {};

