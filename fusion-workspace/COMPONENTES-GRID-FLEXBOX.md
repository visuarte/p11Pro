# Componentes DSSI: CSS Grid, Flexbox y Flakkers (2026)

## 1. Principios de Composición
- Todos los layouts deben construirse usando exclusivamente CSS Grid y Flexbox, aplicando tokens matemáticos DSSI (proporción áurea, Fibonacci, modular scale).
- Los "flakkers" son paneles/componentes flexibles, desacoplados y reordenables, que pueden moverse o colapsarse según el flujo del usuario o sugerencias del agente IA.

## 2. Ejemplos de Componentes

### 2.1. Golden Grid (Proporción Áurea)
```css
.golden-grid {
  display: grid;
  grid-template-columns: 1fr var(--ratio-golden);
  gap: var(--space-6);
}
```

### 2.2. Flakker Panel (Flexible, Modular)
```css
.flakker-panel {
  min-width: 200px;
  max-width: 400px;
  flex: 1 1 0;
  margin: var(--space-4);
  transition: box-shadow 0.2s var(--ease-spring);
}
```

### 2.3. Flexbox Layout (Responsive, Adaptativo)
```css
.flex-layout {
  display: flex;
  flex-direction: row;
  gap: var(--space-6);
  height: 100vh;
}

.flex-main {
  flex: 2 1 0;
  min-width: 0;
}

.flex-side {
  flex: 1 1 0;
  min-width: 200px;
  max-width: 400px;
}
```

### 2.4. Ejemplo de Composición (HTML/JSX)
```jsx
<div className="flex-layout">
  <aside className="flakker-panel flex-side">Inspector</aside>
  <main className="golden-grid flex-main">Lienzo</main>
  <aside className="flakker-panel flex-side">Color Pro</aside>
</div>
```

### 2.5. Flexbox (Micro-Layouts y Músculo de la Interfaz)
Flexbox es el músculo de la interfaz. Se usará para alinear contenido dentro de las áreas definidas por el Grid.

**Uso:** Barras de herramientas, menús, listas de nodos, grupos de inputs.

**Regla Flakker:** Usa siempre `gap`. Prohibido usar `margin-right` o `margin-bottom` para separar elementos hermanos.

**Ejemplo de Panel Interno DSSI:**
```css
.dssi-node-toolbar {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: var(--dssi-spacing-md);
  padding: var(--dssi-spacing-sm);
}
```

### 2.6. Container Queries (Responsividad Explosiva)
Siempre que sea posible, usa `@container` para adaptar componentes a su contenedor, no a la pantalla.

**Ejemplo:**
```css
.card {
  container-type: inline-size;
}
@container (min-width: 400px) {
  .card-title { font-size: var(--font-size-lg); }
}
```

## 3. Variables de Entorno y Tokens de Diseño
Para que la filosofía Flakker funcione, el CSS debe estar impulsado por variables globales inmutables. Nunca hardcodees píxeles o colores (especialmente importante para calibrar el motor Little CMS).

```css
:root {
  /* Espaciado Modular Flakker (Múltiplos de 4/8) */
  --dssi-spacing-xs: 0.25rem; /* 4px */
  --dssi-spacing-sm: 0.5rem;  /* 8px */
  --dssi-spacing-md: 1rem;    /* 16px */
  --dssi-spacing-lg: 1.5rem;  /* 24px */

  /* Colores de Sistema y Visionado Limpio */
  --dssi-color-bg-base: #1e1e1e; /* Gris fotográfico neutro */
  --dssi-color-surface: #252526;
  
  /* Tintas Directas del Motor C++ (Previsualización UI) */
  --dssi-ink-ultramarina: #120A8F;
  --dssi-ink-bigstar: #FFD700;
}
```

## 4. Checklist de Validación Frontend (Code Review)
Antes de aprobar un PR en GitHub Actions que modifique la UI, el agente o revisor debe verificar:

- [ ] ¿El layout principal usa CSS Grid y evita estructuras anidadas profundas (div > div > div)?
- [ ] ¿Los elementos hijos usan Flexbox con gap en lugar de márgenes mágicos?
- [ ] ¿Todos los colores y espaciados llaman a variables --dssi-?
- [ ] ¿Se evita el uso de valores hardcodeados fuera de los tokens?
- [ ] ¿Se usan roles y atributos ARIA en layouts complejos para accesibilidad?

## 5. Reglas para Agentes IA
- Siempre priorizar Grid para layouts principales (pantalla, paneles).
- Usar Flexbox para organización interna de paneles, toolbars y flakkers.
- Los flakkers pueden ser reordenados, colapsados o expandidos dinámicamente.
- Explicar la matemática de cada decisión (por qué se usa φ, Fibonacci, etc.).
- Explicar la lógica de layout y la elección de queries de contenedor en cada sugerencia.

## 6. Notas de Implementación
- Todos los valores de tamaño, espaciado y proporción deben provenir de los tokens DSSI definidos en :root.
- No se permiten valores hardcodeados fuera de los tokens.
- Los componentes deben ser accesibles y responsivos.
- Los nombres de tokens como `--dssi-spacing-md`, `--font-size-lg`, etc., deben estar definidos en el archivo central de design tokens.
- Añadir roles y atributos ARIA en layouts complejos para accesibilidad.

---

Este documento sirve como guía y referencia para implementar layouts DSSI usando CSS Grid, Flexbox y la filosofía flakker en 2026, incluyendo container queries, tokens de diseño y checklist de validación para agentes IA y revisores.
