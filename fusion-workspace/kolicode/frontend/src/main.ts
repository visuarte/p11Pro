import './assets/styles/design-tokens.css';
import './styles/app.css';
import './assets/js/icons.js';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import RendererShellHost from './renderer/RendererShellHost';

const root = document.querySelector<HTMLElement>('#app');

if (!root) {
  throw new Error('P10pro no encontro el nodo #app.');
}

createRoot(root).render(createElement(RendererShellHost));