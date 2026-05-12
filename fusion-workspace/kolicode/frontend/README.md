# P10pro

P10pro es una base ejecutable minima para un editor creativo local. El proyecto queda compuesto por tres superficies separadas: una app web local con Vite + TypeScript, documentacion alineada al estado real y un prototipo independiente en Processing.

## Fuente de verdad

La fuente estructurada del proyecto es [config/project-context.json](/Volumes/DEV/IntelliJ/P10pro/config/project-context.json:1). Este `README` resume el estado humano y las vistas de `docs/` son derivadas; ninguna pagina de `docs/` debe describir capacidades vigentes que no existan en disco o no se deriven de ese archivo.

## Estado actual

Implementado hoy:

- App web minima ejecutable con `npm` desde la raiz.
- Documentacion local en `docs/`.
- Sketch local de Processing en `creative/processing/`.
- Assets compartidos en `src/assets/` para iconos, helper y tokens de diseno.

No implementado hoy:

- Backend, autenticacion, CRUD y API REST.
- IA local, Ollama y agentes.
- Gradle multimodulo, Vue, Three.js, NFC y sincronizaciones externas.

Material heredado de plantilla:

- Narrativas full-stack genericas y referencias de dominio no adoptadas como contrato actual.
- Ideas futuras como `py5` o integraciones avanzadas, solo cuando esten marcadas como `planned` o `template_only`.

## Ejecucion local

```bash
npm install
npm run dev
```

Build de verificacion:

```bash
npm run build
```

Superficies locales adicionales:

- App web: `index.html` servido por Vite.
- Portal documental: `docs/index.html`
- Vista tecnica derivada: `docs/inicio/codedesign_technical_docs_v2.html`
- Prototipo Processing: `creative/processing/Sketch.pde`

# 🛡️ Pipeline Idempotente y Build Nativo ARM64 (Apple Silicon)

## Flujo recomendado para builds idempotentes

1. **Limpieza extrema (solo si es necesario):**
   ```bash
   rm -rf node_modules package-lock.json dist build ~/.electron-gyp
   npm cache clean --force
   npm install
   ```
2. **Chequeo/Rebuild idempotente de dependencias nativas:**
   ```bash
   npm run build:native
   # o
   ./scripts/idempotent-rebuild.sh
   ```
3. **Build Electron ARM64:**
   ```bash
   npm run electron:build:mac
   ```
4. **Prueba de idempotencia:**
   Ejecuta de nuevo el paso 3. El proceso debe ser mucho más rápido y no recompilar módulos nativos.

**Notas:**
- Ejecuta siempre los scripts desde la raíz del proyecto.
- La versión de Electron debe ser fija en package.json.
- No borres node_modules entre builds idempotentes.
- Si cambias de arquitectura o actualizas Electron, repite la limpieza extrema.

---

## Ventajas del pipeline idempotente multiplataforma ARM64

- **Reproducibilidad total:** Cada build es idéntico, sin diferencias entre máquinas o ejecuciones.
- **Evita recompilaciones innecesarias:** Solo recompila módulos nativos C++ si realmente cambió algo, acelerando builds y evitando errores de ABI.
- **Prevención de errores de arquitectura:** Bloquea builds en terminales x64/Rosetta, evitando binarios corruptos o incompatibles.
- **Onboarding inmediato:** Cualquier desarrollador o agente IA puede seguir el README y tener builds funcionales en minutos, sin pasos ocultos.
- **Automatización CI/CD robusta:** El mismo flujo se ejecuta en local y en la nube, garantizando que lo que pasa en tu máquina pasa igual en producción.
- **Menos soporte y troubleshooting:** Minimiza errores de “en mi máquina funciona”, conflictos de dependencias y problemas de entorno.
- **Escalabilidad:** Puedes añadir nuevos módulos/proyectos y heredan automáticamente el estándar, sin duplicar documentación ni scripts.
- **Auditoría y trazabilidad:** Todo build queda registrado y es auditable, cumpliendo con normativas y buenas prácticas 2026.
- **Seguridad:** Reduce el riesgo de ejecutar binarios incompatibles o inseguros en producción.
- **Velocidad:** Builds incrementales mucho más rápidos tras el primer build completo.

---

## Desventajas y precauciones

- **Requiere disciplina:** Todos los desarrolladores y agentes IA deben seguir el flujo y no saltarse scripts ni pasos.
- **Dependencia de versiones fijas:** Si olvidas fijar la versión de Electron o dependencias nativas, la idempotencia se rompe.
- **No mezcla arquitecturas:** No puedes compilar para x64 desde terminal ARM64 ni viceversa sin limpiar y recompilar todo.
- **Scripts deben ejecutarse desde la raíz:** Si ejecutas desde `/scripts` u otra ruta, electron-builder fallará.
- **Puede requerir limpieza extrema tras upgrades mayores:** Si cambias de versión mayor de Electron o dependencias nativas, es obligatorio limpiar todo y reinstalar.
- **No cubre dependencias Python/Java:** Este pipeline es para Node.js/Electron/C++. Los workers Python/Java deben tener su propio flujo idempotente alineado.

---

