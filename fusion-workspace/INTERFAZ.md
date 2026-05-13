# DSSI – Design System System Instructions: Conclusiones y Propuesta de Interfaz (2026)

## 1. Conclusiones Estratégicas

### Filosofía Central
- **El Lienzo es el Rey:** La interfaz debe ser invisible, modular y priorizar el espacio de creación (viewport) sobre menús o paneles tradicionales.
- **Matemática Aplicada:** El diseño se rige por proporciones áureas, secuencias de Fibonacci, escalas modulares y armonías de color, garantizando estética, consistencia y adaptabilidad.
- **IA y UX:** La integración de IA debe ser fluida, sin bloquear la UI, y permitir prompts naturales para manipulación avanzada.

### Decisiones Clave
- **Tecnología UI:** Qt Quick (QML) para desktop, con aceleración GPU y animaciones fluidas. Para web, Next.js/React + Tailwind, siempre usando tokens matemáticos.
- **Tokens Matemáticos:** Todo el sistema se basa en variables (CSS custom properties o JSON tokens) para tipografía, espaciado, layouts y color, evitando valores hardcodeados.
- **Accesibilidad y Contraste:** Validación automática de contraste (WCAG), dark mode nativo y feedback microanimado.
- **Componentización:** Componentes atómicos y modulares, con layouts que respetan proporciones matemáticas.

## 2. Propuesta de Interfaz (INTERFAZ.MD)

### 2.1. Layout General
- **Viewport Central (Lienzo Infinito):**
  - Ocupa ~80% de la pantalla.
  - Paneo y zoom infinito a 60 FPS.
  - Renderizado vectorial (Blend2D/Canvas/Qt SceneGraph).
  - AsyncBridge para no bloquear la UI durante cálculos IA.

- **Barra de Comandos IA (Spotlight/Cursor):**
  - Flotante, invocable por atajo (Cmd+K/Ctrl+K).
  - Permite prompts en lenguaje natural para manipulación avanzada.

- **Panel Color Pro (Dock Derecho):**
  - Colapsable, dedicado a colorimetría avanzada (Little CMS, ICC, LAB, CMYK).
  - Visualización de perfiles ICC y canales especiales.

- **Inspector de Nodos/Capas (Dock Izquierdo o Inferior):**
  - Editor de nodos tipo Blender/DaVinci.
  - Visualiza el flujo de transformaciones (vector → IA → color).

### 2.2. Estética y Experiencia
- **Dark Mode Nativo:** Gris neutro 18% para no contaminar percepción de color.
- **Zero-Lag UI:** Interacciones instantáneas, cálculos pesados en background.
- **Microinteracciones:** Feedback sutil en sliders, botones y paneles.
- **Espacio Negativo:** Uso generoso de padding/margin basado en Fibonacci.

### 2.3. Reglas de Diseño (DSSI)
- **Tipografía:** Escala modular basada en φ (potencias de 1.618).
- **Espaciado:** Secuencia Fibonacci en rem.
- **Layouts:** Proporción áurea en grids y paneles (ej. 61.8%/38.2%).
- **Color:** Paleta armónica, contraste validado, tokens HSL.
- **Movimiento:** Easing físico (spring/expo), sin bloqueos.

### 2.4. Ejemplo de Tokens Centrales (CSS)
```css
:root {
  --phi: 1.618034;
  --font-size-base: 1rem;
  --font-size-lg: calc(var(--font-size-base) * var(--phi));
  --font-size-xl: calc(var(--font-size-lg) * var(--phi));
  --space-4: 1rem;
  --space-6: 2.5rem;
  --ratio-golden: var(--phi);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --primary-h: 220;
  --primary-s: 80%;
  --primary-l: 50%;
  --primary: hsl(var(--primary-h), var(--primary-s), var(--primary-l));
}
```

### 2.5. Ejemplo de Layout (QML/Pseudocódigo)
```qml
// QML pseudocode
Item {
  RowLayout {
    // Inspector de Nodos
    NodeInspector { width: parent.width * 0.18 }
    // Lienzo Central
    InfiniteCanvas { width: parent.width * 0.64 }
    // Panel Color Pro
    ColorProPanel { width: parent.width * 0.18 }
  }
  FloatingCommandBar { shortcut: "Ctrl+K" }
}
```

### 2.6. Prompt Base para Agentes IA
> "Consulta SIEMPRE los tokens matemáticos antes de sugerir o modificar UI. Explica la decisión matemática en cada cambio. Usa proporciones áureas, secuencias de Fibonacci y valida contraste."

### 2.7. Flujo de Trabajo para el Agente
1. Escanea tokens y contexto.
2. Sugiere cambios con explicación matemática.
3. Implementa solo tras aprobación.
4. Valida contraste, accesibilidad y performance.

---

**Este documento INTERFAZ.MD resume la visión, conclusiones y propuesta de interfaz para DSSI/p11Pro en 2026, integrando principios matemáticos, IA y experiencia de usuario premium.**

