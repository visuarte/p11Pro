        # NOTES

        ## Contexto de negocio
        - Cliente: Jamon
        - Tarea: Crear un editor de codigo grafico
        - Descripcion: Crear un editor de codigo grafico que funciona con codigo
        - Perfil: STATIC
        - Engine: N/A
        - Runtime: jvm
        - Tags: N/A
        - Preview: N/A
        - UI Preset: modern-saas
        - UI Tooling: design-tokens,ui-kit,a11y-checks,visual-regression
        - A11y checks: true
        - Visual regression: true

        ## Dependencias aprobadas
        - PostgreSQL (42.7.4) · database

        ## Timeline
        - Sin hitos definidos

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