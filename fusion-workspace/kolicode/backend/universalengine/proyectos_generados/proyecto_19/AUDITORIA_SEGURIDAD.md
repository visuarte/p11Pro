# 🔒 AUDITORÍA DE SEGURIDAD - ERP IMPRENTA ONLINE

## 📋 Resumen Ejecutivo

Este documento detalla el análisis de seguridad del sistema ERP para imprenta online, identificando riesgos críticos, vulnerabilidades potenciales y recomendaciones de mitigación.

**Fecha de Auditoría**: 2024
**Versión del Sistema**: 1.0
**Auditor**: Claude (Anthropic)

---

## 🎯 ALCANCE DE LA AUDITORÍA

### Archivos y Componentes Revisados:
- `application.conf` - Configuración de la aplicación
- `ApplicationGenerated.kt` - Código de aplicación generado
- `SecurityGenerated.kt` - Configuración de seguridad
- `ObservabilityGenerated.kt` - Logging y monitorización
- `Dockerfile` - Configuración de contenedor
- `public/` - Recursos estáticos (JS, SVG)
- `DatabaseNotes.md`, `NOTES.md`, `RESOURCES.md` - Documentación

---

## 🚨 HALLAZGOS CRÍTICOS

### 1. GESTIÓN DE SECRETOS Y CREDENCIALES

#### 🔴 **CRÍTICO**: `application.conf`

**Riesgo Identificado:**
- Almacenamiento de credenciales en texto plano
- Exposición de strings de conexión a bases de datos
- Configuraciones sensibles sin cifrado

**Impacto:**
- Acceso no autorizado a la base de datos
- Compromiso de credenciales de terceros (APIs, servicios externos)
- Violación de cumplimiento (GDPR, PCI-DSS)

**Recomendaciones:**

```kotlin
// ❌ MAL - NO HACER ESTO
database {
    url = "jdbc:postgresql://localhost:5432/imprenta"
    user = "admin"
    password = "SuperSecret123!"
}

// ✅ BIEN - Usar variables de entorno
database {
    url = ${DATABASE_URL}
    user = ${DATABASE_USER}
    password = ${DATABASE_PASSWORD}
}
```

**Implementación Segura:**

```kotlin
// application.conf
ktor {
    deployment {
        port = 8080
        port = ${?PORT}  // Override desde variable de entorno
    }
}

database {
    url = ${DATABASE_URL}
    user = ${DATABASE_USER}
    password = ${DATABASE_PASSWORD}
    maxPoolSize = ${?DB_POOL_SIZE}
    maxPoolSize = 10
}

jwt {
    secret = ${JWT_SECRET}  // NUNCA en texto plano
    issuer = ${JWT_ISSUER}
    audience = ${JWT_AUDIENCE}
    realm = "Imprenta ERP"
}
```

**Acciones Inmediatas:**
1. ✅ Migrar todas las credenciales a variables de entorno
2. ✅ Usar un sistema de gestión de secretos (Vault, AWS Secrets Manager, Azure Key Vault)
3. ✅ Añadir `.env` al `.gitignore`
4. ✅ Rotar todas las credenciales existentes
5. ✅ Implementar cifrado en reposo para configuraciones sensibles

---

### 2. CÓDIGO GENERADO AUTOMÁTICAMENTE

#### 🟡 **ALTO**: `ApplicationGenerated.kt`, `SecurityGenerated.kt`, `ObservabilityGenerated.kt`

**Riesgo Identificado:**
- Código generado puede contener configuraciones inseguras por defecto
- Falta de revisión manual de código crítico
- Posibles backdoors o configuraciones débiles

**Puntos de Revisión Obligatoria:**

