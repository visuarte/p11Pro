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
import main.kotlin.contracts.ShotCreate
import main.kotlin.services.ShotService

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

fun Application.shotApi(securityEnabled: Boolean = false) {
    routing {
        val secured: Route.() -> Unit = {
            route("/api/v1/shots") {

            /** GET /api/v1/shots?projectId=X&tenantId=Y */
            get {
                val projectId = call.request.queryParameters["projectId"]
                val tenantId = requireTenantHeader(call, securityEnabled)
                call.respond(HttpStatusCode.OK, ShotService.list(projectId, tenantId))
            }

            /** GET /api/v1/shots/{id} */
            get("/{id}") {
                val id = call.parameters["id"]
                    ?: throw DomainException(DomainError.Validation("invalid shot id"))
                val tenantId = requireTenantHeader(call, securityEnabled)
                val shot = ShotService.getById(id, tenantId)
                    ?: throw DomainException(DomainError.NotFound("shot not found"))
                call.respond(HttpStatusCode.OK, shot)
            }

            /** POST /api/v1/shots */
            post {
                requireWriteRole(call, securityEnabled)
                val tenantId = requireTenantHeader(call, securityEnabled)
                val cmd = call.receive<ShotCreate>()
                if (cmd.tenantId != tenantId) {
                    throw DomainException(DomainError.Validation("tenant mismatch between header and payload"))
                }
                val shot = ShotService.create(cmd)
                call.respond(HttpStatusCode.Created, shot)
            }

            /** PUT /api/v1/shots/{id} */
            put("/{id}") {
                val id = call.parameters["id"]
                    ?: throw DomainException(DomainError.Validation("invalid shot id"))
                requireWriteRole(call, securityEnabled)
                val tenantId = requireTenantHeader(call, securityEnabled)
                val cmd = call.receive<ShotCreate>()
                if (cmd.tenantId != tenantId) {
                    throw DomainException(DomainError.Validation("tenant mismatch between header and payload"))
                }
                val updated = ShotService.update(id, cmd, tenantId)
                    ?: throw DomainException(DomainError.NotFound("shot not found"))
                call.respond(HttpStatusCode.OK, updated)
            }

            /** DELETE /api/v1/shots/{id} */
            delete("/{id}") {
                val id = call.parameters["id"]
                    ?: throw DomainException(DomainError.Validation("invalid shot id"))
                requireWriteRole(call, securityEnabled)
                val tenantId = requireTenantHeader(call, securityEnabled)
                val deleted = ShotService.delete(id, tenantId)
                if (deleted) {
                    call.respond(HttpStatusCode.OK, mapOf("status" to "DELETED", "id" to id))
                } else {
                    throw DomainException(DomainError.NotFound("shot not found"))
                }
            }
        }
        }

        if (securityEnabled) authenticate("api-key", build = secured) else secured()
    }
}

