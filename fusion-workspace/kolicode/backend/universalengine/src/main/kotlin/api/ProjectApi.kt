package main.kotlin.api

import com.universal.api.DomainError
import com.universal.api.DomainException
import com.universal.api.requireTenantFromPrincipal
import com.universal.api.requireWriteRole
import io.ktor.http.HttpHeaders
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.serialization.Serializable

private const val PROJECT_API_SUNSET_AT = "2026-10-06T00:00:00Z"
private const val PROJECT_API_MIGRATION_DOC = "/docs/migrations/project-api-to-universalengine"

@Serializable
data class CrearProyectoRequest(
    val nombre: String,
    val director: String,
    val fecha_inicio: String,
    val equipo: List<String>
)

@Serializable
data class ProyectoResponse(
    val id: Int,
    val nombre: String,
    val director: String,
    val fecha_inicio: String,
    val equipo: List<String>,
    val estado: String
)

fun Application.projectApi(securityEnabled: Boolean = false) {
    routing {
        val secured: Route.() -> Unit = {
            post("/api/v1/projects") {
                if (securityEnabled) {
                    requireWriteRole(call, securityEnabled = true)
                    val tenant = call.request.headers["X-Tenant-Id"]?.trim()?.takeIf { it.isNotBlank() }
                        ?: throw DomainException(DomainError.Validation("X-Tenant-Id header is required"))
                    val fromPrincipal = requireTenantFromPrincipal(call, securityEnabled = true)
                    if (tenant != fromPrincipal) {
                        throw DomainException(DomainError.Forbidden("tenant mismatch between auth context and header"))
                    }
                }

                val req = call.receive<CrearProyectoRequest>()
                call.application.log.warn("Legacy ProjectApi.kt consumido para proyecto='${req.nombre}'")
                call.response.headers.append("Deprecation", "true")
                call.response.headers.append("Sunset", PROJECT_API_SUNSET_AT)
                call.response.headers.append("Warning", "299 - \"ProjectApi.kt deprecated; migrate to UniversalEngine\"")
                call.response.headers.append(HttpHeaders.Link, "<$PROJECT_API_MIGRATION_DOC>; rel=\"deprecation\"")

                val response = ProyectoResponse(
                    id = 1,
                    nombre = req.nombre,
                    director = req.director,
                    fecha_inicio = req.fecha_inicio,
                    equipo = req.equipo,
                    estado = "CREADO"
                )
                call.respond(response)
            }
        }

        if (securityEnabled) authenticate("api-key", build = secured) else secured()
    }
}