```kotlin
// SecurityGenerated.kt - VERIFICAR:

// 1. Autenticación y Autorización
install(Authentication) {
    jwt("auth-jwt") {
        // ❌ RIESGO: Validación débil de tokens
        verifier(makeJwtVerifier())
        validate { credential ->
            // DEBE validar:
            // - Expiración del token
            // - Issuer correcto
            // - Audience correcto
            // - Claims necesarios (roles, permisos)
            if (credential.payload.getClaim("username").asString() != "") {
                JWTPrincipal(credential.payload)
            } else {
                null
            }
        }
    }
}

// 2. CORS - Configuración Restrictiva
install(CORS) {
    // ❌ PELIGRO: anyHost() en producción
    anyHost()  // NUNCA en producción
    
    // ✅ BIEN: Lista blanca de dominios
    allowHost("imprenta-erp.com", schemes = listOf("https"))
    allowHost("app.imprenta-erp.com", schemes = listOf("https"))
    
    allowHeader(HttpHeaders.ContentType)
    allowHeader(HttpHeaders.Authorization)
    allowMethod(HttpMethod.Options)
    allowMethod(HttpMethod.Get)
    allowMethod(HttpMethod.Post)
    allowMethod(HttpMethod.Put)
    allowMethod(HttpMethod.Delete)
    
    // Limitar credenciales
    allowCredentials = true
    maxAgeInSeconds = 3600
}

// 3. Rate Limiting
install(RateLimiting) {
    // DEBE existir para prevenir DoS
    register(RateLimitName("public")) {
        rateLimiter(limit = 100, refillPeriod = 60.seconds)
    }
    
    register(RateLimitName("api")) {
        rateLimiter(limit = 1000, refillPeriod = 60.seconds)
    }
}

// 4. Content Security Policy
install(DefaultHeaders) {
    header("X-Content-Type-Options", "nosniff")
    header("X-Frame-Options", "DENY")
    header("X-XSS-Protection", "1; mode=block")
    header("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
    header("Content-Security-Policy", "default-src 'self'")
}
```

**Checklist de Revisión:**
- [ ] Autenticación JWT implementada correctamente
- [ ] Autorización basada en roles (RBAC) configurada
- [ ] CORS restrictivo (sin `anyHost()` en producción)
- [ ] Rate limiting activado
- [ ] Headers de seguridad configurados
- [ ] HTTPS forzado en producción
- [ ] Validación de entrada en todos los endpoints
- [ ] Sanitización de salida para prevenir XSS

---

### 3. LOGGING Y OBSERVABILIDAD

#### 🟡 **MEDIO**: `ObservabilityGenerated.kt`

**Riesgo Identificado:**
- Logging de información sensible (contraseñas, tokens, PII)
- Falta de enmascaramiento de datos
- Logs sin rotación adecuada

**Implementación Segura:**

```kotlin
// ObservabilityGenerated.kt

install(CallLogging) {
    level = Level.INFO
    
    // ✅ Filtrar rutas sensibles
    filter { call -> 
        !call.request.path().startsWith("/admin") &&
        !call.request.path().contains("password")
    }
    
    // ✅ Formato de log estructurado
    format { call ->
        val status = call.response.status()
        val httpMethod = call.request.httpMethod.value
        val path = call.request.path()
        val userAgent = call.request.userAgent()
        
        // NO logear:
        // - Authorization headers
        // - Request bodies con contraseñas
        // - Datos personales (emails, teléfonos)
        
        "$httpMethod $path - Status: $status"
    }
    
    // ✅ Enmascarar datos sensibles
    mdc("requestId") { call ->
        call.request.header("X-Request-ID") ?: UUID.randomUUID().toString()
    }
}

// Función para enmascarar datos sensibles
fun sanitizeLogData(data: String): String {
    return data
        .replace(Regex("password=\\S+"), "password=***")
        .replace(Regex("token=\\S+"), "token=***")
        .replace(Regex("\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b"), "***@***.***")
        .replace(Regex("\\b\\d{16}\\b"), "****-****-****-****") // Tarjetas de crédito
}
```

**Recomendaciones:**
1. ✅ Nunca logear contraseñas, tokens o API keys
2. ✅ Enmascarar datos personales (emails, teléfonos, direcciones)
3. ✅ Implementar rotación de logs automática
4. ✅ Almacenar logs en sistema centralizado (ELK Stack, Datadog)
5. ✅ Configurar alertas para eventos de seguridad

---

### 4. DOCKER Y CONTENEDORES

#### 🟡 **MEDIO-ALTO**: `Dockerfile`

**Riesgos Comunes:**

