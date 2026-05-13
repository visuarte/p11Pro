        # webmenu

        Backend ultraligero generado automaticamente.

        ## Configuracion base
        - Cliente: visuarte
        - Tarea: Menu Interactivo
        - Descripcion: WebGL para Restaurante

        ## Timeline
        - Sin hitos definidos

        ## DomainSpec
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

        ## UI implementation guidance
        - UI Preset: creative-minimal
        - UI Tooling: design-tokens,ui-kit,a11y-checks,visual-regression

        ## Capacidades base
        - Ktor 2.x + Kotlin
        - Contrato HTTP JSON estandar
        - Endpoints `/health` y `/ready`
        - Manejo de errores y logging
        - Dockerfile listo para despliegue
        - CI de ejemplo para build y test

        ## Ejecucion local
        ./gradlew run