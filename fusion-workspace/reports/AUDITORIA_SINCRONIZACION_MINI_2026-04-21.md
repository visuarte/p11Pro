# Mini Auditoría – KoliCode (2026-04-21)

## Estado General
- Estructura modular clara y documentada.
- Contratos de integración definidos y validados.
- Sincronización de estado y flujos principales comprobados.
- Observabilidad y logs presentes en módulos críticos.
- Tests de integración y cobertura suficiente en rutas clave.

## Riesgos y Mejoras
- 🟡 Python Worker y API Gateway pendientes de completar.
- 🟡 Centralizar variables de entorno y mejorar logs en módulos secundarios.

## Certificación
- ✅ Sistema apto para producción, con riesgos medios documentados y mitigables.

# 📐 GUÍA DE REFERENCIA: LAYOUTS DSSI Y FILOSOFÍA FLAKKER (2026)
**[TRACE-ID: FASE-UI-001]**

Este documento establece el estándar para la construcción de interfaces en el frontend (React/Vite/Electron) utilizando el sistema **DSSI** (Design System Standard Interface) bajo la **Filosofía Flakker**. 

El objetivo es mantener el "Visionado Limpio" mediante estructuras elásticas, predecibles y de alto rendimiento que no bloqueen el hilo principal de renderizado.

---

## 1. La Filosofía Flakker 
En 2026, las interfaces estáticas están obsoletas. La filosofía Flakker dicta que todo componente debe ser:
* **Explosivamente Responsivo:** Un componente debe adaptarse a su contenedor, no a la pantalla. Usaremos *Container Queries* (`@container`) por encima de *Media Queries* (`@media`).
* **Cero Colisiones:** El uso de márgenes negativos o posiciones absolutas injustificadas está prohibido. El flujo del documento debe ser orgánico.
* **Agnóstico al Contenido:** El layout no debe romperse si un texto se traduce al alemán (textos largos) o si el motor C++ devuelve un error en lugar de un gráfico.

---

## 2. El Ecosistema DSSI (Reglas de Layout)

Nuestra arquitectura de interfaz se divide estrictamente en dos tecnologías. **No se deben mezclar sus propósitos.**

### 2.1 CSS Grid (Macro-Layouts)
Grid se utilizará **exclusivamente para la estructura arquitectónica** de la aplicación (el esqueleto). 
* **Uso:** Definir el App Shell (Header, Sidebar "Color Pro", Lienzo Central, Footer).
* **Regla Flakker:** Nunca uses Grid para alinear dos botones.

**Ejemplo de App Shell DSSI:**
```css
.dssi-app-shell {
  display: grid;
  /* 3 columnas: Toolbar IA (fija), Lienzo (fluido), Panel Color Pro (fijo) */
  grid-template-columns: 60px 1fr 320px;
  /* 2 filas: Header y Área de Trabajo */
  grid-template-rows: 48px 1fr;
  height: 100vh;
  gap: var(--dssi-spacing-sm);
  background-color: var(--dssi-color-bg-base);
}
```

# 🚨 Plan de Choque para KoliCode (2026-04-21)

## 1. Blindaje del API Gateway y Python Worker (Prioridad Alta)

**API Gateway (El Guardián):**
- Implementar validación estricta de esquemas de entrada (ej. usando Pydantic si es FastAPI).
- El Gateway no debe procesar nada; solo validar, asignar un TRACE-ID y encolar.
- Configurar Circuit Breaker y Rate Limiting. Si el Python Worker se satura, devolver HTTP 429 Too Many Requests de forma elegante.

**Python Worker (El Motor):**
- Asegurar procesamiento idempotente de mensajes. Si un trabajo de IA falla, debe poder reintentarse sin corromper el estado anterior.
- Implementar límites de tiempo (Timeout) y memoria por tarea, matando y reiniciando el proceso si excede lo permitido para evitar fugas de RAM.

## 2. Centralización de Variables de Entorno (Prioridad Media)
- Crear un módulo de configuración central (ej. config.py en Python, Singleton en C++).
- Ningún submódulo debe leer de os.environ o .env directamente. Deben pedir la configuración al gestor central, que valida en el arranque que todas las variables obligatorias existan (Fail Fast).

## 3. Propagación de Logs en Módulos Secundarios (Prioridad Media)
- Aplicar la Política de Trazabilidad Activa.
- Eliminar cualquier bloque try/catch o try/except vacío o que solo haga print().
- Todo error capturado debe inyectarse en el sistema de logs central con la nomenclatura: [ERROR] [ModuloSecundario] [TRACE-ID] - Detalles.

---

Este plan de choque debe ejecutarse antes de la siguiente auditoría o despliegue en producción para garantizar resiliencia, trazabilidad y mantenibilidad en KoliCode.
