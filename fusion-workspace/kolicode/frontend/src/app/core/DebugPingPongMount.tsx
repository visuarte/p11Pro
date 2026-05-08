import { DebugPingPongButton } from '../../components';

export function mountDebugPingPong() {
  const mountPoint = document.createElement('div');
  document.body.appendChild(mountPoint);
  // Render the button in development mode using the client entrypoint
  import('react-dom/client').then(({ createRoot }) => {
    createRoot(mountPoint).render(<DebugPingPongButton />);
  });
}

