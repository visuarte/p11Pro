import { type ReactElement } from 'react';
import { DebugPingPongButton } from '../../components';
import { useSettingsStore } from '../../stores/settingsStore';
import { electronBridge } from '../electronBridge';
import ElectronPingDemo from './ElectronPingDemo';

function formatModeLabel(isElectron: boolean): string {
  return isElectron ? 'Electron renderer' : 'Browser-only fallback';
}

export function RendererDiagnostics(): ReactElement {
  const isElectron = electronBridge.isElectron();
  const { config, isUpdating, updateConfig } = useSettingsStore();

  return (
    <section
      style={{
        margin: '1.5rem auto 0',
        maxWidth: '1200px',
        padding: '1rem',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '16px',
        background: 'rgba(15, 23, 42, 0.72)',
        color: '#e5eef8',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '0.78rem', opacity: 0.8, textTransform: 'uppercase' }}>
            Renderer diagnostics
          </div>
          <h2 style={{ margin: '0.35rem 0 0.5rem' }}>React root + preload bridge activos</h2>
          <p style={{ margin: 0, maxWidth: '60ch', opacity: 0.88 }}>
            El renderer se monta ahora con ReactDOM y solo accede al main process mediante el
            preload bridge con context isolation.
          </p>
        </div>
        <div style={{ minWidth: '220px' }}>
          <div>
            <strong>Mode:</strong> {formatModeLabel(isElectron)}
          </div>
          <div>
            <strong>Context isolation:</strong> enforced by preload
          </div>
          <div>
            <strong>IPC surface:</strong> `window.electron`, `window.api`, `window.ipcRenderer`
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem',
          marginTop: '1rem',
        }}
      >
        <div style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.05)' }}>
          <h3 style={{ marginTop: 0 }}>IPC-backed settings</h3>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            <button
              type="button"
              onClick={() => void updateConfig({ tripleBuffering: !config.tripleBuffering })}
              disabled={isUpdating}
            >
              Triple buffering: {config.tripleBuffering ? 'on' : 'off'}
            </button>
            <button
              type="button"
              onClick={() =>
                void updateConfig({ gpuMode: config.gpuMode === 'auto' ? 'cpu_only' : 'auto' })
              }
              disabled={isUpdating}
            >
              GPU mode: {config.gpuMode}
            </button>
            <button
              type="button"
              onClick={() =>
                void updateConfig({
                  vramLimit: config.vramLimit >= 4096 ? 2048 : config.vramLimit + 1024,
                })
              }
              disabled={isUpdating}
            >
              VRAM: {config.vramLimit} MB
            </button>
          </div>
          <pre
            style={{
              margin: 0,
              padding: '0.75rem',
              borderRadius: '8px',
              background: 'rgba(2, 6, 23, 0.7)',
              overflowX: 'auto',
              fontSize: '0.82rem',
            }}
          >
            {JSON.stringify({ isUpdating, config }, null, 2)}
          </pre>
        </div>

        <div style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.05)' }}>
          <h3 style={{ marginTop: 0 }}>Renderer bridge checks</h3>
          <DebugPingPongButton />
          <div style={{ marginTop: '1rem' }}>
            <ElectronPingDemo />
          </div>
        </div>
      </div>
    </section>
  );
}

export default RendererDiagnostics;
