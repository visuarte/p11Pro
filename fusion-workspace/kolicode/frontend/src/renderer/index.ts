/**
 * Renderer entry helpers.
 *
 * Re-exports the Electron bridge so other modules can import from
 * a single, stable path:
 *
 *   import { electronBridge, ping } from '../renderer';
 */

export * from './electronBridge';
export { default as ElectronPingDemo } from './components/ElectronPingDemo';

