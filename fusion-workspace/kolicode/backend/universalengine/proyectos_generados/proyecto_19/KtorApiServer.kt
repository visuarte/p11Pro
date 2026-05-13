package com.generated.backup

import io.ktor.server.application.*
import io.ktor.server.engine.*
import io.ktor.server.netty.*
import io.ktor.server.response.*
import io.ktor.server.request.*
import io.ktor.server.routing.*
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.server.plugins.cors.routing.*
import io.ktor.server.plugins.callloging.*
import io.ktor.server.plugins.statuspages.*
import kotlinx.serialization.*
import kotlinx.serialization.json.*
import org.slf4j.event.Level
import java.math.BigDecimal
import com.imprenta.security.roles

// =====================================================
// MODELOS DE API (Serializables)
// =====================================================

@Serializable
data class PriceCalculationRequest(
    val productId: Int,
    val quantity: Int,
    val widthCm: String? = null,  // BigDecimal como String para serialización
    val heightCm: String? = null,
    val options: Map<String, String> = emptyMap()
)

@Serializable
data class PriceCalculationResponse(
    val productId: Int,
    val productName: String,
    val quantity: Int,
    val unitPrice: String,  // BigDecimal como String
    val totalPrice: String,
    val breakdown: CostBreakdownDto
)

@Serializable
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

@Serializable
data class ProductDto(
    val id: Int,
    val sku: String,
    val name: String,
    val description: String?,
    val calculationMode: String,
    val minQuantity: Int,
    val maxQuantity: Int?
)

@Serializable
data class ErrorResponse(
    val error: String,
    val message: String,
    val timestamp: Long = System.currentTimeMillis()
)

// =====================================================
// CONFIGURACIÓN DE KTOR
// =====================================================

