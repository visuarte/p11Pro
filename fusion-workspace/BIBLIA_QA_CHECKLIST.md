# BIBLIA DE BLINDAJE Y CHECKLIST QA – KoliCode

Este archivo es la referencia obligatoria para todos los agentes y desarrolladores. Resume los planes quirúrgicos, estrategias de blindaje y checklist de validación para cada componente crítico y medio del sistema. Al finalizar cualquier implementación, el agente debe recordar ejecutar los comandos de validación y checklist aquí descritos.

---

## 1. Principios Generales
- **Nunca asumas compatibilidad implícita.**
- **No uses features sin fallback.**
- **Prioriza estabilidad sobre innovación.**
- **Los riesgos medios (🟡) no destruyen datos, pero degradan el sistema. La estrategia general para estos módulos es: Contención, Reintento y Degradación Elegante. Si un Worker, la API o la GPU se saturan o fallan, el componente debe saber reiniciarse solo, trocear el trabajo o usar un método alternativo más lento (ej. GPU -> CPU) antes de molestar al usuario con un error en pantalla.**

---

## 2. Checklist de Validación Final (obligatorio tras cada implementación)

### Comandos de validación multiplataforma

#### 2.1. Validación de versiones y dependencias
- Ejecutar:
  - `cat fusion-workspace/VERSIONS.md`
  - `npm ls` (en frontend)
  - `pip freeze` (en python-worker)
  - `./gradlew dependencies` (en universalengine)

#### 2.2. Validación de builds y lockfiles
- Ejecutar:
  - `bash fusion-workspace/scripts/validate-build.sh`
  - `bash fusion-workspace/scripts/validate-lockfile.sh`
  - `bash fusion-workspace/scripts/validate-zips.sh`

#### 2.3. Validación de checklist QA
- Ejecutar:
  - `bash fusion-workspace/scripts/validate-idempotent-checklist.sh`

#### 2.4. Validación de seguridad y auditoría
- Revisar logs de ThunderKoli y verificar integridad de la cadena de hashes.
- Validar que los tokens y claves nunca estén en archivos de texto plano.

#### 2.5. Validación de persistencia y backup
- Verificar que la base de datos esté en modo WAL y que existan backups automáticos antes de migraciones.

---

## 3. Recordatorio para el agente
**Al finalizar cualquier implementación, ejecuta todos los comandos de validación y checklist QA de este archivo. Si algún paso falla, no des por finalizada la tarea.**

---

## 4. Referencias
- [PRE_IMPLEMENTACION_QA_2026-04-21.md](fusion-workspace/reports/PRE_IMPLEMENTACION_QA_2026-04-21.md)
- [Manifiesto de Ingeniería y Buenas Prácticas 2026](docs/04_manifiesto_final.md)

---

> "Guardar esto como la biblia de tu repositorio es un paso obligatorio."

