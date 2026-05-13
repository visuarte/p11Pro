---
inclusion: fileMatch
fileMatchPattern: "**/universalengine/**"
---

# UniversalEngine - API Patterns & AI Integration

## Overview

UniversalEngine is the AI code generation module built with Kotlin + Ktor. It provides:
- **Code Generation**: AI-powered code generation using Ollama/DeepSeek
- **Knowledge Hub**: Database of reusable patterns and templates
- **PDF Processing**: Extract text from PDF documents
- **Project Management**: Store and manage generated projects

## Ktor Application Structure

```kotlin
fun Application.module() {
    // Install features
    install(ContentNegotiation) {
        json(Json {
            prettyPrint = true
            isLenient = true
        })
    }
    install(CORS) {
        anyHost()
    }
    install(CallLogging)
    install(StatusPages) {
        exception<Throwable> { call, cause ->
            call.respondText(
                text = "500: $cause",
                status = HttpStatusCode.InternalServerError
            )
        }
    }
    
    // Configure routing
    configureRouting()
}
```

## Routing Patterns

### RESTful Endpoints

```kotlin
fun Application.configureRouting() {
    routing {
        route("/api/v1") {
            // Code generation endpoints
            route("/generate") {
                post("/code") { handleCodeGeneration() }
                post("/spec") { handleSpecGeneration() }
            }
            
            // Knowledge Hub endpoints
            route("/knowledge") {
                get { listPatterns() }
                get("/{id}") { getPattern() }
                post { createPattern() }
                put("/{id}") { updatePattern() }
                delete("/{id}") { deletePattern() }
            }
            
            // Project management
            route("/projects") {
                get { listProjects() }
                get("/{id}") { getProject() }
                post { createProject() }
                delete("/{id}") { deleteProject() }
            }
        }
    }
}
```

## AI Integration with Ollama/DeepSeek

### HTTP Client Configuration

```kotlin
val client = HttpClient(CIO) {
    install(ContentNegotiation) {
        json(Json {
            ignoreUnknownKeys = true
        })
    }
    install(HttpTimeout) {
        requestTimeoutMillis = 60000
    }
}
```

### Code Generation Request

```kotlin
data class CodeGenRequest(
    val prompt: String,
    val language: String,
    val context: Map<String, Any> = emptyMap()
)

data class CodeGenResponse(
    val code: String,
    val explanation: String,
    val language: String,
    val timestamp: String
)

suspend fun generateCode(request: CodeGenRequest): CodeGenResponse {
    val response = client.post("http://localhost:11434/api/generate") {
        contentType(ContentType.Application.Json)
        setBody(mapOf(
            "model" to "deepseek-coder",
            "prompt" to buildPrompt(request),
            "stream" to false
        ))
    }
    
    val aiResponse = response.body<OllamaResponse>()
    
    return CodeGenResponse(
        code = extractCode(aiResponse.response),
        explanation = extractExplanation(aiResponse.response),
        language = request.language,
        timestamp = Clock.System.now().toString()
    )
}

fun buildPrompt(request: CodeGenRequest): String {
    return """
        Generate ${request.language} code for the following requirement:
        
        ${request.prompt}
        
        Context:
        ${request.context.entries.joinToString("\n") { "${it.key}: ${it.value}" }}
        
        Provide clean, production-ready code with comments.
    """.trimIndent()
}
```

## Database Integration with Exposed

### Database Configuration

```kotlin
object DatabaseFactory {
    fun init() {
        val driverClassName = "org.postgresql.Driver"
        val jdbcURL = System.getenv("DATABASE_URL") 
            ?: "jdbc:postgresql://localhost:5432/unified_db"
        val user = System.getenv("DB_USER") ?: "unified_user"
        val password = System.getenv("DB_PASSWORD") ?: "unified_pass"
        
        Database.connect(
            url = jdbcURL,
            driver = driverClassName,
            user = user,
            password = password
        )
        
        transaction {
            SchemaUtils.create(Projects, Patterns, GeneratedCode)
        }
    }
}
```

### Table Definitions

```kotlin
object Projects : Table("projects") {
    val id = uuid("id").autoGenerate()
    val name = varchar("name", 255)
    val description = text("description").nullable()
    val createdAt = timestamp("created_at").defaultExpression(CurrentTimestamp())
    val updatedAt = timestamp("updated_at").defaultExpression(CurrentTimestamp())
    
    override val primaryKey = PrimaryKey(id)
}

object Patterns : Table("patterns") {
    val id = uuid("id").autoGenerate()
    val name = varchar("name", 255)
    val category = varchar("category", 100)
    val template = text("template")
    val language = varchar("language", 50)
    val tags = array<String>("tags")
    val usageCount = integer("usage_count").default(0)
    
    override val primaryKey = PrimaryKey(id)
}

object GeneratedCode : Table("generated_code") {
    val id = uuid("id").autoGenerate()
    val projectId = uuid("project_id").references(Projects.id)
    val code = text("code")
    val language = varchar("language", 50)
    val prompt = text("prompt")
    val createdAt = timestamp("created_at").defaultExpression(CurrentTimestamp())
    
    override val primaryKey = PrimaryKey(id)
}
```

### DAO Pattern

