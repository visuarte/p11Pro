/**
 * Optional helper to mount the React ElectronPingDemo into a host element.
 *
 * This is used only in development to verify Electron IPC wiring without
 * touching the existing app entry. It dynamically imports React/ReactDOM
 * so it can be tree-shaken out in production builds if unused.
 */

export async function mountElectronPingDemo(target: HTMLElement): Promise<void> {
  const [{ createRoot }, React, { default: ElectronPingDemo }] = await Promise.all([
    import('react-dom/client'),
    import('react'),
    import('./components/ElectronPingDemo')
  ]);

  const root = createRoot(target);
  root.render(React.createElement(ElectronPingDemo));
}

