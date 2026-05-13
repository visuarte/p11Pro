        # NOTES

        ## Contexto de negocio
        - Cliente: Jamon
        - Tarea: Crear un editor de codigo grafico Py5+Process
        - Descripcion: Crear un editor de codigo de graficos que funciona con codigo css java
        - Perfil: CREATIVE_CODING
        - Engine: PROCESSING
        - Runtime: java17
        - Tags: creative
        - Preview: logo.png
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
        - Usuario final crea y consulta contenido de experiencia creativa
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