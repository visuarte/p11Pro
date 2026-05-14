import { dialog, ipcMain } from 'electron';
import { saveSettings } from './settings-store.js';

let handlersRegistered = false;

export function registerIpcHandlers() {
  if (handlersRegistered) {
    return;
  }

  handlersRegistered = true;

  ipcMain.handle('app:ping', async (_event, arg) => {
    return { pong: true, ts: Date.now(), echo: arg };
  });

  ipcMain.handle('debug:ping-pong', async (_event, arg) => {
    return { ok: true, channel: 'debug:ping-pong', ts: Date.now(), echo: arg };
  });

  ipcMain.handle('app:open-file', async () => {
    const result = await dialog.showOpenDialog({ properties: ['openFile'] });
    return result;
  });

  ipcMain.handle('update-settings', async (_event, nextSettings) => {
    const savedSettings = await saveSettings(nextSettings);
    return { success: true, config: savedSettings };
  });

  ipcMain.on('app:log', (_event, message) => {
    console.log('[renderer]', message);
  });
}
