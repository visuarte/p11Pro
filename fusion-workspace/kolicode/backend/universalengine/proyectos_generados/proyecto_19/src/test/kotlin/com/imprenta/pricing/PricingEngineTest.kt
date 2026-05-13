package com.imprenta.pricing

import org.junit.jupiter.api.Test
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested
import java.math.BigDecimal
import java.math.RoundingMode

class PricingEngineTest {
    private val engine = PricingEngine(defaultMarginPercentage = BigDecimal("30.0"))

    @Test
    fun testBasicCanvas() {
        val config = AreaConfig(
            materialType = MaterialType.CANVAS,
            pricePerSqm = BigDecimal("8.50"),
            wasteFactor = BigDecimal("1.05"),
            minWidthCm = BigDecimal("50"),
            maxWidthCm = BigDecimal("1000"),
            minHeightCm = BigDecimal("50"),
            maxHeightCm = BigDecimal("1000")
        )
        val product = Product(1, "LONA-BASIC", "Lona Básica", CalculationMode.AREA, areaConfig = config)
        val request = PriceRequest(1, 1, widthCm = BigDecimal("300"), heightCm = BigDecimal("200"))
        val response = engine.calculatePrice(product, request)
        assertEquals(BigDecimal("69.62"), response.unitPrice.setScale(2, RoundingMode.HALF_UP))
    }

    @Test
    fun testBusinessCards100() {
        val config = SheetConfig(
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
        val product = Product(5, "TARJETA-85X55", "Tarjeta", CalculationMode.SHEET, sheetConfig = config)
        val response = engine.calculatePrice(product, PriceRequest(5, 100))
        val expectedUnitPrice = BigDecimal("0.08")
        assertEquals(expectedUnitPrice, response.unitPrice.setScale(2, RoundingMode.HALF_UP))
    }

    @Test
    fun testRollupBasicPrice() {
        val config = UnitConfig(unitCost = BigDecimal("35.00"), markupPercentage = BigDecimal("40.0"))
        val product = Product(6, "ROLLUP-85X200", "Roll-up", CalculationMode.UNIT, unitConfig = config)
        val response = engine.calculatePrice(product, PriceRequest(6, 1))
        assertEquals(BigDecimal("49.00"), response.unitPrice.setScale(2, RoundingMode.HALF_UP))
    }
}

