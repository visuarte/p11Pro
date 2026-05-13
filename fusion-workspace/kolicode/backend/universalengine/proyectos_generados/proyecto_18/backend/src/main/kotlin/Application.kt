package com.generated.ciberpunk

import com.generated.ciberpunk.ChecklistEstado
import com.generated.ciberpunk.checklistRoutes

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.engine.embeddedServer
import io.ktor.server.netty.Netty
import io.ktor.server.plugins.contentnegotiation.ContentNegotiation
import io.ktor.serialization.kotlinx.json.json
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.http.content.*

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable

import org.jetbrains.exposed.sql.Database
import org.jetbrains.exposed.sql.SchemaUtils
import org.jetbrains.exposed.sql.transactions.transaction

import java.io.File
import java.time.Instant
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap

private val USE_THREE_JS: Boolean = System.getenv("USE_THREE_JS")?.toBoolean() ?: true
private val ENABLE_TAILWIND_DIRECTIVES: Boolean = System.getenv("ENABLE_TAILWIND_DIRECTIVES")?.toBoolean() ?: false

fun Application.module() {
    install(ContentNegotiation) { json() }

    val dbHost = System.getenv("DB_HOST") ?: "localhost"
    val dbPort = System.getenv("DB_PORT") ?: "5432"
    val dbName = System.getenv("DB_NAME") ?: "ciberpunk"
    val dbUser = System.getenv("DB_USER") ?: "postgres"
    val dbPassword = System.getenv("DB_PASSWORD") ?: "postgres"
    val jdbcUrl = System.getenv("JDBC_DATABASE_URL") ?: "jdbc:postgresql://$dbHost:$dbPort/$dbName"

    // Guard DB initialization so developers can skip it with SKIP_DB_INIT=1
    // Wrap in try/catch to avoid a hard failure during application startup.
    val skipDbInit = System.getenv("SKIP_DB_INIT") == "1"
    if (!skipDbInit) {
        try {
            Database.connect(url = jdbcUrl, driver = "org.postgresql.Driver", user = dbUser, password = dbPassword)
            transaction { SchemaUtils.create(ChecklistEstado) }
        } catch (e: Exception) {
            // Use the application's logger to record the problem but continue startup
            environment.log.warn("DB init failed, continuing without DB: ${'$'}{e.message}")
        }
    } else {
        environment.log.info("SKIP_DB_INIT=1 detected — skipping database initialization (development mode)")
    }

    routing {
        get("/") { call.respond(HttpStatusCode.OK, "Hello, World!") }
        get("/health") { call.respond(HttpStatusCode.OK, "Health Check successful") }
        get("/api/health") { call.respond(HttpStatusCode.OK, "Health Check successful") }
        @Serializable
        data class WebglConfig(
            val name: String,
            val profile: String,
            val useThreeJsInterop: Boolean,
            val enableTailwindDirectives: Boolean
        )

        get("/api/v1/webgl/config") {
            call.respond(WebglConfig(
                name = "ciberpunk",
                profile = "next_level",
                useThreeJsInterop = USE_THREE_JS,
                enableTailwindDirectives = ENABLE_TAILWIND_DIRECTIVES
            ))
        }

        checklistRoutes()

        route("/api/v1/kotguaicli") {
            val kotProcesses = ConcurrentHashMap<String, Process>()
            val persistFile = File("tmp/kotguaicli-serves.json").apply { parentFile?.mkdirs() }

            data class ServeRecord(val id: String, val port: Int, val log: String, val command: String, val startedAt: String)

            fun saveRecords(records: Collection<ServeRecord>) {
                try {
                    val json = buildString {
                        append("[")
                        records.forEachIndexed { idx, r ->
                            append("{")
                            append("\"id\":\"${r.id}\",")
                            append("\"port\":${r.port},")
                            append("\"log\":\"${r.log.replace("\\", "\\\\").replace("\"", "\\\"")}\",")
                            append("\"command\":\"${r.command.replace("\\", "\\\\").replace("\"", "\\\"")}\",")
                            append("\"startedAt\":\"${r.startedAt}\"")
                            append("}")
                            if (idx != records.count() - 1) append(",")
                        }
                        append("]")
                    }
                    persistFile.writeText(json)
                } catch (_: Exception) { }
            }

            fun loadRecords(): MutableList<ServeRecord> {
                if (!persistFile.exists()) return mutableListOf()
                return try {
                    val txt = persistFile.readText().trim()
                    if (txt.isBlank()) return mutableListOf()
                    val items = txt.removePrefix("[").removeSuffix("]").split(Regex("\\},\\s*\\{"))
                    val entries = mutableListOf<ServeRecord>()
                    for (raw in items) {
                        val clean = raw.trim().removePrefix("{").removeSuffix("}")
                        val map = clean.split(Regex(",(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)"))
                            .mapNotNull {
                                val idx = it.indexOf(':')
                                if (idx <= 0) return@mapNotNull null
                                val k = it.substring(0, idx).trim().removeSurrounding("\"")
                                var v = it.substring(idx + 1).trim()
                                if (v.startsWith("\"")) v = v.removeSurrounding("\"")
                                k to v
                            }.toMap()
                        val id = map["id"] ?: continue
                        val port = map["port"]?.toIntOrNull() ?: continue
                        val log = map["log"] ?: ""
                        val command = map["command"] ?: ""
                        val startedAt = map["startedAt"] ?: ""
                        entries.add(ServeRecord(id, port, log, command, startedAt))
                    }
                    entries
                } catch (_: Exception) { mutableListOf() }
            }

            fun requireToken(call: ApplicationCall): Boolean {
                val envToken = System.getenv("KOTGUAICLI_AUTH_TOKEN")
                if (envToken.isNullOrBlank()) return true
                val header = call.request.header("X-KOTGUAICLI-AUTH") ?: call.request.queryParameters["auth"]
                return !header.isNullOrBlank() && header == envToken
            }

            post("/generate-docs") {
                if (!requireToken(call)) { call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "missing or invalid auth token")); return@post }
                val kotPath = System.getenv("KOTGUAICLI_PATH") ?: "../kotguaicli"
                val result = withContext(Dispatchers.IO) {
                    try {
                        val pb = ProcessBuilder("./gradlew", "generateDocs", "--no-daemon", "--console=plain")
                            .directory(File(kotPath))
                            .redirectErrorStream(true)
                        val proc = pb.start()
                        val out = proc.inputStream.bufferedReader().use { it.readText() }
                        val code = proc.waitFor()
                        mapOf("exitCode" to code, "output" to out)
                    } catch (ex: Exception) { mapOf("exitCode" to -1, "output" to (ex.message ?: "error")) }
                }
                call.respond(HttpStatusCode.OK, result)
            }

            post("/serve-docs") {
                if (!requireToken(call)) { call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "missing or invalid auth token")); return@post }
                val req = call.receive<Map<String, String>>()
                val port = req["port"] ?: req["docsPort"] ?: "8090"
                val kotPath = System.getenv("KOTGUAICLI_PATH") ?: "../kotguaicli"
                val id = UUID.randomUUID().toString()
                val logFile = File(kotPath, "serve-docs-${id}.log")
                val command = "./gradlew serveDocs -PdocsPort=$port --no-daemon --console=plain"
                val pb = ProcessBuilder("./gradlew", "serveDocs", "-PdocsPort=$port", "--no-daemon", "--console=plain")
                    .directory(File(kotPath))
                    .redirectOutput(logFile)
                    .redirectErrorStream(true)
                try {
                    val proc = pb.start()
                    kotProcesses[id] = proc
                    val rec = ServeRecord(id = id, port = port.toInt(), log = logFile.absolutePath, command = command, startedAt = Instant.now().toString())
                    val current = loadRecords()
                    current.add(rec)
                    saveRecords(current)
                    call.respond(HttpStatusCode.Accepted, mapOf("id" to id, "port" to port.toInt(), "log" to logFile.absolutePath))
                } catch (ex: Exception) { call.respond(HttpStatusCode.InternalServerError, mapOf("error" to (ex.message ?: "failed to start"))) }
            }

            post("/stop") {
                if (!requireToken(call)) { call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "missing or invalid auth token")); return@post }
                val req = call.receive<Map<String, String>>()
                val id = req["id"]
                if (id == null) { call.respond(HttpStatusCode.BadRequest, mapOf("error" to "missing id")); return@post }
                val proc = kotProcesses.remove(id)
                val persisted = loadRecords()
                val removed = persisted.removeIf { it.id == id }
                if (removed) saveRecords(persisted)
                if (proc == null) { call.respond(HttpStatusCode.NotFound, mapOf("error" to "no such process")); return@post }
                proc.destroy()
                call.respond(HttpStatusCode.OK, mapOf("stopped" to id))
            }

            get("/list") {
                if (!requireToken(call)) { call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "missing or invalid auth token")); return@get }
                val list = loadRecords()
                call.respond(HttpStatusCode.OK, list.map { mapOf("id" to it.id, "port" to it.port, "log" to it.log, "command" to it.command, "startedAt" to it.startedAt) })
            }
        }

        // Serve the docs folder recursively under /docs using a catch-all parameter
        // Example: /docs/guia.html, /docs/frontend/implementacion.html
        get("/docs") {
            val f = File("docs/guia.html")
            if (f.exists()) call.respondFile(f) else call.respond(HttpStatusCode.NotFound)
        }
        get("/docs/guia.html") {
            val f = File("docs/guia.html")
            if (f.exists()) call.respondFile(f) else call.respond(HttpStatusCode.NotFound)
        }
        get("/docs/{...}") {
            val parts = call.parameters.getAll("...") ?: emptyList()
            val rel = parts.joinToString("/")
            val f = File("docs", rel)
            if (f.exists() && f.isFile) {
                call.respondFile(f)
            } else if (f.exists() && f.isDirectory) {
                val idx = File(f, "guia.html")
                if (idx.exists()) call.respondFile(idx) else call.respond(HttpStatusCode.NotFound)
            } else {
                call.respond(HttpStatusCode.NotFound)
            }
        }

        assistantRoutes()
    }
}

fun main() {
    val port = System.getenv("PORT")?.toIntOrNull() ?: 8040
    embeddedServer(Netty, port = port, host = "0.0.0.0", module = Application::module).start(wait = true)
}
