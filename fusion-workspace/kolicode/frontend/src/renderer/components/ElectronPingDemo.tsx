import { useEffect, useState } from 'react';
import { electronBridge, type PingResponse } from '../electronBridge';

/**
 * Demo component to verify Electron IPC communication.
 * Calls `app:ping` and renders the response.
 */
export function ElectronPingDemo(): JSX.Element {
  const [response, setResponse] = useState<PingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inElectron, setInElectron] = useState<boolean>(false);

  useEffect(() => {
    setInElectron(electronBridge.isElectron());
  }, []);

  async function handlePing(): Promise<void> {
    try {
      setError(null);
      const result = await electronBridge.ping({ from: 'renderer', at: Date.now() });
      setResponse(result);
      electronBridge.log('Ping completed successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div
      style={{
        padding: '1rem',
        border: '1px solid #ccc',
        borderRadius: '8px',
        fontFamily: 'system-ui, sans-serif',
        maxWidth: '500px',
        margin: '1rem auto',
      }}
    >
      <h3 style={{ marginTop: 0 }}>Electron IPC Demo</h3>
      <p>
        <strong>Mode:</strong>{' '}
        <span style={{ color: inElectron ? 'green' : 'orange' }}>
          {inElectron ? '✅ Electron' : '⚠️ Browser (mock)'}
        </span>
      </p>
      <button
        type="button"
        onClick={handlePing}
        style={{
          padding: '0.5rem 1rem',
          background: '#007aff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        Send Ping
      </button>
      {error && <pre style={{ color: 'red', marginTop: '1rem' }}>Error: {error}</pre>}
      {response && (
        <pre
          style={{
            background: '#f5f5f5',
            padding: '0.75rem',
            borderRadius: '4px',
            marginTop: '1rem',
            fontSize: '0.85rem',
          }}
        >
          {JSON.stringify(response, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default ElectronPingDemo;