```dockerfile
# ❌ MAL - Múltiples problemas de seguridad
FROM openjdk:11
WORKDIR /app
COPY . .
RUN chmod 777 /app
EXPOSE 8080
CMD ["java", "-jar", "app.jar"]

# ✅ BIEN - Dockerfile seguro
FROM openjdk:17-jdk-slim AS build
WORKDIR /app
COPY build.gradle.kts settings.gradle.kts ./
COPY gradle ./gradle
COPY gradlew ./
RUN ./gradlew dependencies --no-daemon

COPY src ./src
RUN ./gradlew build --no-daemon && \
    rm -rf build/libs/*-plain.jar

# Runtime stage
FROM openjdk:17-jre-slim
LABEL maintainer="security@imprenta-erp.com"

# Crear usuario no-root
RUN groupadd -r appuser && useradd -r -g appuser appuser

WORKDIR /app

# Copiar solo el JAR necesario
COPY --from=build /app/build/libs/*.jar app.jar
COPY --chown=appuser:appuser application.conf ./

# Cambiar a usuario no-root
USER appuser

# Exponer solo puerto necesario
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:8080/health || exit 1

# Comando de inicio
ENTRYPOINT ["java", \
    "-XX:+UseContainerSupport", \
    "-XX:MaxRAMPercentage=75.0", \
    "-Djava.security.egd=file:/dev/./urandom", \
    "-jar", "app.jar"]
```

**Checklist de Seguridad Docker:**
- [ ] Usar imágenes base oficiales y actualizadas
- [ ] Multi-stage builds para reducir superficie de ataque
- [ ] Ejecutar como usuario no-root
- [ ] No incluir secretos en la imagen
- [ ] Escanear imagen con herramientas (Trivy, Snyk)
- [ ] Limitar recursos (CPU, memoria)
- [ ] Configurar health checks
- [ ] Usar `.dockerignore` adecuado

**.dockerignore:**
```
.git
.github
.idea
*.md
.env
.env.*
secrets/
*.key
*.pem
node_modules
__pycache__
*.pyc
.DS_Store
coverage/
test/
```

---

### 5. ARCHIVOS PÚBLICOS

#### 🟡 **MEDIO**: `public/icons.svg`, `public/js/icons.js`

**Riesgos Identificados:**
- SVG puede contener JavaScript malicioso
- Archivos JS sin minificar pueden ser manipulados
- Falta de validación de contenido

**Mitigación:**

```javascript
// ✅ Content Security Policy para recursos públicos
app.use((req, res, next) => {
    res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; " +
        "script-src 'self'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: https:; " +
        "font-src 'self' data:; " +
        "connect-src 'self'"
    );
    next();
});

// Sanitizar SVG antes de servir
function sanitizeSVG(svgContent) {
    // Remover scripts, event handlers, y elementos peligrosos
    return svgContent
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
        .replace(/<iframe/gi, '');
}
```

**Recomendaciones:**
1. ✅ Minificar y ofuscar JavaScript en producción
2. ✅ Validar SVG con sanitizador (DOMPurify)
3. ✅ Implementar Subresource Integrity (SRI) para CDNs
4. ✅ Servir archivos estáticos con headers de seguridad correctos

---

### 6. DOCUMENTACIÓN SENSIBLE

#### 🟡 **MEDIO**: `DatabaseNotes.md`, `NOTES.md`, `RESOURCES.md`

**Riesgos:**
- Exposición de arquitectura interna
- Credenciales en notas de desarrollo
- Información de endpoints internos

**Ejemplo de Contenido Peligroso:**
```markdown
# ❌ NO HACER ESTO EN DOCUMENTACIÓN

## Database Connection
Server: db-prod.internal.company.com:5432
User: admin
Password: Prod2024!Secret

## API Keys
Stripe: sk_live_51Hxxxxxxxxxxxxx
AWS: AKIAIOSFODNN7EXAMPLE
```

**Buenas Prácticas:**
1. ✅ NO almacenar credenciales en documentación
2. ✅ Usar placeholders: `DATABASE_URL=postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DB]`
3. ✅ Documentar proceso de obtención de credenciales, no las credenciales mismas
4. ✅ Revisar archivos `.md` antes de commits
5. ✅ Usar `.gitignore` para excluir notas privadas

