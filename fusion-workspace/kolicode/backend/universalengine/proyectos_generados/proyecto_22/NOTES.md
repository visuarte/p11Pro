        # NOTES

        ## Contexto de negocio
        - Cliente: QA
        - Tarea: Legacy Test Suite
        - Descripcion: Proyecto migrado desde contrato legacy ProjectApi.kt
        - Perfil: STATIC
        - Engine: N/A
        - Runtime: jvm
        - Tags: N/A
        - Preview: N/A
        - UI Preset: modern-saas
        - UI Tooling: design-tokens,ui-kit
        - A11y checks: false
        - Visual regression: false

        ## Dependencias aprobadas
        - Sin dependencias adicionales de catalogo

        ## Timeline
        - Inicio legacy · tipo=legacy-start · fecha=2026-05-05 · estado=planned

        ## DomainSpec (guia funcional)
        ### Requisitos funcionales
        - Autenticacion y autorizacion basica por roles
- CRUD principal del dominio con validacion
- Busqueda y filtrado de registros
- Trazabilidad de cambios y eventos relevantes

        ### Casos de uso
        - Usuario final crea y consulta contenido de servicio backend
- Administrador modera contenido y gestiona estados
- Sistema notifica eventos clave de negocio

        ### Modelo de datos
        - User(id, email, role, createdAt)
- Content(id, ownerId, title, body, status, createdAt)
- AuditEvent(id, entity, action, actorId, timestamp)

        ### APIs necesarias
        - POST /api/v1/auth/login
- GET /api/v1/users/me
- GET|POST /api/v1/content
- GET|PUT|DELETE /api/v1/content/{id}

        ## Observaciones
        - Este archivo esta pensado para notas funcionales, acuerdos y decisiones.
        - Evita meter secretos o credenciales.