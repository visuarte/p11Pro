# ...existing code...

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
# ...existing code...
