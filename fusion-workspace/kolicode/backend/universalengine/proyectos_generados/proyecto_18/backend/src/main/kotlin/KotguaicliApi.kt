package com.generated.ciberpunk

import io.ktor.http.HttpStatusCode
import io.ktor.server.application.call
import io.ktor.server.application.ApplicationCall
import io.ktor.server.request.header
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import io.ktor.server.routing.post
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.json.Json
import java.io.File
import java.time.Instant
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.TimeUnit

@Serializable
data class ServeRecord(
    val id: String,
    val port: Int,
    val log: String,
    val command: String,
    val startedAt: String
)

@Serializable
data class GenerateDocsResponse(
    val exitCode: Int,
    val output: String
)

@Serializable
data class ServeDocsRequest(
    val id: String? = null,
    val port: Int? = null,
    val docsPort: Int? = null
)

@Serializable
data class ServeDocsResponse(
    val id: String,
    val port: Int,
    val log: String
)

private val kotguaicliJson = Json {
    prettyPrint = true
    ignoreUnknownKeys = true
}

fun Route.kotguaicliRoutes(config: AppConfig) {
    val kotProcesses = ConcurrentHashMap<String, Process>()
    val persistFile = File("tmp/kotguaicli-serves.json").apply { parentFile?.mkdirs() }

    fun saveRecords(records: Collection<ServeRecord>) {
        persistFile.writeText(kotguaicliJson.encodeToString(ListSerializer(ServeRecord.serializer()), records.toList()))
    }

    fun loadRecords(): MutableList<ServeRecord> {
        if (!persistFile.exists()) return mutableListOf()
        val content = persistFile.readText().trim()
        if (content.isBlank()) return mutableListOf()
        return kotguaicliJson.decodeFromString(ListSerializer(ServeRecord.serializer()), content).toMutableList()
    }

    fun requireToken(call: ApplicationCall): Boolean {
        val expected = config.kotguaicliAuthToken
        if (expected.isNullOrBlank()) return true
        val presented = call.request.header("X-KOTGUAICLI-AUTH") ?: call.request.queryParameters["auth"]
        return !presented.isNullOrBlank() && presented == expected
    }

    fun buildGradleCommand(vararg args: String): ProcessBuilder {
        return ProcessBuilder("./gradlew", *args)
            .directory(File(config.kotguaicliPath))
            .redirectErrorStream(true)
    }

    post("/generate-docs") {
        if (!requireToken(call)) {
            call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "missing or invalid auth token"))
            return@post
        }

        val result = withContext(Dispatchers.IO) {
            val process = buildGradleCommand("generateDocs", "--no-daemon", "--console=plain").start()
            val output = process.inputStream.bufferedReader().use { it.readText() }
            val exitCode = process.waitFor()
            GenerateDocsResponse(exitCode = exitCode, output = output)
        }

        AppMetrics.recordKotguaicliAction("generate_docs")
        call.respond(HttpStatusCode.OK, result)
    }

    post("/serve-docs") {
        if (!requireToken(call)) {
            call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "missing or invalid auth token"))
            return@post
        }

        val request = call.receive<ServeDocsRequest>()
        val port = request.port ?: request.docsPort ?: 8090
        val id = UUID.randomUUID().toString()
        val logFile = File(config.kotguaicliPath, "serve-docs-$id.log")
        val command = "./gradlew serveDocs -PdocsPort=$port --no-daemon --console=plain"

        val process = buildGradleCommand("serveDocs", "-PdocsPort=$port", "--no-daemon", "--console=plain")
            .redirectOutput(logFile)
            .start()

        kotProcesses[id] = process
        val records = loadRecords()
        records.add(
            ServeRecord(
                id = id,
                port = port,
                log = logFile.absolutePath,
                command = command,
                startedAt = Instant.now().toString()
            )
        )
        saveRecords(records)

        AppMetrics.recordKotguaicliAction("serve_docs")
        call.respond(
            HttpStatusCode.Accepted,
            ServeDocsResponse(id = id, port = port, log = logFile.absolutePath)
        )
    }

    post("/stop") {
        if (!requireToken(call)) {
            call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "missing or invalid auth token"))
            return@post
        }

        val request = call.receive<ServeDocsRequest>()
        val id = request.id
        if (id.isNullOrBlank()) {
            call.respond(HttpStatusCode.BadRequest, mapOf("error" to "missing id"))
            return@post
        }

        val process = kotProcesses.remove(id)
        val records = loadRecords()
        val removed = records.removeIf { it.id == id }
        if (removed) {
            saveRecords(records)
        }

        if (process == null) {
            call.respond(HttpStatusCode.NotFound, mapOf("error" to "no such process"))
            return@post
        }

        process.destroy()
        if (!process.waitFor(5, TimeUnit.SECONDS)) {
            process.destroyForcibly()
            process.waitFor(5, TimeUnit.SECONDS)
        }
        AppMetrics.recordKotguaicliAction("stop")
        call.respond(HttpStatusCode.OK, mapOf("stopped" to id))
    }

    get("/list") {
        if (!requireToken(call)) {
            call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "missing or invalid auth token"))
            return@get
        }

        AppMetrics.recordKotguaicliAction("list")
        call.respond(HttpStatusCode.OK, loadRecords())
    }
}
