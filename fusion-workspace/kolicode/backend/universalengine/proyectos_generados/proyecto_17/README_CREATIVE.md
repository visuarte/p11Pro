        # P10pro - CREATIVE_CODING

        Plantilla creativa generada sin ejecucion de sketches en backend.

        - Engine: processing
        - Runtime: java17
        - Tags: creative
        - Preview: logo.png
        - Descripcion: Crear un editor de codigo de graficos que funciona con codigo css java

        ## DomainSpec
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

        ## UI implementation guidance
        - UI Preset: modern-saas
        - UI Tooling: design-tokens,ui-kit,a11y-checks,visual-regression

        ## Seguridad
        - El backend no ejecuta codigo de usuario.
        - Usa esta salida para trabajo local o ejecucion en cliente.