/* Motor Universal IA · Icon Helper v1.0.0 */
(function (g) {
  'use strict';
  var _base = './icons.svg';
  var _known = new Set([
    'icon-vscode',
    'icon-trash',
    'icon-open-editor',
    'icon-sync',
    'icon-check-circle',
    'icon-alert',
    'icon-error',
    'icon-info',
    'icon-folder',
    'icon-file',
    'icon-notes',
    'icon-code',
    'icon-ai',
    'icon-hub',
    'icon-milestone',
    'icon-copy',
    'icon-download',
    'icon-refresh',
    'icon-close',
    'icon-menu',
    'icon-home',
    'icon-settings',
    'icon-user',
    'icon-search',
    'icon-plus',
    'icon-edit',
    'icon-external-link',
    // ===== DISEÑO GRÁFICO (TOOLS) =====
    'icon-cursor',
    'icon-select-box',
    'icon-pen',
    'icon-pencil',
    'icon-brush',
    'icon-eraser',
    'icon-eyedropper',
    'icon-rectangle',
    'icon-circle',
    'icon-polygon',
    'icon-text',
    'icon-move',
    'icon-rotate',
    'icon-scale',
    'icon-crop',
    'icon-layers',
    'icon-magic',
  ]);
  function normalizeIconId(id) {
    id = String(id || '')
      .trim()
      .toLowerCase();
    if (!id) return 'icon-alert';
    if (id.startsWith('icon-')) {
      id = id.substring(5);
    } else if (id.endsWith('-icon')) {
      id = id.substring(0, id.length - 5);
    }
    id = id
      .replace(/[_\s]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    return id ? 'icon-' + id : 'icon-alert';
  }
  function resolveIconId(id) {
    var normalized = normalizeIconId(id);
    return _known.has(normalized) ? normalized : 'icon-alert';
  }
  function icon(id, size, cls) {
    size = size || 16;
    cls = cls || '';
    var c = cls ? ' class="' + cls + '"' : '';
    return (
      '<svg xmlns="http://www.w3.org/2000/svg" width="' +
      size +
      '" height="' +
      size +
      '"' +
      c +
      ' style="stroke: currentColor; fill: none;" aria-hidden="true" focusable="false"><use href="' +
      _base +
      '#' +
      resolveIconId(id) +
      '"></use></svg>'
    );
  }
  function iconEl(id, size, cls) {
    size = size || 16;
    cls = cls || '';
    var el = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    el.setAttribute('width', size);
    el.setAttribute('height', size);
    el.setAttribute('aria-hidden', 'true');
    el.setAttribute('focusable', 'false');
    el.setAttribute('style', 'stroke: currentColor; fill: none;');
    if (cls) el.setAttribute('class', cls);
    var use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', _base + '#' + resolveIconId(id));
    el.appendChild(use);
    return el;
  }
  function setBase(url) {
    _base = url;
  }
  g.MotorIcon = { icon: icon, iconEl: iconEl, setBase: setBase, normalizeIconId: normalizeIconId };
})(window);
