package com.imprenta.security

import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.routing.*
import io.ktor.server.response.*
import io.ktor.http.*
import java.util.*

data class TokenRequest(val username: String, val password: String)

fun Application.generatedSecurity() {
    val jwtSecret = environment.config.propertyOrNull("ktor.deployment.jwtSecret")?.getString()
        ?: System.getenv("JWT_SECRET")
        ?: throw IllegalStateException("JWT_SECRET not configured")

    val jwtIssuer = environment.config.propertyOrNull("ktor.deployment.jwtIssuer")?.getString()
        ?: System.getenv("JWT_ISSUER") ?: "imprenta-erp-api"

    val jwtAudience = environment.config.propertyOrNull("ktor.deployment.jwtAudience")?.getString()
        ?: System.getenv("JWT_AUDIENCE") ?: "imprenta-erp-clients"

    install(Authentication) {
        jwt("jwt") {
            realm = "imprenta-erp"
            verifier(
                JWT.require(Algorithm.HMAC256(jwtSecret))
                    .withIssuer(jwtIssuer)
                    .withAudience(jwtAudience)
                    .build()
            )
            validate { credential ->
                if (credential.payload.subject != null) JWTPrincipal(credential.payload) else null
            }
            challenge { _, _ -> call.respond(HttpStatusCode.Unauthorized) }
        }
    }

    val devUsers = mapOf(
        "superadmin" to ("supersecret" to listOf(Role.SUPERADMIN.name, Role.ADMIN.name)),
        "admin" to ("adminpass" to listOf(Role.ADMIN.name)),
        "sales" to ("salespass" to listOf(Role.EMPLEADO_COMERCIAL.name)),
        "taller" to ("tallerpass" to listOf(Role.TALLER.name)),
        "client" to ("clientpass" to listOf(Role.CLIENT.name)),
        "support" to ("supportpass" to listOf(Role.SUPPORT.name))
    )

    routing {
        post("/api/v1/auth/token") {
            val req = call.receive<TokenRequest>()
            val record = devUsers[req.username]
            if (record == null || record.first != req.password) {
                call.respond(mapOf("error" to "invalid_credentials"))
                return@post
            }
            val roles = record.second
            val expiresIn = (System.getenv("JWT_EXP_MS")?.toLongOrNull() ?: 60L * 60L * 1000L)
            val token = JWT.create()
                .withSubject(req.username)
                .withIssuer(jwtIssuer)
                .withAudience(jwtAudience)
                .withArrayClaim("roles", roles.toTypedArray())
                .withIssuedAt(Date())
                .withExpiresAt(Date(System.currentTimeMillis() + expiresIn))
                .sign(Algorithm.HMAC256(jwtSecret))

            call.respond(mapOf("access_token" to token, "token_type" to "bearer", "expires_in" to expiresIn))
        }
    }
}

// ApplicationCall extension helpers
suspend fun ApplicationCall.requireRole(role: Role) {
    val has = roles().contains(role.name)
    if (!has) {
        respond(HttpStatusCode.Forbidden, mapOf("error" to "forbidden", "required_role" to role.name))
        throw IllegalStateException("forbidden")
    }
}

fun ApplicationCall.roles(): List<String> {
    val principal = this.authentication.principal<JWTPrincipal>() ?: return emptyList()
    return principal.payload.getClaim("roles")?.asList(String::class.java) ?: emptyList()
}

