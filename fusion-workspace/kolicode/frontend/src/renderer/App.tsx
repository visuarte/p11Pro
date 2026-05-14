import { type ReactElement } from 'react';
import RendererDiagnostics from './components/RendererDiagnostics';
import RendererShellHost from './RendererShellHost';

export function App(): ReactElement {
  return (
    <>
      <RendererShellHost />
      {import.meta.env.DEV ? <RendererDiagnostics /> : null}
    </>
  );
}

export default App;
