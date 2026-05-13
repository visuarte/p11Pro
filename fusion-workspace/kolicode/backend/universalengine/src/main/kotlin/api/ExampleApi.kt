package main.kotlin.api

import com.universal.api.requireReadRole
import com.universal.api.requireWriteRole
import io.ktor.server.application.*
import io.ktor.server.auth.authenticate
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

fun Application.exampleApi(securityEnabled: Boolean = false) {
    routing {
        val secured: Route.() -> Unit = {
            get("/api/v1/example") {
                requireReadRole(call, securityEnabled)
                call.respond(mapOf("message" to "¡Hola desde el backend Kotlin!"))
            }
            post("/api/v1/example") {
                requireWriteRole(call, securityEnabled)
                val params = call.receive<Map<String, String>>()
                call.respond(mapOf("received" to params))
            }
        }

        if (securityEnabled) authenticate("api-key", build = secured) else secured()
    }
}
