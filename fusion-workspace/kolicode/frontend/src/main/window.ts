import { BrowserWindow } from 'electron';
import path from 'path';

export function createMainWindow(): BrowserWindow {
  const isDev = process.env.NODE_ENV === 'development' || !!process.env.VITE_DEV_SERVER_URL || process.env.ELECTRON_START_URL;

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'index.js'),
      contextIsolation: true,
      sandbox: false,
      nodeIntegration: false
    }
  });

  // Load dev server if available
  const devUrl = process.env.VITE_DEV_SERVER_URL || process.env.ELECTRON_START_URL || 'http://localhost:5173';

  if (isDev) {
    win.loadURL(devUrl).catch((err) => console.error('Failed to load dev URL', err));
  } else {
    // production: load built file
    const indexPath = path.join(process.resourcesPath || __dirname, 'dist', 'index.html');
    win.loadFile(indexPath).catch((err) => console.error('Failed to load index.html', err));
  }

  win.once('ready-to-show', () => {
    win.show();
  });

  win.on('closed', () => {
    // dereference
  });

  return win;
}

