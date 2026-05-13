import { BrowserWindow, ipcMain } from 'electron';

export function registerIpcHandlers(mainWindow?: BrowserWindow | null) {
  // simple ping/pong handler for smoke tests
  ipcMain.handle('app:ping', async (event, arg) => {
    return { pong: true, ts: Date.now(), echo: arg };
  });

  // Example: open file dialog via main process
  ipcMain.handle('app:open-file', async (event) => {
    const { dialog } = require('electron');
    const result = await dialog.showOpenDialog({ properties: ['openFile'] });
    return result;
  });

  // Forward logs from renderer
  ipcMain.on('app:log', (event, message) => {
    // Could integrate with a logging lib
    // eslint-disable-next-line no-console
    console.log('[renderer]', message);
  });
}

export {};
