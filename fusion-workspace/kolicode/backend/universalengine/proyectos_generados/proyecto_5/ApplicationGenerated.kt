package com.generated.portal_cliente

import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

fun Application.generatedModule() {
    routing {
        get("/health") { call.respond(mapOf("status" to "ok")) }
        get("/ready") { call.respond(mapOf("status" to "ready")) }
        get("/api/v1/info") {
            call.respond(
                mapOf(
                    "name" to "Portal Cliente",
                    "runtime" to "ktor",
                    "profile" to "ultralight"
                )
            )
        }
    }
}