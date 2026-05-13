// Integración del manejador IPC Ping-Pong en el proceso principal de Electron
// [TRACE-ID: FASE-0-SKELETON-002]
import { app, BrowserWindow } from 'electron';
import { registerPingPongRouter } from './lib/pingPongRouter';

function createMainWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: __dirname + '/preload.js',
    },
  });
  // mainWindow.loadURL('http://localhost:5173'); // O la URL de Vite
}

app.whenReady().then(() => {
  // 1. Registrar el enrutador IPC antes de crear la ventana
  registerPingPongRouter();
  // 2. Crear la ventana principal
  createMainWindow();
});

