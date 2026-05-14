import { app, BrowserWindow } from 'electron';
import path from 'path';

export function createMainWindow(): BrowserWindow {
  const isDev =
    process.env.NODE_ENV === 'development' ||
    !!process.env.VITE_DEV_SERVER_URL ||
    process.env.ELECTRON_START_URL;

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    title: 'KoliCode',
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'index.js'),
      contextIsolation: true,
      sandbox: false,
      nodeIntegration: false,
    },
  });

  // Load dev server if available
  const devUrl =
    process.env.VITE_DEV_SERVER_URL || process.env.ELECTRON_START_URL || 'http://localhost:5173';

  if (isDev) {
    win.loadURL(devUrl).catch((err) => console.error('Failed to load dev URL', err));
  } else {
    const rendererDistPath = process.env.APP_RENDERER_DIST
      ? path.resolve(process.env.APP_RENDERER_DIST)
      : path.join(
          __dirname,
          '..',
          '..',
          process.env.APP_RENDERER_DIR_NAME ?? 'dist',
          'index.html'
        );
    const indexPath =
      app.isPackaged && process.env.APP_RENDERER_DIST === undefined
        ? path.join(process.resourcesPath, 'dist', 'index.html')
        : rendererDistPath;

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
