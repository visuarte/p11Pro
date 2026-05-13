# Agents Roadmap - WebMenu Project

Este documento define las fases para convertir el esqueleto actual en un tejido funcional completo.

## Fase 1: Cimientos e Infraestructura (Estado: COMPLETADO)
- [x] Inicialización estratégica de Gradle (Kotlin DSL).
- [x] Reestructuración de archivos a `src/main/kotlin/com/generated/webmenu/`.
- [x] Configuración de dependencias: Ktor Core, Auth, Serialization, Exposed (ORM), Postgres.
- [x] Orquestación multi-contenedor con `docker-compose.yml`.

## Fase 2: Identidad y Seguridad (Estado: PENDIENTE)
- [ ] Definición de modelo `User` (email, role).
- [ ] Implementación de `AuthService` y gestor de tokens JWT.
- [ ] Endpoints: `POST /api/v1/auth/login`, `GET /api/v1/users/me`.

## Fase 3: Dominio de Menú Interactivo (Estado: PENDIENTE)
- [ ] Definición de modelo `Content` (Menu items).
- [ ] Implementación de lógica CRUD con validación de estados.
- [ ] Motor de búsqueda y filtrado de categorías.

## Fase 4: Experiencia Visual WebGL (Estado: PENDIENTE)
- [ ] Integración de Three.js en el frontend (`ui/`).
- [ ] Interfaz de menú 3D interactivo con `creative-minimal` preset.
- [ ] Sincronización de datos tiempo real con el backend.

## Fase 5: Trazabilidad y Calidad (Estado: PENDIENTE)
- [ ] Sistema de `AuditEvent` para trazabilidad de cambios.
- [ ] Activación de checks de accesibilidad (A11y).
- [ ] Verificación de regresión visual.
