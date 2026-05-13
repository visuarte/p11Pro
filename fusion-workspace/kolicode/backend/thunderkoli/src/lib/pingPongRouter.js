// [TRACE-ID: FASE-0-SKELETON-002]
// Acción: Enrutador IPC para la Bala Trazadora (Ping-Pong End-to-End).
// Razón: Validar la comunicación bidireccional asíncrona entre React y Electron.

import { ipcMain } from 'electron';

export function registerPingPongRouter() {
  // Usamos ipcMain.handle para operaciones asíncronas (Devuelve una Promesa al Frontend)
  ipcMain.handle('debug:ping-pong', async (event, payload) => {
    const traceId = payload.traceId || `PING-${Date.now()}`;

    console.log(`[INFO] [RequestRouter] [${traceId}] - Ping recibido desde React:`, payload);

    try {
      // ---------------------------------------------------------
      // AQUÍ IRÁ LA CONEXIÓN REAL A C++ EN EL FUTURO
      // Por ahora, simulamos el viaje C++ -> Python -> C++ con un pequeño delay
      // ---------------------------------------------------------

      console.log(`[INFO] [RequestRouter] [${traceId}] - Enrutando al Core C++...`);

      // Simulamos la latencia de procesamiento asíncrono
      await new Promise(resolve => setTimeout(resolve, 300));

      const mockResponse = {
        status: 'success',
        traceId: traceId,
        message: 'Pong desde Electron (Simulando C++ y Python)',
        timestamp: Date.now(),
        originalPayload: payload
      };

      console.log(`[INFO] [RequestRouter] [${traceId}] - Respuesta del Core recibida. Devolviendo al Frontend.`);
      return mockResponse;

    } catch (error) {
      // Captura de errores al estilo Manifiesto 2026
      console.error(`[ERROR] [RequestRouter] [${traceId}] - Fallo crítico en el puente IPC:`, error);

      // Devolvemos el error estructurado al frontend para el Rollback
      return {
        status: 'error',
        traceId: traceId,
        message: error instanceof Error ? error.message : 'Error desconocido en el Core',
      };
    }
  });
}

