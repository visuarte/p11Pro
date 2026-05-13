# MATRIZ DE VERSIONES Y COMPATIBILIDAD — PRE-IMPLEMENTACIÓN

**Fecha de validación:** 2026-04-21
**Responsable:** GitHub Copilot (DevOps)

---

## 1️⃣ Versiones recomendadas y alineadas

| Componente/Lenguaje | Versión recomendada |
|---------------------|---------------------|
| Node.js             | 20.x LTS            |
| Vite                | 5.4.10              |
| Vue                 | ^3.5.32             |
| Express             | ^4.18.2             |
| Jest                | ^29.7.0             |
| Kotlin/JVM          | 1.9.24              |
| Ktor                | 2.3.12              |
| Exposed             | 0.50.1              |
| JDK                 | 17                  |
| Python              | 3.11.x              |
| FastAPI             | 0.110.0             |
| Uvicorn             | 0.29.0              |
| Pydantic            | 2.6.4               |
| py5                 | >=0.10.4            |
| PostgreSQL driver   | 42.7.4              |
| Gradle              | 8.x                 |

---

## 2️⃣ Matriz de compatibilidad

| Lenguaje/Herramienta | Framework/Librería | Compatibilidad SO | Observaciones |
|----------------------|--------------------|-------------------|--------------|
| Node.js 20.x         | Vite 5.4.10, Vue ^3.5.32, Express ^4.18.2 | Linux, macOS, Win | OK |
| Kotlin/JVM 1.9.24    | Ktor 2.3.12, Exposed 0.50.1 | Linux, macOS, Win | OK |
| Python 3.11.x        | FastAPI 0.110.0, Uvicorn 0.29.0, Pydantic 2.6.4 | Linux, macOS, Win | OK |
| JDK 17               | Kotlin/JVM         | Linux, macOS, Win | OK |
| PostgreSQL           | 42.7.4             | Linux, macOS, Win | OK |
| Gradle 8.x           | Kotlin/JVM         | Linux, macOS, Win | OK |

---

## 3️⃣ Riesgos y advertencias

- ⚠️ Diferentes versiones de Vite/Vue/Kotlin detectadas en algunos subproyectos. Se recomienda alinear a las versiones propuestas.
- ⚠️ Python: fijar versiones exactas en todos los `requirements.txt` y `pyproject.toml`.
- ⚠️ Revisar imágenes base de Docker para que usen Node 20.x, JDK 17 y Gradle 8.x.
- ⚠️ Unificar versiones de Ktor y Exposed en todos los servicios Kotlin.

---

## 4️⃣ Estrategia de entorno

- Usar entornos virtuales (`venv`, `nvm`) y contenedores Docker.
- Bloquear versiones con `package-lock.json`, `requirements.txt`, `pyproject.toml`, y versiones explícitas en Gradle.
- Ejecutar `npm ci`, `pip install -r requirements.txt`, y `./gradlew build` para reproducibilidad.

---

## 5️⃣ Checklist de pre-implementación

- [ ] Todas las versiones alineadas y documentadas
- [ ] Lockfiles actualizados
- [ ] Dockerfiles revisados y alineados
- [ ] `requirements.txt` y `pyproject.toml` con versiones fijas
- [ ] README actualizado con matriz de versiones
- [ ] Validación manual de builds en los 3 OS principales
- [ ] Pruebas de integración y unitarias configuradas

---

## 6️⃣ Validación final

✅ Todas las versiones propuestas son compatibles y mantenidas
✅ No se detectan conflictos críticos conocidos
✅ Instalación será reproducible si se siguen las versiones y lockfiles
✅ Entorno seguro para desarrollo y producción

---

> **Este archivo debe mantenerse actualizado y revisado antes de cada implementación o despliegue.**

---

## 📜 Referencias clave
- [Manifiesto de Ingeniería y Buenas Prácticas 2026](../../docs/04_manifiesto_final.md)

---

### Trazabilidad

[TRACE-ID: FASE-0-DEVOPS-VER-001]
Acción: Auditoría y alineación de versiones para pre-implementación.
Razón: Garantizar compatibilidad y reproducibilidad en todos los entornos.
Contexto: QA pre-implementación, política de trazabilidad activa.

---
