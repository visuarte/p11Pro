import { type ReactElement, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from '../../src/routes';
import { applyTheme, resolveInitialTheme } from '../../src/app/theme';
import { configureMotorIcon } from '../../src/shared/motor-icon';
import iconSpriteUrl from '../../assets/icons/icons.svg?url';

export function RendererShellHost(): ReactElement {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hostRef.current) return;

    // Configure motor icon
    configureMotorIcon(iconSpriteUrl);
    // Apply theme
    applyTheme(resolveInitialTheme());

    // Create React root and render our router
    const root = createRoot(hostRef.current);
    root.render(<RouterProvider router={router} />);

    return () => {
      root.unmount();
    };
  }, []);

  return <div ref={hostRef} />;
}

export default RendererShellHost;