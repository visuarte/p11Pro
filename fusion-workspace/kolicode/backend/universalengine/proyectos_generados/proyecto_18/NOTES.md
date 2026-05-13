        # NOTES

        ## Contexto de negocio
        - Cliente: locura app
        - Tarea: crear un sistema de asistente por voz
        - Descripcion: N/A
        - Perfil: NEXT_LEVEL
        - Engine: N/A
        - Runtime: jvm
        - Tags: N/A
        - Preview: N/A
        - UI Preset: enterprise-dashboard
        - UI Tooling: design-tokens,ui-kit,a11y-checks,visual-regression
        - A11y checks: true
        - Visual regression: true

        ## Dependencias aprobadas
        - PostgreSQL (42.7.4) · database
- JWT Auth (0.12.6) · security

        ## Timeline
        - Sin hitos definidos

        ## DomainSpec (guia funcional)
        ### Requisitos funcionales
        - Autenticacion y autorizacion basica por roles
- CRUD principal del dominio con validacion
- Busqueda y filtrado de registros
- Trazabilidad de cambios y eventos relevantes

        ### Casos de uso
        - Usuario final crea y consulta contenido de experiencia web interactiva
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