package com.imprenta.pricing

import java.math.BigDecimal
import java.math.RoundingMode
import kotlin.math.ceil
import kotlin.math.floor
import kotlin.math.max

// ...existing code...

enum class CalculationMode {
    AREA,   // Gran formato: precio por metro cuadrado
    SHEET,  // Pequeño formato: precio por pliego con costes fijos
    UNIT    // Productos unitarios: precio fijo por unidad
}

enum class MaterialType {
    VINYL, CANVAS, DIBOND, PVC, FOREX, METHACRYLATE, PAPER, CARDSTOCK
}

// ...existing code...

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

// MODELOS DE SOLICITUD/RESPUESTA

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

class PricingEngine(
    private val defaultMarginPercentage: BigDecimal = BigDecimal("30.0")
) {
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

    private fun calculateAreaPrice(config: AreaConfig, request: PriceRequest): CostBreakdown {
        val widthM = request.widthCm!!.divide(BigDecimal(100), 4, RoundingMode.HALF_UP)
        val heightM = request.heightCm!!.divide(BigDecimal(100), 4, RoundingMode.HALF_UP)
        if (request.widthCm < config.minWidthCm || request.widthCm > config.maxWidthCm ||
            request.heightCm < config.minHeightCm || request.heightCm > config.maxHeightCm) {
            throw IllegalArgumentException("Dimensiones fuera del rango permitido")
        }
        val area = widthM.multiply(heightM)
        val areaWithWaste = area.multiply(config.wasteFactor)
        val materialCost = areaWithWaste.multiply(config.pricePerSqm)
        val additionalCosts = mutableMapOf<String, BigDecimal>()
        if (config.inkCostPerSqm > BigDecimal.ZERO) {
            val inkCost = areaWithWaste.multiply(config.inkCostPerSqm)
            additionalCosts["Tinta"] = inkCost
        }
        if (config.laminateCostPerSqm > BigDecimal.ZERO) {
            val laminateCost = areaWithWaste.multiply(config.laminateCostPerSqm)
            additionalCosts["Laminado"] = laminateCost
        }
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

    private fun calculateSheetPrice(config: SheetConfig, request: PriceRequest): CostBreakdown {
        val quantity = request.quantity
        val sheetsNeeded = ceil(quantity.toDouble() / config.unitsPerSheet).toInt()
        val totalSheets = sheetsNeeded + config.wasteSheets
        val setupCost = config.setupCost
        val materialCost = config.sheetMaterialCost.multiply(BigDecimal(totalSheets))
        val clickCost = config.clickCost.multiply(BigDecimal(totalSheets))
        val cuttingCost = config.cuttingCostPerSheet.multiply(BigDecimal(totalSheets))
        val laminatingCost = config.laminatingCostPerSheet.multiply(BigDecimal(totalSheets))
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
        val costPerUnit = totalCost.divide(BigDecimal(quantity), 4, RoundingMode.HALF_UP)
        // Keep margin precision higher before final rounding to avoid per-unit rounding bias
        val margin = costPerUnit.multiply(defaultMarginPercentage).divide(BigDecimal(100), 6, RoundingMode.HALF_UP)
        val sellingPricePerUnit = costPerUnit.add(margin).setScale(4, RoundingMode.HALF_UP)
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

    private fun calculateUnitPrice(config: UnitConfig, request: PriceRequest): CostBreakdown {
        val quantity = request.quantity
        var unitCost = config.unitCost
        var discountApplied = BigDecimal.ZERO
        var discountDescription: String? = null
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

object SheetCalculator {
    fun calculateUnitsPerSheet(
        productWidthMm: BigDecimal,
        productHeightMm: BigDecimal,
        bleedMm: BigDecimal,
        sheetWidthMm: BigDecimal,
        sheetHeightMm: BigDecimal
    ): Int {
        val totalWidthMm = productWidthMm.add(bleedMm.multiply(BigDecimal(2)))
        val totalHeightMm = productHeightMm.add(bleedMm.multiply(BigDecimal(2)))
        val horizontalNormal = floor(sheetWidthMm.divide(totalWidthMm, 0, RoundingMode.DOWN).toDouble()).toInt()
        val verticalNormal = floor(sheetHeightMm.divide(totalHeightMm, 0, RoundingMode.DOWN).toDouble()).toInt()
        val unitsNormal = horizontalNormal * verticalNormal
        val horizontalRotated = floor(sheetWidthMm.divide(totalHeightMm, 0, RoundingMode.DOWN).toDouble()).toInt()
        val verticalRotated = floor(sheetHeightMm.divide(totalWidthMm, 0, RoundingMode.DOWN).toDouble()).toInt()
        val unitsRotated = horizontalRotated * verticalRotated
        return max(unitsNormal, unitsRotated)
    }
}

