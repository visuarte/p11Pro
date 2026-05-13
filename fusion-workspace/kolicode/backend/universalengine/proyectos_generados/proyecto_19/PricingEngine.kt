package com.imprenta.pricing

import java.math.BigDecimal
import java.math.RoundingMode
import kotlin.math.ceil
import kotlin.math.floor
import kotlin.math.max

/**
 * Motor de Pricing para ERP de Imprenta
 * 
 * Soporta tres estrategias de cálculo:
 * - AREA: Gran formato (lonas, vinilos, rígidos)
 * - SHEET: Pequeño formato (tarjetas, flyers, folletos)
 * - UNIT: Productos unitarios (merchandising, roll-ups)
 */

// =====================================================
// ENUMS Y DATA CLASSES
// =====================================================

enum class CalculationMode {
    AREA,   // Gran formato: precio por metro cuadrado
    SHEET,  // Pequeño formato: precio por pliego con costes fijos
    UNIT    // Productos unitarios: precio fijo por unidad
}

enum class MaterialType {
    VINYL, CANVAS, DIBOND, PVC, FOREX, METHACRYLATE, PAPER, CARDSTOCK
}

// =====================================================
// MODELOS DE DATOS
// =====================================================

data class Product(
    val id: Int,
    val sku: String,
    val name: String,
    val calculationMode: CalculationMode,
    val areaConfig: AreaConfig? = null,
    val sheetConfig: SheetConfig? = null,
    val unitConfig: UnitConfig? = null
)

data class AreaConfig(
    val materialType: MaterialType,
    val pricePerSqm: BigDecimal,
    val wasteFactor: BigDecimal = BigDecimal("1.05"), // 5% desperdicio por defecto
    
    // Dimensiones permitidas
    val minWidthCm: BigDecimal,
    val maxWidthCm: BigDecimal,
    val minHeightCm: BigDecimal,
    val maxHeightCm: BigDecimal,
    
    // Costes adicionales por área
    val inkCostPerSqm: BigDecimal = BigDecimal.ZERO,
    val laminateCostPerSqm: BigDecimal = BigDecimal.ZERO,
    
    // Costes adicionales por perímetro
    val hasHemming: Boolean = false,
    val hemmingCostPerMeter: BigDecimal = BigDecimal.ZERO,
    val hasEyelets: Boolean = false,
    val eyeletSpacingCm: Int? = null,
    val costPerEyelet: BigDecimal = BigDecimal.ZERO,
    val straightCutCostPerMeter: BigDecimal = BigDecimal.ZERO
)

data class SheetConfig(
    val productWidthMm: BigDecimal,
    val productHeightMm: BigDecimal,
    val bleedMm: BigDecimal = BigDecimal("3.0"),
    
    val sheetWidthMm: BigDecimal,
    val sheetHeightMm: BigDecimal,
    val unitsPerSheet: Int,
    
    val setupCost: BigDecimal,
    val sheetMaterialCost: BigDecimal,
    val clickCost: BigDecimal = BigDecimal.ZERO,
    val wasteSheets: Int = 5,
    
    val cuttingCostPerSheet: BigDecimal = BigDecimal.ZERO,
    val laminatingCostPerSheet: BigDecimal = BigDecimal.ZERO,
    val foldingCostPerUnit: BigDecimal = BigDecimal.ZERO
)

data class UnitConfig(
    val unitCost: BigDecimal,
    val markupPercentage: BigDecimal = BigDecimal("30.0"),
    val volumeDiscounts: List<VolumeDiscount> = emptyList()
)

data class VolumeDiscount(
    val minQuantity: Int,
    val maxQuantity: Int? = null,
    val discountPercentage: BigDecimal = BigDecimal.ZERO,
    val fixedPriceOverride: BigDecimal? = null
)

// =====================================================
// MODELOS DE SOLICITUD/RESPUESTA
// =====================================================

data class PriceRequest(
    val productId: Int,
    val quantity: Int,
    
    // Para productos AREA
    val widthCm: BigDecimal? = null,
    val heightCm: BigDecimal? = null,
    
    // Opciones adicionales
    val options: Map<String, Any> = emptyMap()
)

