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

## Troubleshooting
- Si ves errores de V8, recompilación nativa o letras rojas, repite la limpieza extrema y asegúrate de tener la versión fija de Electron.
- Si ejecutas scripts desde `/scripts`, electron-builder fallará.

---

## CI/CD
Este flujo está integrado en los jobs de GitHub Actions y debe ser seguido por todo el equipo y agentes IA. Consulta `.github/workflows/build.yml` para detalles de automatización multiplataforma.

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

**Contacto:** Para dudas sobre builds idempotentes, consulta a los responsables de arquitectura o revisa este README.
