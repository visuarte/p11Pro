package main.kotlin.api

import com.universal.api.DomainError
import com.universal.api.DomainException
import com.universal.api.requireTenantFromPrincipal
import com.universal.api.requireWriteRole
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import main.kotlin.contracts.CrewMemberCreate
import main.kotlin.services.CrewService

private fun requireTenantHeader(call: ApplicationCall, securityEnabled: Boolean): String {
    val tenant = call.request.headers["X-Tenant-Id"]?.trim()?.takeIf { it.isNotBlank() }
        ?: throw DomainException(DomainError.Validation("X-Tenant-Id header is required"))
    if (securityEnabled) {
        val fromPrincipal = requireTenantFromPrincipal(call, securityEnabled = true)
        if (fromPrincipal != tenant) {
            throw DomainException(DomainError.Forbidden("tenant mismatch between auth context and header"))
        }
    }
    return tenant
}

fun Application.crewApi(securityEnabled: Boolean = false) {
    routing {
        val secured: Route.() -> Unit = {
            route("/api/v1/crew") {

            /** GET /api/v1/crew?projectId=X&tenantId=Y */
            get {
                val projectId = call.request.queryParameters["projectId"]
                val tenantId = requireTenantHeader(call, securityEnabled)
                call.respond(HttpStatusCode.OK, CrewService.list(projectId, tenantId))
            }

            /** GET /api/v1/crew/{id} */
            get("/{id}") {
                val id = call.parameters["id"]
                    ?: throw DomainException(DomainError.Validation("invalid crew member id"))
                val tenantId = requireTenantHeader(call, securityEnabled)
                val member = CrewService.getById(id, tenantId)
                    ?: throw DomainException(DomainError.NotFound("crew member not found"))
                call.respond(HttpStatusCode.OK, member)
            }

            /** POST /api/v1/crew */
            post {
                requireWriteRole(call, securityEnabled)
                val tenantId = requireTenantHeader(call, securityEnabled)
                val cmd = call.receive<CrewMemberCreate>()
                if (cmd.tenantId != tenantId) {
                    throw DomainException(DomainError.Validation("tenant mismatch between header and payload"))
                }
                val member = CrewService.create(cmd)
                call.respond(HttpStatusCode.Created, member)
            }

            /** PUT /api/v1/crew/{id} */
            put("/{id}") {
                val id = call.parameters["id"]
                    ?: throw DomainException(DomainError.Validation("invalid crew member id"))
                requireWriteRole(call, securityEnabled)
                val tenantId = requireTenantHeader(call, securityEnabled)
                val cmd = call.receive<CrewMemberCreate>()
                if (cmd.tenantId != tenantId) {
                    throw DomainException(DomainError.Validation("tenant mismatch between header and payload"))
                }
                val updated = CrewService.update(id, cmd, tenantId)
                    ?: throw DomainException(DomainError.NotFound("crew member not found"))
                call.respond(HttpStatusCode.OK, updated)
            }

            /** DELETE /api/v1/crew/{id} */
            delete("/{id}") {
                val id = call.parameters["id"]
                    ?: throw DomainException(DomainError.Validation("invalid crew member id"))
                requireWriteRole(call, securityEnabled)
                val tenantId = requireTenantHeader(call, securityEnabled)
                val deleted = CrewService.delete(id, tenantId)
                if (deleted) {
                    call.respond(HttpStatusCode.OK, mapOf("status" to "DELETED", "id" to id))
                } else {
                    throw DomainException(DomainError.NotFound("crew member not found"))
                }
            }
        }
        }

        if (securityEnabled) authenticate("api-key", build = secured) else secured()
    }
}