data class PriceResponse(
    val productId: Int,
    val productName: String,
    val quantity: Int,
    val unitPrice: BigDecimal,
    val totalPrice: BigDecimal,
    val breakdown: CostBreakdown
)

data class CostBreakdown(
    val baseCost: BigDecimal,
    val additionalCosts: Map<String, BigDecimal> = emptyMap(),
    val subtotal: BigDecimal,
    val discount: BigDecimal = BigDecimal.ZERO,
    val finalCost: BigDecimal,
    val margin: BigDecimal,
    val sellingPrice: BigDecimal,
    val details: String? = null
)

// =====================================================
// MOTOR DE PRICING
// =====================================================

class PricingEngine(
    private val defaultMarginPercentage: BigDecimal = BigDecimal("30.0")
) {
    
    /**
     * Punto de entrada principal del motor de pricing
     */
    fun calculatePrice(product: Product, request: PriceRequest): PriceResponse {
        val breakdown = when (product.calculationMode) {
            CalculationMode.AREA -> calculateAreaPrice(product.areaConfig!!, request)
            CalculationMode.SHEET -> calculateSheetPrice(product.sheetConfig!!, request)
            CalculationMode.UNIT -> calculateUnitPrice(product.unitConfig!!, request)
        }
        
        val totalPrice = breakdown.sellingPrice.multiply(BigDecimal(request.quantity))
        
        return PriceResponse(
            productId = product.id,
            productName = product.name,
            quantity = request.quantity,
            unitPrice = breakdown.sellingPrice,
            totalPrice = totalPrice,
            breakdown = breakdown
        )
    }
    
    // =====================================================
    // CÁLCULO POR ÁREA (GRAN FORMATO)
    // =====================================================
    
    private fun calculateAreaPrice(config: AreaConfig, request: PriceRequest): CostBreakdown {
        val widthM = request.widthCm!!.divide(BigDecimal(100), 4, RoundingMode.HALF_UP)
        val heightM = request.heightCm!!.divide(BigDecimal(100), 4, RoundingMode.HALF_UP)
        
        // Validar dimensiones
        if (request.widthCm < config.minWidthCm || request.widthCm > config.maxWidthCm ||
            request.heightCm < config.minHeightCm || request.heightCm > config.maxHeightCm) {
            throw IllegalArgumentException("Dimensiones fuera del rango permitido")
        }
        
        val area = widthM.multiply(heightM)
        val areaWithWaste = area.multiply(config.wasteFactor)
        
        // Coste base del material
        val materialCost = areaWithWaste.multiply(config.pricePerSqm)
        
        // Costes adicionales por área
        val additionalCosts = mutableMapOf<String, BigDecimal>()
        
        if (config.inkCostPerSqm > BigDecimal.ZERO) {
            val inkCost = areaWithWaste.multiply(config.inkCostPerSqm)
            additionalCosts["Tinta"] = inkCost
        }
        
        if (config.laminateCostPerSqm > BigDecimal.ZERO) {
            val laminateCost = areaWithWaste.multiply(config.laminateCostPerSqm)
            additionalCosts["Laminado"] = laminateCost
        }
        
        // Costes adicionales por perímetro
        val perimeterM = (widthM.add(heightM)).multiply(BigDecimal(2))
        
        if (config.hasHemming && config.hemmingCostPerMeter > BigDecimal.ZERO) {
            val hemmingCost = perimeterM.multiply(config.hemmingCostPerMeter)
            additionalCosts["Dobladillo"] = hemmingCost
        }
        
        if (config.hasEyelets && config.eyeletSpacingCm != null && config.costPerEyelet > BigDecimal.ZERO) {
            val perimeterCm = perimeterM.multiply(BigDecimal(100))
            val numEyelets = ceil(perimeterCm.toDouble() / config.eyeletSpacingCm).toInt()
            val eyeletsCost = BigDecimal(numEyelets).multiply(config.costPerEyelet)
            additionalCosts["Ojales ($numEyelets uds)"] = eyeletsCost
        }
        
        if (config.straightCutCostPerMeter > BigDecimal.ZERO) {
            val cutCost = perimeterM.multiply(config.straightCutCostPerMeter)
            additionalCosts["Corte"] = cutCost
        }
        
        val totalAdditionalCosts = additionalCosts.values.fold(BigDecimal.ZERO, BigDecimal::add)
        val totalCost = materialCost.add(totalAdditionalCosts)
        
        val margin = totalCost.multiply(defaultMarginPercentage).divide(BigDecimal(100), 2, RoundingMode.HALF_UP)
        val sellingPrice = totalCost.add(margin)
        
        val details = "Área: ${area.setScale(2, RoundingMode.HALF_UP)} m² " +
                     "(${request.widthCm}cm x ${request.heightCm}cm) | " +
                     "Desperdicio: ${config.wasteFactor.multiply(BigDecimal(100)).setScale(0)}% | " +
                     "Material: ${config.materialType}"
        
        return CostBreakdown(
            baseCost = materialCost,
            additionalCosts = additionalCosts,
            subtotal = totalCost,
            discount = BigDecimal.ZERO,
            finalCost = totalCost,
            margin = margin,
            sellingPrice = sellingPrice,
            details = details
        )
    }
    
    // =====================================================
    // CÁLCULO POR PLIEGO (PEQUEÑO FORMATO)
    // =====================================================
    
    private fun calculateSheetPrice(config: SheetConfig, request: PriceRequest): CostBreakdown {
        val quantity = request.quantity
        
        // 1. Calcular pliegos necesarios
        val sheetsNeeded = ceil(quantity.toDouble() / config.unitsPerSheet).toInt()
        
        // 2. Añadir pliegos de merma
        val totalSheets = sheetsNeeded + config.wasteSheets
        
        // 3. Coste fijo de arranque (solo se cobra UNA vez)
        val setupCost = config.setupCost
        
        // 4. Costes variables por pliego
        val materialCost = config.sheetMaterialCost.multiply(BigDecimal(totalSheets))
        val clickCost = config.clickCost.multiply(BigDecimal(totalSheets))
        val cuttingCost = config.cuttingCostPerSheet.multiply(BigDecimal(totalSheets))
        val laminatingCost = config.laminatingCostPerSheet.multiply(BigDecimal(totalSheets))
        
        // 5. Costes por unidad
        val foldingCost = config.foldingCostPerUnit.multiply(BigDecimal(quantity))
        
        val additionalCosts = mutableMapOf<String, BigDecimal>()
        additionalCosts["Arranque/Setup"] = setupCost
        additionalCosts["Material ($totalSheets pliegos)"] = materialCost
        
        if (clickCost > BigDecimal.ZERO) {
            additionalCosts["Impresión (clicks)"] = clickCost
        }
        if (cuttingCost > BigDecimal.ZERO) {
            additionalCosts["Corte"] = cuttingCost
        }
        if (laminatingCost > BigDecimal.ZERO) {
            additionalCosts["Plastificado"] = laminatingCost
        }
        if (foldingCost > BigDecimal.ZERO) {
            additionalCosts["Plegado"] = foldingCost
        }
        
        val totalCost = setupCost.add(materialCost).add(clickCost)
            .add(cuttingCost).add(laminatingCost).add(foldingCost)
        
        // El coste por unidad
        val costPerUnit = totalCost.divide(BigDecimal(quantity), 4, RoundingMode.HALF_UP)
        
        val margin = costPerUnit.multiply(defaultMarginPercentage).divide(BigDecimal(100), 2, RoundingMode.HALF_UP)
        val sellingPricePerUnit = costPerUnit.add(margin)
        
        val details = "Cantidad: $quantity uds | " +
                     "Cabidas: ${config.unitsPerSheet}/pliego | " +
                     "Pliegos totales: $totalSheets ($sheetsNeeded + ${config.wasteSheets} merma)"
        
        return CostBreakdown(
            baseCost = totalCost,
            additionalCosts = additionalCosts,
            subtotal = totalCost,
            discount = BigDecimal.ZERO,
            finalCost = totalCost,
            margin = margin.multiply(BigDecimal(quantity)),
            sellingPrice = sellingPricePerUnit,
            details = details
        )
    }
    
    // =====================================================
    // CÁLCULO UNITARIO (MERCHANDISING)
    // =====================================================
    
    private fun calculateUnitPrice(config: UnitConfig, request: PriceRequest): CostBreakdown {
        val quantity = request.quantity
        var unitCost = config.unitCost
        var discountApplied = BigDecimal.ZERO
        var discountDescription: String? = null
        
        // Aplicar descuento por volumen si existe
        if (config.volumeDiscounts.isNotEmpty()) {
            val applicableDiscount = config.volumeDiscounts
                .filter { quantity >= it.minQuantity }
                .filter { it.maxQuantity == null || quantity <= it.maxQuantity }
                .maxByOrNull { it.minQuantity }
            
            applicableDiscount?.let { discount ->
                if (discount.fixedPriceOverride != null) {
                    unitCost = discount.fixedPriceOverride
                    discountDescription = "Precio especial por volumen"
                } else if (discount.discountPercentage > BigDecimal.ZERO) {
                    discountApplied = unitCost.multiply(discount.discountPercentage)
                        .divide(BigDecimal(100), 2, RoundingMode.HALF_UP)
                    unitCost = unitCost.subtract(discountApplied)
                    discountDescription = "${discount.discountPercentage}% descuento por volumen"
                }
            }
        }
        
        val totalCost = unitCost.multiply(BigDecimal(quantity))
        val margin = unitCost.multiply(config.markupPercentage).divide(BigDecimal(100), 2, RoundingMode.HALF_UP)
        val sellingPrice = unitCost.add(margin)
        
        val details = "Precio unitario: ${unitCost.setScale(2, RoundingMode.HALF_UP)}€" +
                     (discountDescription?.let { " | $it" } ?: "")
        
        return CostBreakdown(
            baseCost = config.unitCost,
            additionalCosts = emptyMap(),
            subtotal = totalCost,
            discount = discountApplied.multiply(BigDecimal(quantity)),
            finalCost = totalCost,
            margin = margin.multiply(BigDecimal(quantity)),
            sellingPrice = sellingPrice,
            details = details
        )
    }
}

