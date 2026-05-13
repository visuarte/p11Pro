        # ciberpunk - NEXT_LEVEL

        Scaffold inicial con perfil `NEXT_LEVEL`.

        ## Estructura
        - `backend/` Ktor JVM
        - `frontend/` Kotlin/JS + Vite
        - `frontend/src/main/kotlin/Main.kt` con switch WebGL por flag

        ## Flags de perfil
        - `useThreeJsInterop`: true
        - `enableTailwindDirectives`: true

        ## DomainSpec
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

        ## UI implementation guidance
        - UI Preset: enterprise-dashboard
        - UI Tooling: design-tokens,ui-kit,a11y-checks,visual-regression

        ## Run rapido
        - Backend: `cd backend && ./gradlew run`
        - Frontend (Gradle): `cd frontend && ./gradlew jsBrowserDevelopmentRun`
        - Frontend (npm): `cd frontend && npm install && npm run dev`

        ## Build deploy
        - `cd frontend && npm run build`
        - Servir `frontend/dist` como estatico desde Ktor en siguiente fase.