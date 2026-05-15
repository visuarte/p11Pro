package com.generated.ciberpunk

import com.generated.ciberpunk.checklistRoutes
import io.ktor.server.application.*
import io.ktor.server.plugins.callid.*
import io.ktor.server.plugins.callloging.*
import io.ktor.server.engine.embeddedServer
import io.ktor.server.netty.Netty
import io.ktor.server.plugins.contentnegotiation.ContentNegotiation
import io.ktor.server.request.path
import io.ktor.server.request.httpMethod
import io.ktor.serialization.kotlinx.json.json
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.http.content.*
import io.ktor.http.*
import kotlinx.serialization.Serializable
import org.slf4j.event.Level
import java.io.File
import java.util.UUID

@Serializable
data class WebglConfig(
    val name: String,
    val profile: String,
    val useThreeJsInterop: Boolean,
    val enableTailwindDirectives: Boolean
)

fun Application.module() {
    val config = loadAppConfig()

    install(ContentNegotiation) { json() }
    install(CallId) {
        retrieveFromHeader("X-Request-ID")
        generate { UUID.randomUUID().toString() }
        verify { it.isNotBlank() }
        replyToHeader("X-Request-ID")
    }
    install(CallLogging) {
        level = Level.INFO
        callIdMdc("requestId")
        filter { call -> !call.request.path().startsWith("/metrics") }
        mdc("method") { it.request.httpMethod.value }
        mdc("path") { it.request.path() }
    }

    intercept(ApplicationCallPipeline.Monitoring) {
        val startedAtNs = System.nanoTime()
        try {
            proceed()
        } finally {
            val durationMs = (System.nanoTime() - startedAtNs) / 1_000_000
            val statusCode = call.response.status()?.value ?: 500
            AppMetrics.recordRequest(
                method = call.request.httpMethod.value,
                path = call.request.path(),
                statusCode = statusCode,
                durationMs = durationMs
            )
        }
    }

    initializeDatabase(config, environment.log)

    routing {
        get("/") { call.respond(HttpStatusCode.OK, "Hello, World!") }
        get("/health") { call.respond(HttpStatusCode.OK, "Health Check successful") }
        get("/api/health") { call.respond(HttpStatusCode.OK, "Health Check successful") }
        get("/metrics") {
            call.respondText(
                text = AppMetrics.renderPrometheus(),
                contentType = ContentType.parse("text/plain; version=0.0.4")
            )
        }

        get("/api/v1/webgl/config") {
            call.respond(WebglConfig(
                name = "ciberpunk",
                profile = "next_level",
                useThreeJsInterop = config.useThreeJs,
                enableTailwindDirectives = config.enableTailwindDirectives
            ))
        }

        checklistRoutes()
        route("/api/v1/kotguaicli") { kotguaicliRoutes(config) }

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
    val config = loadAppConfig()
    embeddedServer(Netty, port = config.port, host = "0.0.0.0", module = Application::module).start(wait = true)
}