```kotlin
class ProjectDAO {
    suspend fun create(name: String, description: String?): UUID = dbQuery {
        Projects.insert {
            it[Projects.name] = name
            it[Projects.description] = description
        }[Projects.id]
    }
    
    suspend fun findById(id: UUID): Project? = dbQuery {
        Projects.select { Projects.id eq id }
            .map { toProject(it) }
            .singleOrNull()
    }
    
    suspend fun findAll(): List<Project> = dbQuery {
        Projects.selectAll()
            .map { toProject(it) }
    }
    
    suspend fun update(id: UUID, name: String, description: String?) = dbQuery {
        Projects.update({ Projects.id eq id }) {
            it[Projects.name] = name
            it[Projects.description] = description
            it[Projects.updatedAt] = Clock.System.now().toJavaInstant()
        }
    }
    
    suspend fun delete(id: UUID) = dbQuery {
        Projects.deleteWhere { Projects.id eq id }
    }
    
    private fun toProject(row: ResultRow): Project {
        return Project(
            id = row[Projects.id],
            name = row[Projects.name],
            description = row[Projects.description],
            createdAt = row[Projects.createdAt].toString(),
            updatedAt = row[Projects.updatedAt].toString()
        )
    }
}

suspend fun <T> dbQuery(block: suspend () -> T): T =
    newSuspendedTransaction(Dispatchers.IO) { block() }
```

## PDF Processing

```kotlin
import org.apache.pdfbox.pdmodel.PDDocument
import org.apache.pdfbox.text.PDFTextStripper

class PDFProcessor {
    fun extractText(pdfBytes: ByteArray): String {
        PDDocument.load(pdfBytes).use { document ->
            val stripper = PDFTextStripper()
            return stripper.getText(document)
        }
    }
    
    fun validatePDF(pdfBytes: ByteArray): Boolean {
        return try {
            PDDocument.load(pdfBytes).use { document ->
                document.numberOfPages > 0
            }
        } catch (e: Exception) {
            false
        }
    }
}
```

## Error Handling

### Custom Exceptions

```kotlin
sealed class UniversalEngineException(message: String) : Exception(message)

class CodeGenerationException(message: String) : UniversalEngineException(message)
class DatabaseException(message: String) : UniversalEngineException(message)
class ValidationException(message: String) : UniversalEngineException(message)
class AIServiceException(message: String) : UniversalEngineException(message)
```

### Error Response Handler

```kotlin
install(StatusPages) {
    exception<ValidationException> { call, cause ->
        call.respond(
            HttpStatusCode.BadRequest,
            ErrorResponse(
                code = "VALIDATION_ERROR",
                message = cause.message ?: "Validation failed",
                timestamp = Clock.System.now().toString()
            )
        )
    }
    
    exception<CodeGenerationException> { call, cause ->
        call.respond(
            HttpStatusCode.InternalServerError,
            ErrorResponse(
                code = "CODE_GENERATION_ERROR",
                message = cause.message ?: "Code generation failed",
                timestamp = Clock.System.now().toString()
            )
        )
    }
    
    exception<Throwable> { call, cause ->
        call.respond(
            HttpStatusCode.InternalServerError,
            ErrorResponse(
                code = "INTERNAL_ERROR",
                message = "An unexpected error occurred",
                timestamp = Clock.System.now().toString()
            )
        )
    }
}

data class ErrorResponse(
    val code: String,
    val message: String,
    val timestamp: String
)
```

## Testing Patterns

### Unit Tests

```kotlin
class CodeGenerationTest {
    @Test
    fun `should generate valid code from prompt`() = runTest {
        val request = CodeGenRequest(
            prompt = "Create a function to calculate fibonacci",
            language = "kotlin"
        )
        
        val response = generateCode(request)
        
        assertNotNull(response.code)
        assertTrue(response.code.contains("fun"))
        assertEquals("kotlin", response.language)
    }
}
```

### Integration Tests

```kotlin
class ProjectAPITest {
    @Test
    fun `should create and retrieve project`() = testApplication {
        application {
            module()
        }
        
        // Create project
        val createResponse = client.post("/api/v1/projects") {
            contentType(ContentType.Application.Json)
            setBody("""{"name": "Test Project", "description": "Test"}""")
        }
        
        assertEquals(HttpStatusCode.Created, createResponse.status)
        
        val project = createResponse.body<Project>()
        
        // Retrieve project
        val getResponse = client.get("/api/v1/projects/${project.id}")
        
        assertEquals(HttpStatusCode.OK, getResponse.status)
        val retrieved = getResponse.body<Project>()
        assertEquals(project.name, retrieved.name)
    }
}
```

## Environment Variables

Required `.env` variables:

```bash
# Database
DATABASE_URL=jdbc:postgresql://localhost:5432/unified_db
DB_USER=unified_user
DB_PASSWORD=unified_pass

# AI Service
OLLAMA_URL=http://localhost:11434
AI_MODEL=deepseek-coder

# Server
PORT=8080
HOST=0.0.0.0
```

## Performance Optimization

### Connection Pooling

```kotlin
Database.connect(
    HikariDataSource(HikariConfig().apply {
        jdbcUrl = System.getenv("DATABASE_URL")
        username = System.getenv("DB_USER")
        password = System.getenv("DB_PASSWORD")
        maximumPoolSize = 10
        minimumIdle = 2
        idleTimeout = 600000
        connectionTimeout = 30000
    })
)
```

### Caching

```kotlin
class CachedPatternDAO(private val dao: PatternDAO) {
    private val cache = ConcurrentHashMap<UUID, Pattern>()
    
    suspend fun findById(id: UUID): Pattern? {
        return cache.getOrPut(id) {
            dao.findById(id) ?: return null
        }
    }
    
    fun invalidate(id: UUID) {
        cache.remove(id)
    }
}
```

## References

- UniversalEngine Source: `backend/universalengine/src/`
- Ktor Documentation: https://ktor.io/
- Exposed ORM: https://github.com/JetBrains/Exposed
- Ollama API: https://github.com/ollama/ollama/blob/main/docs/api.md
