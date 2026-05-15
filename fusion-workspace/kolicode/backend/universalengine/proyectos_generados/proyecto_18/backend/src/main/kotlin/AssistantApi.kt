package com.generated.ciberpunk

import io.ktor.server.application.*
import io.ktor.server.routing.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.http.*
import kotlinx.serialization.Serializable

@Serializable
data class AssistantState(val state: String, val transcript: String? = null, val timestamp: Long)

// Endpoint para recibir estado del asistente de voz
fun Route.assistantRoutes() {
    post("/api/v1/assistant/state") {
        try {
            val payload = call.receive<AssistantState>()
            call.application.environment.log.info("[assistant/state] received: state=${payload.state}, transcript=${payload.transcript}, timestamp=${payload.timestamp}")
            call.respond(HttpStatusCode.OK, mapOf("received" to true))
        } catch (ex: Exception) {
            call.application.environment.log.warn("[assistant/state] invalid payload: ${ex.message}")
            call.respond(HttpStatusCode.BadRequest, mapOf("received" to false, "error" to (ex.message ?: "invalid payload")))
        }
    }
}
