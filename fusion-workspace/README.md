# ...existing code...

---

## MATRIZ DE VERSIONES Y COMPATIBILIDAD (Pre-implementación QA)

> **Este proyecto sigue una política de versiones alineadas y trazabilidad activa. Consulta siempre VERSIONS.md antes de instalar o actualizar dependencias.**

- Consulta la matriz y checklist en [`fusion-workspace/VERSIONS.md`](../VERSIONS.md)
- Antes de instalar dependencias, verifica:
  - Node.js: 20.x LTS
  - Python: 3.11.x
  - JDK: 17
  - Gradle: 8.x
  - Vite: 5.4.10
  - Vue: ^3.5.32
  - Express: ^4.18.2
  - Kotlin/JVM: 1.9.24
  - Ktor: 2.3.12
  - Exposed: 0.50.1
  - FastAPI: 0.110.0
  - Uvicorn: 0.29.0
  - Pydantic: 2.6.4
  - py5: >=0.10.4
  - PostgreSQL driver: 42.7.4

---

## Checklist de pre-implementación

- [ ] Todas las versiones alineadas y documentadas
- [ ] Lockfiles actualizados
- [ ] Dockerfiles revisados y alineados
- [ ] `requirements.txt` y `pyproject.toml` con versiones fijas
- [ ] Validación manual de builds en los 3 OS principales
- [ ] Pruebas de integración y unitarias configuradas

---

### Trazabilidad

[TRACE-ID: FASE-0-DEVOPS-VER-001]
Acción: Actualización README con matriz de versiones y checklist QA.
Razón: Garantizar compatibilidad y reproducibilidad en todos los entornos.
Contexto: QA pre-implementación, política de trazabilidad activa.

## 📜 Referencias clave
- [Manifiesto de Ingeniería y Buenas Prácticas 2026](../../docs/04_manifiesto_final.md)

---

# 🛡️ Pipeline Idempotente y Build Nativo ARM64 (Apple Silicon)

Este procedimiento es obligatorio para todos los módulos y nuevos proyectos del workspace.

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

---

### Desarrollo Local (Live Server)
Para trabajar en la UI sin empaquetar la app completa:
```bash
npm run dev
```

(Asegúrate de que los workers de Python/C++ estén corriendo en sus respectivos puertos/procesos según la documentación de cada capa).

---

## Troubleshooting
- Si ves errores de V8, recompilación nativa o letras rojas, repite la limpieza extrema y asegúrate de tener la versión fija de Electron.
- Si ejecutas scripts desde `/scripts`, electron-builder fallará.

---

## Solución al error `TS2307: Cannot find module 'zod'`

Si ves este error tras instalar Zod, sigue estos pasos:

1. **Verifica que Zod está en `dependencies` de tu `package.json` y en `node_modules/zod`.**
2. **Reinicia tu editor/IDE y el servidor de TypeScript.**
3. **Asegúrate de que tu `tsconfig.json` tiene:**
   - `"moduleResolution": "Bundler"` (o `"Node"` si usas Node puro)
   - `"include": ["src"]`
   - Si usas Vite, mantén `"types": ["vite/client"]`.
4. **Si el error persiste:**
   - Borra `node_modules` y `package-lock.json`, luego ejecuta `npm install`.
   - Comprueba que no tienes conflictos de versiones de TypeScript o Vite.

---

## Test de Pre-implementación: "Esqueleto Caminante" y "Bala Trazadora"

Antes de implementar lógica avanzada, valida que tu infraestructura y pipeline están sólidos con estos tres tests:

### 1. Test de la Bala Trazadora (End-to-End Ping-Pong)
- Crea un botón oculto de "Debug" en la UI.
- Al hacer clic, envía `{ mensaje: "Ping", timestamp: 12345 }` por IPC.
- El mensaje debe recorrer: React → Request Router → C++ Core → Python Worker → C++ → UI.
- Si recibes "Pong" en la UI, tu puente IPC está validado.

### 2. Test de Entorno de Desarrollo (Health Checks Locales)
- Script automático antes de `npm run dev`.
- Verifica versiones de Node/Python, binario C++ y conexión al Worker Python.
- Si todo está OK, arranca el servidor de desarrollo. Si no, muestra error claro.

### 3. Test de CI/CD (Pipeline Sanity Check)
- Haz commit del "Esqueleto Caminante" (botón Ping-Pong) a main.
- GitHub Actions debe: clonar, lint, validar lockfiles, build C++, generar .dmg.
- Si descargas el .dmg, lo instalas y recibes el "Pong", tu pipeline está certificado.

**Regla de Oro:**
Si estos tres tests pasan, cualquier error futuro será del código nuevo, no de la infraestructura. Esto reduce el tiempo de depuración en un 90%.

---

## CI/CD
Este flujo está integrado en los jobs de GitHub Actions y debe ser seguido por todo el equipo y agentes IA. Consulta los workflows de cada módulo para detalles de automatización multiplataforma.

---

**Contacto:** Para dudas sobre builds idempotentes, consulta a los responsables de arquitectura o revisa este README.

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

- **Requiere disciplina:** Todos los desarrolladores deben seguir el flujo y no saltarse scripts ni pasos.
- **Dependencia de versiones fijas:** Si olvidas fijar la versión de Electron o dependencias nativas, la idempotencia se rompe.
- **No mezcla arquitecturas:** No puedes compilar para x64 desde terminal ARM64 ni viceversa sin limpiar y recompilar todo.
- **Scripts deben ejecutarse desde la raíz:** Si ejecutas desde `/scripts` u otra ruta, electron-builder fallará.
- **Puede requerir limpieza extrema tras upgrades mayores:** Si cambias de versión mayor de Electron o dependencias nativas, es obligatorio limpiar todo y reinstalar.
- **No cubre dependencias Python/Java:** Este pipeline es para Node.js/Electron/C++. Los workers Python/Java deben tener su propio flujo idempotente alineado.

---

## Plan Estratégico de Pre-Implementación: Pipeline Idempotente ARM64

Este plan asegura que todo el equipo (humanos y agentes IA) ejecute la pre-implementación de manera robusta, alineada y documentada, minimizando riesgos y garantizando builds reproducibles en todo el stack.

### Pasos
1. Validar que todos los módulos (frontend, backend, gateway, worker) tienen el pipeline idempotente ARM64 activo y probado.
2. Confirmar que los scripts de build y hooks (`enforce-arm64.js`, `idempotent-rebuild.sh`) están presentes y ejecutándose desde la raíz de cada módulo.
3. Verificar que la versión de Electron está fija (sin ^ o ~) en todos los `package.json`.
4. Auditar que la documentación (README, AGENTS.md, manifiesto, auditorías) está actualizada y visible en cada módulo.
5. Ejecutar una ronda de builds consecutivos y limpiezas extremas en local y CI/CD para validar la idempotencia real.
6. Registrar los resultados en los reportes de auditoría y checklist de pre-implementación.
7. Comunicar a todo el equipo (y agentes IA) los riesgos de saltarse pasos y las ventajas del pipeline.

### Consideraciones Adicionales
- Si se agregan nuevos módulos, replicar el pipeline y documentación desde la plantilla estándar.
- Mantener vigilancia sobre errores ENOENT y advertencias de arquitectura en cada build.
- Actualizar periódicamente los reportes y checklist tras cada cambio estructural relevante.

---
