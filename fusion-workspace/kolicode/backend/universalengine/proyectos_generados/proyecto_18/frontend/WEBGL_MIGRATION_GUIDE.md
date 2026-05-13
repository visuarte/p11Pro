# Migración de funciones y guía de implementación

## 1. Funciones migradas
Se migran las funciones de inicialización y renderizado WebGL/Three.js del frontend (antes en Fritz2/Kotlin) a una nueva página dedicada.

### Funciones principales:
- `webGlCanvas()`
- `loadConfigAndRender(canvas: HTMLCanvasElement)`
- `initRawWebGL(canvas: HTMLCanvasElement)`
- `initThreeJs(canvas: HTMLCanvasElement)`

## 2. Nueva página: WebGL Demo
- Crear un nuevo archivo: `WebGlDemo.kt` en `frontend/src/main/kotlin/`
- Copiar las funciones mencionadas y adaptar el renderizado para que sea independiente del index.
- El componente principal debe ser exportado como función `webGlDemoPage()`.

## 3. Integración en el index
- En `Main.kt`, importar y añadir un botón en el render principal:
  - Al hacer click, debe navegar/renderizar la página `webGlDemoPage()` en el root.
  - Ejemplo de integración:
    ```kotlin
    button { 
        text("Demo WebGL")
        clicks.handledBy { renderWebGlDemo() }
    }
    ```
- Implementar la función `renderWebGlDemo()` para limpiar el root y montar el componente de la demo.

## 4. Navegación
- Puede usarse Fritz2 Routing o lógica simple de reemplazo de contenido.

## 5. Validación
- Verificar que el botón aparece en el index y que la demo se monta correctamente al pulsarlo.

---

### Notas
- Mantener la lógica de fetch de `/api/v1/webgl/config`.
- Si se requiere, adaptar el CSS para la nueva página.
- Documentar cualquier cambio adicional en este archivo.
