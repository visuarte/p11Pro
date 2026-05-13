import React, { useState } from 'react';

export const DebugPingPongButton: React.FC = () => {
  const [response, setResponse] = useState<string | null>(null);

  const handleFireBullet = async () => {
    try {
      // Usamos el puente seguro inyectado en window
      const result = await window.api.invoke('debug:ping-pong', {
        message: '¡Ping!',
        timestamp: Date.now(),
      });
      setResponse(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error('El disparo falló:', error);
      setResponse('Error en la comunicación IPC.');
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #444', borderRadius: '8px' }}>
      <h3>Bala Trazadora (IPC Ping-Pong)</h3>
      <button onClick={handleFireBullet}>🏓 Disparar al Core</button>
      {response && (
        <pre style={{ marginTop: '10px', background: '#1e1e1e', padding: '10px' }}>{response}</pre>
      )}
    </div>
  );
};