// =====================================================
// UTILIDADES
// =====================================================

object SheetCalculator {
    /**
     * Calcula cuántas unidades caben en un pliego
     * considerando rotación para maximizar aprovechamiento
     */
    fun calculateUnitsPerSheet(
        productWidthMm: BigDecimal,
        productHeightMm: BigDecimal,
        bleedMm: BigDecimal,
        sheetWidthMm: BigDecimal,
        sheetHeightMm: BigDecimal
    ): Int {
        val totalWidthMm = productWidthMm.add(bleedMm.multiply(BigDecimal(2)))
        val totalHeightMm = productHeightMm.add(bleedMm.multiply(BigDecimal(2)))
        
        // Sin rotación
        val horizontalNormal = floor(sheetWidthMm.divide(totalWidthMm, 0, RoundingMode.DOWN).toDouble()).toInt()
        val verticalNormal = floor(sheetHeightMm.divide(totalHeightMm, 0, RoundingMode.DOWN).toDouble()).toInt()
        val unitsNormal = horizontalNormal * verticalNormal
        
        // Con rotación
        val horizontalRotated = floor(sheetWidthMm.divide(totalHeightMm, 0, RoundingMode.DOWN).toDouble()).toInt()
        val verticalRotated = floor(sheetHeightMm.divide(totalWidthMm, 0, RoundingMode.DOWN).toDouble()).toInt()
        val unitsRotated = horizontalRotated * verticalRotated
        
        return max(unitsNormal, unitsRotated)
    }
}

