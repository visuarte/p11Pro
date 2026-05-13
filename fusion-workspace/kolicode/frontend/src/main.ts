import './assets/styles/design-tokens.css';
import './styles/app.css';
import './assets/js/icons.js';
import iconSpriteUrl from './assets/icons/icons.svg?url';
import { createApp } from './app/createApp';
import { mountDebugPingPong } from './app/core/DebugPingPongMount';

const root = document.querySelector<HTMLElement>('#app');

if (!root) {
  throw new Error('P10pro no encontro el nodo #app.');
}

if (import.meta.env.MODE === 'development') {
  mountDebugPingPong();

  // Optional Electron IPC demo (only mounts if a host node exists)
  const demoHost = document.querySelector<HTMLElement>('#electron-demo');
  if (demoHost) {
    import('./renderer/mountDemo')
      .then(({ mountElectronPingDemo }) => mountElectronPingDemo(demoHost))
      .catch((err) => console.warn('[renderer] ElectronPingDemo mount failed', err));
  }
}

createApp(root, iconSpriteUrl);
