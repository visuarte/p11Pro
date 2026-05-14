import React, { useState } from 'react';
import { electronBridge } from '../renderer/electronBridge';

export const DebugPingPongButton: React.FC = () => {
  const [response, setResponse] = useState<string | null>(null);
  const isElectron = electronBridge.isElectron();

  const handleFireBullet = async () => {
    try {
      const result = isElectron
        ? await window.api.invoke('debug:ping-pong', {
            message: 'Ping from React renderer',
            timestamp: Date.now(),
          })
        : {
            ok: true,
            channel: 'debug:ping-pong',
            ts: Date.now(),
            echo: {
              message: 'Browser fallback',
              timestamp: Date.now(),
            },
          };
      setResponse(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error('El disparo falló:', error);
      setResponse('Error en la comunicación IPC.');
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #444', borderRadius: '8px' }}>
      <h3>Bala Trazadora (IPC Ping-Pong)</h3>
      <p style={{ marginTop: 0, opacity: 0.75 }}>
        El renderer usa el bridge seguro en `window.api` con context isolation.
      </p>
      <button onClick={handleFireBullet} type="button">
        🏓 Disparar al Core
      </button>
      <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
        <strong>Runtime:</strong> {isElectron ? 'Electron' : 'Browser fallback'}
      </div>
      {response && (
        <pre style={{ marginTop: '10px', background: '#1e1e1e', padding: '10px' }}>{response}</pre>
      )}
    </div>
  );
};