fun Application.module() {
    install(ContentNegotiation) {
        json(Json {
            prettyPrint = true
            isLenient = true
            ignoreUnknownKeys = true
        })
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
    
    install(CallLogging) {
        level = Level.INFO
        filter { call -> call.request.path().startsWith("/") }
    }
    
    install(StatusPages) {
        exception<IllegalArgumentException> { call, cause ->
            call.respond(
                HttpStatusCode.BadRequest,
                ErrorResponse("VALIDATION_ERROR", cause.message ?: "Invalid request")
            )
        }
        exception<NotFoundException> { call, cause ->
            call.respond(
                HttpStatusCode.NotFound,
                ErrorResponse("NOT_FOUND", cause.message ?: "Resource not found")
            )
        }
        exception<Throwable> { call, cause ->
            call.application.environment.log.error("Unhandled exception", cause)
            call.respond(
                HttpStatusCode.InternalServerError,
                ErrorResponse("INTERNAL_ERROR", "An error occurred processing your request")
            )
        }
    }
    
    configureRouting()
}

class NotFoundException(message: String) : Exception(message)

// =====================================================
// RUTAS DE LA API
// =====================================================

fun Application.configureRouting() {
    routing {
        
        // Health check
        get("/health") {
            call.respond(mapOf("status" to "healthy", "timestamp" to System.currentTimeMillis()))
        }
        
        // Rutas de productos
        route("/api/v1/products") {
            
            // GET /api/v1/products - Listar productos
            get {
                val calculationMode = call.request.queryParameters["calculationMode"]
                val category = call.request.queryParameters["category"]
                
                // TODO: Implementar lógica de repositorio
                val products = getProducts(calculationMode, category)
                call.respond(products)
            }
            
            // GET /api/v1/products/{id} - Obtener producto por ID
            get("/{id}") {
                val id = call.parameters["id"]?.toIntOrNull()
                    ?: throw IllegalArgumentException("Invalid product ID")
                
                val product = getProductById(id)
                    ?: throw NotFoundException("Product not found: $id")
                
                call.respond(product)
            }
            
            // GET /api/v1/products/{id}/configuration - Obtener configuración de pricing
            get("/{id}/configuration") {
                val id = call.parameters["id"]?.toIntOrNull()
                    ?: throw IllegalArgumentException("Invalid product ID")
                
                val config = getProductConfiguration(id)
                    ?: throw NotFoundException("Product configuration not found: $id")
                
                call.respond(config)
            }
        }
        
        // Rutas de pricing
        route("/api/v1/pricing") {
            
            // POST /api/v1/pricing/calculate - Calcular precio
            post("/calculate") {
                val request = call.receive<PriceCalculationRequest>()
                
                // Validaciones
                if (request.quantity <= 0) {
                    throw IllegalArgumentException("Quantity must be greater than 0")
                }
                
                val response = calculatePrice(request)
                call.respond(response)
            }
            
            // POST /api/v1/pricing/batch - Calcular precios en lote
            post("/batch") {
                val requests = call.receive<List<PriceCalculationRequest>>()
                
                if (requests.isEmpty()) {
                    throw IllegalArgumentException("Batch cannot be empty")
                }
                
                if (requests.size > 100) {
                    throw IllegalArgumentException("Batch size cannot exceed 100 items")
                }
                
                val responses = requests.map { calculatePrice(it) }
                call.respond(responses)
            }
            
            // POST /api/v1/pricing/simulate - Simular escalado de precio
            post("/simulate") {
                val productId = call.receive<Map<String, Any>>()["productId"] as? Int
                    ?: throw IllegalArgumentException("Product ID is required")
                
                val quantities = listOf(1, 10, 25, 50, 100, 250, 500, 1000)
                val simulations = quantities.map { qty ->
                    calculatePrice(PriceCalculationRequest(
                        productId = productId,
                        quantity = qty
                    ))
                }
                
                call.respond(mapOf(
                    "productId" to productId,
                    "simulations" to simulations
                ))
            }
        }
        
        // Rutas de presupuestos
        route("/api/v1/quotes") {
            
            // POST /api/v1/quotes - Crear presupuesto
            post {
                val quoteRequest = call.receive<CreateQuoteRequest>()
                val quote = createQuote(quoteRequest)
                call.respond(HttpStatusCode.Created, quote)
            }
            
            // GET /api/v1/quotes/{id} - Obtener presupuesto
            get("/{id}") {
                val id = call.parameters["id"]?.toIntOrNull()
                    ?: throw IllegalArgumentException("Invalid quote ID")
                
                val quote = getQuoteById(id)
                    ?: throw NotFoundException("Quote not found: $id")
                
                call.respond(quote)
            }
            
            // GET /api/v1/quotes/{id}/pdf - Generar PDF del presupuesto
            get("/{id}/pdf") {
                val id = call.parameters["id"]?.toIntOrNull()
                    ?: throw IllegalArgumentException("Invalid quote ID")
                
                val pdfBytes = generateQuotePdf(id)
                
                call.response.header(
                    HttpHeaders.ContentDisposition,
                    ContentDisposition.Attachment.withParameter(
                        ContentDisposition.Parameters.FileName,
                        "presupuesto-$id.pdf"
                    ).toString()
                )
                call.respondBytes(pdfBytes, ContentType.Application.Pdf)
            }
        }
        
        // Rutas administrativas
        route("/api/v1/admin") {
            
            // POST /api/v1/admin/products - Crear producto
            post("/products") {
                // TODO: Autenticación y autorización
                val productRequest = call.receive<CreateProductRequest>()
                val product = createProduct(productRequest)
                call.respond(HttpStatusCode.Created, product)
            }
            
            // PUT /api/v1/admin/products/{id} - Actualizar producto
            put("/products/{id}") {
                val id = call.parameters["id"]?.toIntOrNull()
                    ?: throw IllegalArgumentException("Invalid product ID")
                
                val updateRequest = call.receive<UpdateProductRequest>()
                val updated = updateProduct(id, updateRequest)
                call.respond(updated)
            }
            
            // DELETE /api/v1/admin/products/{id} - Eliminar producto
            delete("/products/{id}") {
                val id = call.parameters["id"]?.toIntOrNull()
                    ?: throw IllegalArgumentException("Invalid product ID")
                
                deleteProduct(id)
                call.respond(HttpStatusCode.NoContent)
            }
        }
    }
}

// =====================================================
// MODELOS DE PETICIÓN
// =====================================================

@Serializable
data class CreateQuoteRequest(
    val customerId: Int,
    val lines: List<QuoteLineRequest>,
    val validDays: Int = 30
)

@Serializable
data class QuoteLineRequest(
    val productId: Int,
    val quantity: Int,
    val widthCm: String? = null,
    val heightCm: String? = null,
    val options: Map<String, String> = emptyMap()
)

@Serializable
data class CreateProductRequest(
    val sku: String,
    val name: String,
    val description: String?,
    val calculationMode: String,
    val configuration: JsonElement
)

@Serializable
data class UpdateProductRequest(
    val name: String? = null,
    val description: String? = null,
    val status: String? = null,
    val configuration: JsonElement? = null
)

// =====================================================
// IMPLEMENTACIONES STUB (TODO: Conectar con BD)
// =====================================================

private fun getProducts(calculationMode: String?, category: String?): List<ProductDto> {
    // TODO: Implementar consulta a base de datos
    return listOf(
        ProductDto(1, "LONA-OJALES", "Lona con Ojales", "Lona para exterior", "AREA", 1, null),
        ProductDto(2, "TARJETA-85X55", "Tarjeta de Visita", "Tarjeta 85x55mm", "SHEET", 100, 10000),
        ProductDto(3, "ROLLUP-85X200", "Roll-up 85x200cm", "Display Roll-up", "UNIT", 1, null)
    )
}

private fun getProductById(id: Int): ProductDto? {
    // TODO: Implementar consulta a base de datos
    return getProducts(null, null).find { it.id == id }
}

private fun getProductConfiguration(id: Int): Map<String, Any> {
    // TODO: Implementar consulta a base de datos
    return mapOf(
        "productId" to id,
        "config" to "Configuration data here"
    )
}

private fun calculatePrice(request: PriceCalculationRequest): PriceCalculationResponse {
    // TODO: Integrar con PricingEngine real
    
    // Simulación simple para demostración
    val basePrice = when (request.productId) {
        1 -> { // Lona (AREA)
            val width = request.widthCm?.toBigDecimal() ?: BigDecimal("100")
            val height = request.heightCm?.toBigDecimal() ?: BigDecimal("100")
            val area = width.multiply(height).divide(BigDecimal("10000"))
            area.multiply(BigDecimal("12.50"))
        }
        2 -> { // Tarjetas (SHEET)
            val setupCost = BigDecimal("5.00")
            val costPerUnit = BigDecimal("0.08")
            setupCost.divide(BigDecimal(request.quantity), 4, java.math.RoundingMode.HALF_UP)
                .add(costPerUnit)
        }
        3 -> { // Roll-up (UNIT)
            BigDecimal("49.00")
        }
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

private fun createQuote(request: CreateQuoteRequest): Map<String, Any> {
    // TODO: Implementar lógica de presupuesto
    return mapOf(
        "id" to 1,
        "quoteNumber" to "Q-2024-001",
        "customerId" to request.customerId,
        "status" to "DRAFT",
        "createdAt" to System.currentTimeMillis()
    )
}

private fun getQuoteById(id: Int): Map<String, Any>? {
    // TODO: Implementar consulta a base de datos
    return mapOf(
        "id" to id,
        "quoteNumber" to "Q-2024-001",
        "status" to "DRAFT"
    )
}

private fun generateQuotePdf(id: Int): ByteArray {
    // TODO: Implementar generación de PDF
    return "PDF content".toByteArray()
}

private fun createProduct(request: CreateProductRequest): ProductDto {
    // TODO: Implementar creación de producto
    return ProductDto(
        id = 999,
        sku = request.sku,
        name = request.name,
        description = request.description,
        calculationMode = request.calculationMode,
        minQuantity = 1,
        maxQuantity = null
    )
}

private fun updateProduct(id: Int, request: UpdateProductRequest): ProductDto {
    // TODO: Implementar actualización de producto
    return ProductDto(
        id = id,
        sku = "UPDATED",
        name = request.name ?: "Updated Product",
        description = request.description,
        calculationMode = "AREA",
        minQuantity = 1,
        maxQuantity = null
    )
}

private fun deleteProduct(id: Int) {
    // TODO: Implementar eliminación de producto
}

// =====================================================
// MAIN
// =====================================================

// NOTE: This file was moved to package `com.generated.backup` to avoid duplicate symbols
// The real API server lives under src/main/kotlin/com/imprenta/api/KtorApiServer.kt
// main() removed here to prevent collisions during compilation.
