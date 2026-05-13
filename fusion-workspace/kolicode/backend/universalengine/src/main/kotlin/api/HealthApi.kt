package main.kotlin.api

import com.universal.api.DomainError
import com.universal.api.DomainException
import com.universal.api.GenericResponse
import com.universal.api.installSecurityOrFail
import com.universal.api.isSecurityEnforced
import com.universal.api.requireReadRole
import com.universal.api.resolveSecurityApiKey
import com.universal.api.respondDomainError
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.engine.*
import io.ktor.server.netty.*
import io.ktor.server.plugins.BadRequestException
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.server.plugins.openapi.*
import io.ktor.server.plugins.statuspages.*
import io.ktor.server.plugins.swagger.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import main.kotlin.config.DatabaseFactory

fun Application.module(testMode: Boolean = false) {
    val securityEnabled = isSecurityEnforced(testMode)
    installSecurityOrFail(this, securityEnabled)

    install(ContentNegotiation) {
        json()
    }

    if (securityEnabled) {
        install(Authentication) {
            bearer("api-key") {
                realm = "legacy-health-api"
                authenticate { tokenCredential ->
                    val expected = resolveSecurityApiKey()?.trim().orEmpty()
                    if (expected.isNotBlank() && tokenCredential.token == expected) UserIdPrincipal("api-key") else null
                }
            }
        }
    }

    // StatusPages: mismo contrato GenericResponse<String> + ApiError que UniversalEngine.
    install(StatusPages) {
        exception<BadRequestException> { call, _ ->
            respondDomainError(call, DomainError.Validation("invalid request payload"))
        }
        exception<DomainException> { call, cause ->
            respondDomainError(call, cause.domainError)
        }
        exception<Throwable> { call, cause ->
            call.application.log.error("Unhandled exception in module", cause)
            call.respond(
                HttpStatusCode.InternalServerError,
                GenericResponse<String>(status = "ERROR", error = "internal server error")
            )
        }
    }

    if (!testMode) {
        // OpenAPI/Swagger requiere recursos de spec; se omite en test para evitar fallos de carga.
        routing {
            openAPI(path = "/openapi")
            swaggerUI(path = "/swagger", swaggerFile = "/openapi")
        }
        // Solo inicializa la base de datos si NO está en modo test
        DatabaseFactory.init()
    }

    routing {
        val securedHealth: Route.() -> Unit = {
            get("/health") {
                requireReadRole(call, securityEnabled)
                call.respond(mapOf("status" to "ok"))
            }
        }
        if (securityEnabled) authenticate("api-key", build = securedHealth) else securedHealth()
    }

    exampleApi(securityEnabled = securityEnabled)  // GET|POST /api/v1/example
    projectApi(securityEnabled = securityEnabled)  // Legacy/read-only: compatibilidad critica mientras migra a UniversalEngine
    shotApi(securityEnabled = securityEnabled)     // CRUD     /api/v1/shots
    crewApi(securityEnabled = securityEnabled)     // CRUD     /api/v1/crew
}

fun main() {
    embeddedServer(Netty, port = 8080, module = Application::module).start(wait = true)
}
