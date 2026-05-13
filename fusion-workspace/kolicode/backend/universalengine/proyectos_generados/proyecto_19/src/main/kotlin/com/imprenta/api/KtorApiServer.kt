package com.imprenta.api

import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import io.ktor.server.engine.*
import io.ktor.server.netty.*
import io.ktor.server.response.*
import io.ktor.server.request.*
import io.ktor.server.routing.*
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.server.plugins.cors.routing.*
// ...removed call logging import (not required for tests / may require different Ktor package)
import io.ktor.server.plugins.statuspages.*
import kotlinx.serialization.*
import com.imprenta.security.Role
import com.imprenta.security.requireRole
import com.imprenta.security.generatedSecurity
import com.imprenta.security.roles
import kotlinx.serialization.json.*
import org.slf4j.event.Level
import java.math.BigDecimal

// =====================================================
// MODELOS DE API (Serializables)
// =====================================================

@kotlinx.serialization.Serializable
data class PriceCalculationRequest(
    val productId: Int,
    val quantity: Int,
    val widthCm: String? = null,
    val heightCm: String? = null,
    val options: Map<String, String> = emptyMap()
)

@kotlinx.serialization.Serializable
data class PriceCalculationResponse(
    val productId: Int,
    val productName: String,
    val quantity: Int,
    val unitPrice: String,
    val totalPrice: String,
    val breakdown: CostBreakdownDto
)

@kotlinx.serialization.Serializable
data class CostBreakdownDto(
    val baseCost: String,
    val additionalCosts: Map<String, String>,
    val subtotal: String,
    val discount: String,
    val finalCost: String,
    val margin: String,
    val sellingPrice: String,
    val details: String?
)

@kotlinx.serialization.Serializable
data class ProductDto(
    val id: Int,
    val sku: String,
    val name: String,
    val description: String?,
    val calculationMode: String,
    val minQuantity: Int,
    val maxQuantity: Int?
)

@kotlinx.serialization.Serializable
data class ErrorResponse(
    val error: String,
    val message: String,
    val timestamp: Long = System.currentTimeMillis()
)

fun Application.module() {
    install(ContentNegotiation) {
        json()
    }
    install(CORS) {
        anyHost()
        allowHeader(HttpHeaders.ContentType)
        allowHeader(HttpHeaders.Authorization)
        allowMethod(HttpMethod.Options)
        allowMethod(HttpMethod.Get)
        allowMethod(HttpMethod.Post)
        allowMethod(HttpMethod.Put)
        allowMethod(HttpMethod.Delete)
    }
    // CallLogging plugin removed for compatibility with current dependency set.
    // If you want request logging enable the plugin and adjust imports to the Ktor version used.
    install(StatusPages) {
        exception<IllegalArgumentException> { call, cause ->
            call.respond(HttpStatusCode.BadRequest, ErrorResponse("VALIDATION_ERROR", cause.message ?: "Invalid request"))
        }
        exception<Throwable> { call, cause ->
            call.application.environment.log.error("Unhandled exception", cause)
            call.respond(HttpStatusCode.InternalServerError, ErrorResponse("INTERNAL_ERROR", "An error occurred processing your request"))
        }
    }
    configureRouting()
    // Configure JWT authentication and dev token endpoint
    generatedSecurity()
}

class NotFoundException(message: String) : Exception(message)

fun Application.configureRouting() {
    routing {
        get("/health") { call.respond(mapOf("status" to "healthy", "timestamp" to System.currentTimeMillis())) }
        route("/api/v1/pricing") {
            post("/calculate") {
                val request = call.receive<PriceCalculationRequest>()
                if (request.quantity <= 0) throw IllegalArgumentException("Quantity must be greater than 0")
                val response = calculatePrice(request)
                call.respond(response)
            }
        }
        // Admin routes protected by JWT + role checks
        route("/api/v1/admin") {
            authenticate("jwt") {
                get("/whoami") {
                    val principal = call.principal<JWTPrincipal>()
                    val username = principal?.payload?.subject ?: "anonymous"
                    val roles = call.roles()
                    call.respond(mapOf("user" to username, "roles" to roles))
                }

                get("/secure") {
                    // require ADMIN role to access
                    try {
                        call.requireRole(Role.ADMIN)
                    } catch (ex: Exception) {
                        return@get
                    }
                    call.respond(mapOf("status" to "ok", "message" to "admin access granted"))
                }
            }
        }
    }
}

private fun calculatePrice(request: PriceCalculationRequest): PriceCalculationResponse {
    val basePrice = when (request.productId) {
        1 -> {
            val width = request.widthCm?.toBigDecimal() ?: BigDecimal("100")
            val height = request.heightCm?.toBigDecimal() ?: BigDecimal("100")
            val area = width.multiply(height).divide(BigDecimal("10000"))
            area.multiply(BigDecimal("12.50"))
        }
        2 -> {
            val setupCost = BigDecimal("5.00")
            val costPerUnit = BigDecimal("0.08")
            setupCost.divide(BigDecimal(request.quantity), 4, java.math.RoundingMode.HALF_UP).add(costPerUnit)
        }
        3 -> BigDecimal("49.00")
        else -> BigDecimal("10.00")
    }
    val margin = basePrice.multiply(BigDecimal("0.30"))
    val sellingPrice = basePrice.add(margin)
    val totalPrice = sellingPrice.multiply(BigDecimal(request.quantity))
    return PriceCalculationResponse(
        productId = request.productId,
        productName = "Product ${request.productId}",
        quantity = request.quantity,
        unitPrice = sellingPrice.setScale(2, java.math.RoundingMode.HALF_UP).toString(),
        totalPrice = totalPrice.setScale(2, java.math.RoundingMode.HALF_UP).toString(),
        breakdown = CostBreakdownDto(
            baseCost = basePrice.toString(),
            additionalCosts = emptyMap(),
            subtotal = basePrice.toString(),
            discount = "0.00",
            finalCost = basePrice.toString(),
            margin = margin.toString(),
            sellingPrice = sellingPrice.toString(),
            details = "Calculation for product ${request.productId}"
        )
    )
}

fun main() {
    val portEnv = System.getenv("PORT")
    val port = portEnv?.toIntOrNull() ?: 8080
    embeddedServer(Netty, port = port, host = "0.0.0.0") {
        module()
    }.start(wait = true)
}

