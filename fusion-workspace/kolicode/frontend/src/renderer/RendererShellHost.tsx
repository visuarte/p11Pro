import { type ReactElement, useEffect, useRef } from 'react';
import iconSpriteUrl from '../assets/icons/icons.svg?url';
import { createApp } from '../app/createApp';

export function RendererShellHost(): ReactElement {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hostRef.current) {
      return;
    }

    createApp(hostRef.current, iconSpriteUrl);
  }, []);

  return <div ref={hostRef} />;
}

export default RendererShellHost;