// =====================================================
// EJEMPLO DE USO
// =====================================================

fun main() {
    val engine = PricingEngine(defaultMarginPercentage = BigDecimal("30.0"))
    
    // Ejemplo 1: Lona con ojales (AREA)
    println("=== EJEMPLO 1: LONA CON OJALES (Gran Formato) ===")
    val lonaConfig = AreaConfig(
        materialType = MaterialType.CANVAS,
        pricePerSqm = BigDecimal("8.50"),
        wasteFactor = BigDecimal("1.05"),
        minWidthCm = BigDecimal("50"),
        maxWidthCm = BigDecimal("1000"),
        minHeightCm = BigDecimal("50"),
        maxHeightCm = BigDecimal("1000"),
        inkCostPerSqm = BigDecimal("2.00"),
        hasHemming = true,
        hemmingCostPerMeter = BigDecimal("0.80"),
        hasEyelets = true,
        eyeletSpacingCm = 50,
        costPerEyelet = BigDecimal("0.15")
    )
    
    val lonaProduct = Product(
        id = 1,
        sku = "LONA-OJALES",
        name = "Lona con Ojales",
        calculationMode = CalculationMode.AREA,
        areaConfig = lonaConfig
    )
    
    val lonaRequest = PriceRequest(
        productId = 1,
        quantity = 1,
        widthCm = BigDecimal("300"),
        heightCm = BigDecimal("200")
    )
    
    val lonaPrice = engine.calculatePrice(lonaProduct, lonaRequest)
    printPriceResponse(lonaPrice)
    
    // Ejemplo 2: Tarjetas de visita (SHEET)
    println("\n=== EJEMPLO 2: TARJETAS DE VISITA (Pequeño Formato) ===")
    val tarjetaConfig = SheetConfig(
        productWidthMm = BigDecimal("85"),
        productHeightMm = BigDecimal("55"),
        bleedMm = BigDecimal("3"),
        sheetWidthMm = BigDecimal("320"),
        sheetHeightMm = BigDecimal("450"),
        unitsPerSheet = 21,
        setupCost = BigDecimal("5.00"),
        sheetMaterialCost = BigDecimal("0.10"),
        clickCost = BigDecimal("0.05"),
        wasteSheets = 5
    )
    
    val tarjetaProduct = Product(
        id = 2,
        sku = "TARJETA-85X55",
        name = "Tarjeta de Visita 85x55mm",
        calculationMode = CalculationMode.SHEET,
        sheetConfig = tarjetaConfig
    )
    
    println("\n--- 100 tarjetas ---")
    val tarjeta100 = engine.calculatePrice(tarjetaProduct, PriceRequest(2, 100))
    printPriceResponse(tarjeta100)
    
    println("\n--- 1000 tarjetas ---")
    val tarjeta1000 = engine.calculatePrice(tarjetaProduct, PriceRequest(2, 1000))
    printPriceResponse(tarjeta1000)
    
    // Ejemplo 3: Roll-up (UNIT)
    println("\n=== EJEMPLO 3: ROLL-UP (Producto Unitario) ===")
    val rollupConfig = UnitConfig(
        unitCost = BigDecimal("35.00"),
        markupPercentage = BigDecimal("40.0"),
        volumeDiscounts = listOf(
            VolumeDiscount(1, 4, BigDecimal.ZERO),
            VolumeDiscount(5, 9, BigDecimal("5.0")),
            VolumeDiscount(10, null, BigDecimal("10.0"))
        )
    )
    
    val rollupProduct = Product(
        id = 3,
        sku = "ROLLUP-85X200",
        name = "Roll-up 85x200cm",
        calculationMode = CalculationMode.UNIT,
        unitConfig = rollupConfig
    )
    
    println("\n--- 1 roll-up ---")
    val rollup1 = engine.calculatePrice(rollupProduct, PriceRequest(3, 1))
    printPriceResponse(rollup1)
    
    println("\n--- 10 roll-ups ---")
    val rollup10 = engine.calculatePrice(rollupProduct, PriceRequest(3, 10))
    printPriceResponse(rollup10)
}

fun printPriceResponse(response: PriceResponse) {
    println("Producto: ${response.productName}")
    println("Cantidad: ${response.quantity}")
    println("Precio unitario: ${response.unitPrice.setScale(2, RoundingMode.HALF_UP)}€")
    println("Precio total: ${response.totalPrice.setScale(2, RoundingMode.HALF_UP)}€")
    println("\nDesglose:")
    println("  - Coste base: ${response.breakdown.baseCost.setScale(2, RoundingMode.HALF_UP)}€")
    response.breakdown.additionalCosts.forEach { (key, value) ->
        println("  - $key: ${value.setScale(2, RoundingMode.HALF_UP)}€")
    }
    println("  - Margen: ${response.breakdown.margin.setScale(2, RoundingMode.HALF_UP)}€")
    println("\nDetalles: ${response.breakdown.details}")
}