## Troubleshooting
- Si ves errores de V8, recompilación nativa o letras rojas, repite la limpieza extrema y asegúrate de tener la versión fija de Electron.
- Si ejecutas scripts desde `/scripts`, electron-builder fallará.

---

## CI/CD
Este flujo está integrado en los jobs de GitHub Actions y debe ser seguido por todo el equipo y agentes IA. Consulta `.github/workflows/build.yml` para detalles de automatización multiplataforma.

---

**Contacto:** Para dudas sobre builds idempotentes, consulta a los responsables de arquitectura o revisa este README.

## Estructura

- `src/`: codigo de la app web minima.
- `src/assets/`: iconos, helper `MotorIcon` y tokens reutilizables.
- `config/`: contrato estructurado del proyecto.
- `docs/`: vistas y notas alineadas con el contrato.
- `creative/processing/`: sketch y ayuda para ejecucion local en Processing.

---

## Checklist QA obligatorio

Tras cualquier cambio en el frontend, ejecuta:

```bash
bash ../../scripts/validate-idempotent-checklist.sh
```

Y revisa la BIBLIA_QA_CHECKLIST.md para pasos adicionales de validación y blindaje.

---

## Perfiles ICC (Color Profiles)

Los perfiles ICC (.icc, .icm) permiten la gestión avanzada de color en la aplicación. Están organizados en:
- `fusion-workspace/iccprofiles/input/`  → Perfiles de entrada (cámaras, escáneres, etc.)
- `fusion-workspace/iccprofiles/output/` → Perfiles de salida (monitores, impresoras, espacios de trabajo)

### ¿Cómo agregar un nuevo perfil?
1. Copia el archivo `.icc` o `.icm` en la carpeta correspondiente (`input/` o `output/`).
2. El sistema detectará automáticamente los nuevos perfiles al listar disponibles.

### Importar/Exportar perfiles desde la app
- Próximamente: Se integrará una utilidad para importar/exportar perfiles ICC desde la interfaz.
- Mientras tanto, puedes gestionar los archivos manualmente en las carpetas mencionadas.

### Uso en la app
- Los perfiles disponibles se mostrarán en los menús de selección de color/perfil.
- Selecciona el perfil deseado para aplicar la gestión de color en tiempo real.

---

## Idiomas (Languages)

La app soporta múltiples idiomas. Los archivos de idioma están en:
- `fusion-workspace/languages/`

### ¿Cómo agregar un nuevo idioma?
1. Crea un archivo de texto/plano con el nombre del idioma (ejemplo: `Italiano`).
2. Sigue el formato de los archivos existentes para las claves y traducciones.
3. Guarda el archivo en la carpeta `languages/`.

### Selección de idioma
- Desde la configuración de la app o menú de usuario, selecciona el idioma deseado.
- El cambio de idioma es inmediato y afecta toda la interfaz.

---

## Configuración avanzada y preferencias críticas (Settings avanzados)

La app permite configurar parámetros avanzados que impactan directamente en el rendimiento, calidad y seguridad del sistema, tanto en C++ como en Python:

### 1. Rendimiento y Lienzo (Canvas Core - C++)
- **Triple Buffering:** Elimina flicker visual usando más VRAM. Puede aumentar la latencia en 1-2 ms.
- **Aceleración GPU:** Forzar uso de GPU (Metal/CUDA) o fallback a CPU para degradación elegante.
- **Resolución de Renderizado:** Dinámica (LOD para paneo rápido) o siempre máxima calidad.

### 2. Motor de Color (Little CMS)
- **Espacio de trabajo por defecto:** sRGB, Adobe RGB, ProPhoto RGB.
- **Intención de renderizado:** Perceptual, Colorimétrico Relativo (clave para exportar a CMYK).

### 3. Motor de IA (UniversalEngine - Python)
- **Estrategia de modelos:** Lazy Load (ahorra RAM) vs Precarga (respuestas IA instantáneas).
- **Límite de VRAM:** Slider para limitar la memoria gráfica usada por Python (ej. 4GB en M1 de 8GB).

### 4. Sistema y Seguridad (ThunderKoli & DB)
- **Autoguardado seguro (WAL DB):** Intervalo en minutos o por evento.
- **Bloqueo de inactividad:** Solicitar PIN/Biometría tras X minutos de inactividad.

---

## Checklist de integración y QA para Settings

- [x] Store Zustand con rollback optimista y sincronización con Core (IPC).
- [x] Panel de Settings desacoplado, sin botón de guardar, con feedback visual.
- [x] Componentes de selección ICC y Language conectados a backend/API.
- [x] Documentación de cada parámetro y su impacto en C++/Python.
- [x] Validación y rollback automático si el Core rechaza el cambio.
- [ ] Handler IPC en Electron para `update-settings` (persistencia y validación real).
- [ ] Actualización de diagramas y arquitectura en README y docs.
- [ ] Testing E2E: Cambios en settings reflejados en C++/Python y persistentes entre sesiones.

---

## Requerimientos y diseño

- Todos los cambios de settings deben ser auditables y revertibles.
- El usuario debe recibir feedback inmediato y rollback si hay error.
- La arquitectura debe permitir añadir nuevos parámetros críticos sin romper la UI ni el backend.
- Los settings deben ser persistentes y sincronizados entre frontend, backend y motores nativos.

---