---

## 🔐 ARQUITECTURA DE SEGURIDAD RECOMENDADA

### Capas de Seguridad

```
┌─────────────────────────────────────────────────┐
│  1. EDGE LAYER (Cloudflare, AWS WAF)           │
│     - DDoS Protection                           │
│     - Rate Limiting                             │
│     - Geo-blocking                              │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  2. API GATEWAY / LOAD BALANCER                 │
│     - SSL/TLS Termination                       │
│     - Authentication (JWT)                      │
│     - Request Validation                        │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  3. APPLICATION LAYER (Ktor)                    │
│     - Authorization (RBAC)                      │
│     - Input Validation                          │
│     - Business Logic                            │
│     - Output Sanitization                       │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  4. DATA LAYER (PostgreSQL)                     │
│     - Encryption at Rest                        │
│     - Prepared Statements (Anti-SQL Injection)  │
│     - Row-Level Security                        │
│     - Audit Logging                             │
└─────────────────────────────────────────────────┘
```

---

## 🛡️ CHECKLIST DE IMPLEMENTACIÓN

### Autenticación y Autorización
- [ ] JWT con firma segura (HS256 o RS256)
- [ ] Tokens con expiración (15-60 minutos)
- [ ] Refresh tokens seguros
- [ ] RBAC implementado (Admin, Manager, User, Customer)
- [ ] Permisos granulares por endpoint

### Validación de Entrada
- [ ] Validación de tipos de datos
- [ ] Sanitización de HTML/SQL
- [ ] Límites de tamaño de peticiones
- [ ] Validación de formato (emails, URLs, números)
- [ ] Protección contra inyección SQL (prepared statements)

### Protección de Datos
- [ ] Cifrado en tránsito (TLS 1.3)
- [ ] Cifrado en reposo (AES-256)
- [ ] Hashing seguro de contraseñas (bcrypt/Argon2)
- [ ] Enmascaramiento de datos sensibles en logs
- [ ] Backup cifrado

### Monitorización y Auditoría
- [ ] Logging de eventos de seguridad
- [ ] Alertas de actividad sospechosa
- [ ] Auditoría de accesos a datos sensibles
- [ ] Métricas de seguridad (intentos fallidos, etc.)

### Compliance
- [ ] GDPR - Derecho al olvido
- [ ] GDPR - Portabilidad de datos
- [ ] Retención de datos definida
- [ ] Política de privacidad actualizada
- [ ] Términos de servicio claros

---

## 🚀 PLAN DE ACCIÓN INMEDIATA

### Prioridad 1 (Crítico - 1 semana)
1. Migrar todas las credenciales a variables de entorno
2. Implementar autenticación JWT
3. Configurar HTTPS obligatorio
4. Sanitizar y validar todas las entradas

### Prioridad 2 (Alto - 2 semanas)
1. Implementar rate limiting
2. Configurar headers de seguridad
3. Revisar y endurecer código generado
4. Escanear dependencias por vulnerabilidades

### Prioridad 3 (Medio - 1 mes)
1. Implementar sistema de auditoría
2. Configurar monitorización de seguridad
3. Realizar pruebas de penetración
4. Documentar políticas de seguridad

---

## 📊 MÉTRICAS DE SEGURIDAD

### KPIs a Monitorizar
- Intentos de autenticación fallidos / hora
- Peticiones bloqueadas por rate limiting
- Intentos de inyección SQL detectados
- Tiempo medio de respuesta a incidentes
- Cobertura de tests de seguridad

---

## 📝 CONCLUSIONES

El sistema presenta una arquitectura sólida pero requiere atención inmediata en:
1. **Gestión de secretos** - Migración urgente a variables de entorno
2. **Autenticación/Autorización** - Implementación robusta de JWT y RBAC
3. **Validación de entrada** - Protección contra inyecciones
4. **Logging seguro** - Evitar exposición de datos sensibles

Con las recomendaciones implementadas, el sistema alcanzará un nivel de seguridad apropiado para producción.

---

**Próxima Revisión**: 3 meses después de implementación
**Responsable**: Equipo de Seguridad
**Contacto**: security@imprenta-erp.com
