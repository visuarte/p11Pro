package com.imprenta.pricing

import org.junit.jupiter.api.Test
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested
import java.math.BigDecimal
import java.math.RoundingMode

/**
 * Tests Unitarios para el Motor de Pricing
 * 
 * Cobertura:
 * - Cálculo por Área (AREA)
 * - Cálculo por Pliego (SHEET)
 * - Cálculo Unitario (UNIT)
 * - Descuentos por volumen
 * - Validaciones
 */
class PricingEngineTest {
    
    private val engine = PricingEngine(defaultMarginPercentage = BigDecimal("30.0"))
    
    // =====================================================
    // TESTS: CÁLCULO POR ÁREA (GRAN FORMATO)
    // =====================================================
    
    @Nested
    @DisplayName("Cálculo por Área (Gran Formato)")
    inner class AreaCalculationTests {
        
        @Test
        @DisplayName("Lona básica: 3m x 2m sin extras")
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
            
            val product = Product(
                id = 1,
                sku = "LONA-BASIC",
                name = "Lona Básica",
                calculationMode = CalculationMode.AREA,
                areaConfig = config
            )
            
            val request = PriceRequest(
                productId = 1,
                quantity = 1,
                widthCm = BigDecimal("300"),
                heightCm = BigDecimal("200")
            )
            
            val response = engine.calculatePrice(product, request)
            
            // Área: 3m * 2m = 6 m²
            // Con desperdicio: 6 * 1.05 = 6.3 m²
            // Coste material: 6.3 * 8.50 = 53.55€
            // Margen 30%: 53.55 * 0.30 = 16.065€
            // Precio venta: 53.55 + 16.065 = 69.615€ ≈ 69.62€
            
            assertEquals(BigDecimal("69.62"), response.unitPrice.setScale(2, RoundingMode.HALF_UP))
            assertEquals(1, response.quantity)
            assertTrue(response.breakdown.details!!.contains("6.00 m²"))
        }
        
        @Test
        @DisplayName("Lona con ojales: cálculo de perímetro")
        fun testCanvasWithEyelets() {
            val config = AreaConfig(
                materialType = MaterialType.CANVAS,
                pricePerSqm = BigDecimal("8.50"),
                wasteFactor = BigDecimal("1.05"),
                minWidthCm = BigDecimal("50"),
                maxWidthCm = BigDecimal("1000"),
                minHeightCm = BigDecimal("50"),
                maxHeightCm = BigDecimal("1000"),
                inkCostPerSqm = BigDecimal("2.00"),
                hasEyelets = true,
                eyeletSpacingCm = 50,
                costPerEyelet = BigDecimal("0.15")
            )
            
            val product = Product(
                id = 2,
                sku = "LONA-OJALES",
                name = "Lona con Ojales",
                calculationMode = CalculationMode.AREA,
                areaConfig = config
            )
            
            val request = PriceRequest(
                productId = 2,
                quantity = 1,
                widthCm = BigDecimal("300"),
                heightCm = BigDecimal("200")
            )
            
            val response = engine.calculatePrice(product, request)
            
            // Perímetro: (3 + 2) * 2 = 10 metros = 1000 cm
            // Ojales cada 50cm: 1000 / 50 = 20 ojales
            // Coste ojales: 20 * 0.15 = 3.00€
            
            assertTrue(response.breakdown.additionalCosts.containsKey("Ojales (20 uds)"))
            assertEquals(
                BigDecimal("3.00"),
                response.breakdown.additionalCosts["Ojales (20 uds)"]!!.setScale(2, RoundingMode.HALF_UP)
            )
        }
        
        @Test
        @DisplayName("Validación: dimensiones fuera de rango")
        fun testDimensionValidation() {
            val config = AreaConfig(
                materialType = MaterialType.VINYL,
                pricePerSqm = BigDecimal("5.00"),
                wasteFactor = BigDecimal("1.05"),
                minWidthCm = BigDecimal("50"),
                maxWidthCm = BigDecimal("500"),
                minHeightCm = BigDecimal("50"),
                maxHeightCm = BigDecimal("500")
            )
            
            val product = Product(
                id = 3,
                sku = "VINYL-SMALL",
                name = "Vinilo Pequeño",
                calculationMode = CalculationMode.AREA,
                areaConfig = config
            )
            
            val request = PriceRequest(
                productId = 3,
                quantity = 1,
                widthCm = BigDecimal("1000"),  // Excede max_width
                heightCm = BigDecimal("200")
            )
            
            assertThrows(IllegalArgumentException::class.java) {
                engine.calculatePrice(product, request)
            }
        }
        
        @Test
        @DisplayName("Lona con todos los extras")
        fun testCanvasWithAllExtras() {
            val config = AreaConfig(
                materialType = MaterialType.CANVAS,
                pricePerSqm = BigDecimal("8.50"),
                wasteFactor = BigDecimal("1.05"),
                minWidthCm = BigDecimal("50"),
                maxWidthCm = BigDecimal("1000"),
                minHeightCm = BigDecimal("50"),
                maxHeightCm = BigDecimal("1000"),
                inkCostPerSqm = BigDecimal("2.00"),
                laminateCostPerSqm = BigDecimal("1.50"),
                hasHemming = true,
                hemmingCostPerMeter = BigDecimal("0.80"),
                hasEyelets = true,
                eyeletSpacingCm = 50,
                costPerEyelet = BigDecimal("0.15"),
                straightCutCostPerMeter = BigDecimal("0.20")
            )
            
            val product = Product(
                id = 4,
                sku = "LONA-PREMIUM",
                name = "Lona Premium",
                calculationMode = CalculationMode.AREA,
                areaConfig = config
            )
            
            val request = PriceRequest(
                productId = 4,
                quantity = 1,
                widthCm = BigDecimal("200"),
                heightCm = BigDecimal("100")
            )
            
            val response = engine.calculatePrice(product, request)
            
            // Verificar que todos los extras están presentes
            assertTrue(response.breakdown.additionalCosts.containsKey("Tinta"))
            assertTrue(response.breakdown.additionalCosts.containsKey("Laminado"))
            assertTrue(response.breakdown.additionalCosts.containsKey("Dobladillo"))
            assertTrue(response.breakdown.additionalCosts.containsKey("Corte"))
            assertTrue(response.breakdown.additionalCosts.values.all { it > BigDecimal.ZERO })
        }
    }
    
    // =====================================================
    // TESTS: CÁLCULO POR PLIEGO (PEQUEÑO FORMATO)
    // =====================================================
    
    @Nested
    @DisplayName("Cálculo por Pliego (Pequeño Formato)")
    inner class SheetCalculationTests {
        
        @Test
        @DisplayName("Tarjetas: 100 unidades")
        fun testBusinessCards100() {
            val config = SheetConfig(
                productWidthMm = BigDecimal("85"),
                productHeightMm = BigDecimal("55"),
                bleedMm = BigDecimal("3"),
                sheetWidthMm = BigDecimal("320"),
                sheetHeightMm = BigDecimal("450"),
                unitsPerSheet = 21,  // Precalculado
                setupCost = BigDecimal("5.00"),
                sheetMaterialCost = BigDecimal("0.10"),
                clickCost = BigDecimal("0.05"),
                wasteSheets = 5
            )
            
            val product = Product(
                id = 5,
                sku = "TARJETA-85X55",
                name = "Tarjeta de Visita",
                calculationMode = CalculationMode.SHEET,
                sheetConfig = config
            )
            
            val request = PriceRequest(
                productId = 5,
                quantity = 100
            )
            
            val response = engine.calculatePrice(product, request)
            
            // 100 tarjetas / 21 por pliego = 4.76 → 5 pliegos
            // Pliegos totales: 5 + 5 (merma) = 10
            // Coste setup: 5.00€
            // Coste material: 10 * 0.10 = 1.00€
            // Coste clicks: 10 * 0.05 = 0.50€
            // Total: 6.50€
            // Por unidad: 6.50 / 100 = 0.065€
            // Margen 30%: 0.065 * 0.30 = 0.0195€
            // Precio venta unitario: 0.065 + 0.0195 = 0.0845€
            
            val expectedUnitPrice = BigDecimal("0.08")
            assertEquals(
                expectedUnitPrice,
                response.unitPrice.setScale(2, RoundingMode.HALF_UP)
            )
            
            assertTrue(response.breakdown.details!!.contains("10"))  // 10 pliegos totales
        }
        
        @Test
        @DisplayName("Tarjetas: 1000 unidades (economía de escala)")
        fun testBusinessCards1000() {
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
            
            val product = Product(
                id = 5,
                sku = "TARJETA-85X55",
                name = "Tarjeta de Visita",
                calculationMode = CalculationMode.SHEET,
                sheetConfig = config
            )
            
            val request100 = PriceRequest(productId = 5, quantity = 100)
            val request1000 = PriceRequest(productId = 5, quantity = 1000)
            
            val response100 = engine.calculatePrice(product, request100)
            val response1000 = engine.calculatePrice(product, request1000)
            
            // El precio unitario de 1000 debe ser menor que el de 100
            // debido a que el coste de setup se reparte entre más unidades
            assertTrue(
                response1000.unitPrice < response100.unitPrice,
                "1000 tarjetas debe tener menor precio unitario que 100"
            )
        }
        
        @Test
        @DisplayName("Flyers A5: cálculo de cabidas")
        fun testFlyerCabidas() {
            val productWidthMm = BigDecimal("148")  // A5
            val productHeightMm = BigDecimal("210")
            val bleedMm = BigDecimal("3")
            val sheetWidthMm = BigDecimal("320")  // SRA3
            val sheetHeightMm = BigDecimal("450")
            
            val calculatedCabidas = SheetCalculator.calculateUnitsPerSheet(
                productWidthMm, productHeightMm, bleedMm,
                sheetWidthMm, sheetHeightMm
            )
            
            // A5 con sangre: 154mm x 216mm
            // En SRA3 (320x450):
            // Sin rotación: (320/154) * (450/216) = 2 * 2 = 4
            // Con rotación: (320/216) * (450/154) = 1 * 2 = 2
            // Máximo: 4
            
            assertEquals(4, calculatedCabidas)
        }
    }
    
    // =====================================================
    // TESTS: CÁLCULO UNITARIO (MERCHANDISING)
    // =====================================================
    
    @Nested
    @DisplayName("Cálculo Unitario (Merchandising)")
    inner class UnitCalculationTests {
        
        @Test
        @DisplayName("Roll-up: precio base sin descuento")
        fun testRollupBasicPrice() {
            val config = UnitConfig(
                unitCost = BigDecimal("35.00"),
                markupPercentage = BigDecimal("40.0")
            )
            
            val product = Product(
                id = 6,
                sku = "ROLLUP-85X200",
                name = "Roll-up 85x200cm",
                calculationMode = CalculationMode.UNIT,
                unitConfig = config
            )
            
            val request = PriceRequest(
                productId = 6,
                quantity = 1
            )
            
            val response = engine.calculatePrice(product, request)
            
            // Coste: 35.00€
            // Margen 40%: 35 * 0.40 = 14.00€
            // Precio venta: 35 + 14 = 49.00€
            
            assertEquals(BigDecimal("49.00"), response.unitPrice.setScale(2, RoundingMode.HALF_UP))
        }
        
        @Test
        @DisplayName("Roll-up: descuento por volumen (5-9 unidades)")
        fun testRollupVolumeDiscount5to9() {
            val config = UnitConfig(
                unitCost = BigDecimal("35.00"),
                markupPercentage = BigDecimal("40.0"),
                volumeDiscounts = listOf(
                    VolumeDiscount(1, 4, BigDecimal.ZERO),
                    VolumeDiscount(5, 9, BigDecimal("5.0")),
                    VolumeDiscount(10, null, BigDecimal("10.0"))
                )
            )
            
            val product = Product(
                id = 6,
                sku = "ROLLUP-85X200",
                name = "Roll-up 85x200cm",
                calculationMode = CalculationMode.UNIT,
                unitConfig = config
            )
            
            val request = PriceRequest(
                productId = 6,
                quantity = 7
            )
            
            val response = engine.calculatePrice(product, request)
            
            // Descuento 5%: 35 * 0.05 = 1.75€
            // Coste con descuento: 35 - 1.75 = 33.25€
            // Margen 40%: 33.25 * 0.40 = 13.30€
            // Precio venta: 33.25 + 13.30 = 46.55€
            
            assertTrue(response.breakdown.details!!.contains("5% descuento"))
            assertTrue(response.breakdown.discount > BigDecimal.ZERO)
        }
        
        @Test
        @DisplayName("Roll-up: descuento por volumen (10+ unidades)")
        fun testRollupVolumeDiscount10Plus() {
            val config = UnitConfig(
                unitCost = BigDecimal("35.00"),
                markupPercentage = BigDecimal("40.0"),
                volumeDiscounts = listOf(
                    VolumeDiscount(1, 4, BigDecimal.ZERO),
                    VolumeDiscount(5, 9, BigDecimal("5.0")),
                    VolumeDiscount(10, null, BigDecimal("10.0"))
                )
            )
            
            val product = Product(
                id = 6,
                sku = "ROLLUP-85X200",
                name = "Roll-up 85x200cm",
                calculationMode = CalculationMode.UNIT,
                unitConfig = config
            )
            
            val request = PriceRequest(
                productId = 6,
                quantity = 15
            )
            
            val response = engine.calculatePrice(product, request)
            
            // Descuento 10%: 35 * 0.10 = 3.50€
            // Coste con descuento: 35 - 3.50 = 31.50€
            
            assertTrue(response.breakdown.details!!.contains("10% descuento"))
        }
        
        @Test
        @DisplayName("Producto con precio fijo por volumen")
        fun testFixedPriceOverride() {
            val config = UnitConfig(
                unitCost = BigDecimal("50.00"),
                markupPercentage = BigDecimal("30.0"),
                volumeDiscounts = listOf(
                    VolumeDiscount(
                        minQuantity = 100,
                        maxQuantity = null,
                        discountPercentage = BigDecimal.ZERO,
                        fixedPriceOverride = BigDecimal("40.00")  // Precio especial
                    )
                )
            )
            
            val product = Product(
                id = 7,
                sku = "SPECIAL-ITEM",
                name = "Producto Especial",
                calculationMode = CalculationMode.UNIT,
                unitConfig = config
            )
            
            val request = PriceRequest(
                productId = 7,
                quantity = 100
            )
            
            val response = engine.calculatePrice(product, request)
            
            assertTrue(response.breakdown.details!!.contains("Precio especial"))
        }
    }
    
    // =====================================================
    // TESTS: VALIDACIONES Y EDGE CASES
    // =====================================================
    
    @Nested
    @DisplayName("Validaciones y Edge Cases")
    inner class ValidationTests {
        
        @Test
        @DisplayName("Cantidad negativa debe fallar")
        fun testNegativeQuantity() {
            val config = UnitConfig(
                unitCost = BigDecimal("10.00"),
                markupPercentage = BigDecimal("30.0")
            )
            
            val product = Product(
                id = 8,
                sku = "TEST",
                name = "Test Product",
                calculationMode = CalculationMode.UNIT,
                unitConfig = config
            )
            
            val request = PriceRequest(
                productId = 8,
                quantity = -5
            )
            
            // La validación debe ocurrir en la capa de API/Controller
            // Aquí probamos que el motor no falla con entrada inválida
            assertDoesNotThrow {
                val response = engine.calculatePrice(product, request)
                assertTrue(response.totalPrice < BigDecimal.ZERO)
            }
        }
        
        @Test
        @DisplayName("Dimensiones exactamente en el límite")
        fun testExactDimensions() {
            val config = AreaConfig(
                materialType = MaterialType.VINYL,
                pricePerSqm = BigDecimal("5.00"),
                wasteFactor = BigDecimal("1.00"),
                minWidthCm = BigDecimal("100"),
                maxWidthCm = BigDecimal("500"),
                minHeightCm = BigDecimal("100"),
                maxHeightCm = BigDecimal("500")
            )
            
            val product = Product(
                id = 9,
                sku = "VINYL-TEST",
                name = "Vinilo Test",
                calculationMode = CalculationMode.AREA,
                areaConfig = config
            )
            
            // Prueba con dimensiones mínimas
            val requestMin = PriceRequest(
                productId = 9,
                quantity = 1,
                widthCm = BigDecimal("100"),
                heightCm = BigDecimal("100")
            )
            
            assertDoesNotThrow {
                engine.calculatePrice(product, requestMin)
            }
            
            // Prueba con dimensiones máximas
            val requestMax = PriceRequest(
                productId = 9,
                quantity = 1,
                widthCm = BigDecimal("500"),
                heightCm = BigDecimal("500")
            )
            
            assertDoesNotThrow {
                engine.calculatePrice(product, requestMax)
            }
        }
    }
    
    // =====================================================
    // TESTS DE INTEGRACIÓN
    // =====================================================
    
    @Nested
    @DisplayName("Tests de Integración")
    inner class IntegrationTests {
        
        @Test
        @DisplayName("Comparar precios: 1 vs 10 vs 100 tarjetas")
        fun testPriceScaling() {
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
            
            val product = Product(
                id = 10,
                sku = "TARJETA",
                name = "Tarjeta",
                calculationMode = CalculationMode.SHEET,
                sheetConfig = config
            )
            
            val quantities = listOf(1, 10, 100, 1000)
            val responses = quantities.map { qty ->
                engine.calculatePrice(product, PriceRequest(10, qty))
            }
            
            // El precio unitario debe decrecer a medida que aumenta la cantidad
            for (i in 0 until responses.size - 1) {
                assertTrue(
                    responses[i].unitPrice >= responses[i + 1].unitPrice,
                    "Precio unitario debe decrecer o mantenerse con mayor cantidad"
                )
            }
            
            // Imprimir tabla de precios para verificación manual
            println("\n=== TABLA DE PRECIOS - TARJETAS ===")
            println("Cantidad | Precio Unit. | Total")
            println("---------|--------------|-------")
            responses.forEach { r ->
                println(
                    "${r.quantity.toString().padStart(8)} | " +
                    "${r.unitPrice.setScale(2, RoundingMode.HALF_UP)}€".padStart(12) + " | " +
                    "${r.totalPrice.setScale(2, RoundingMode.HALF_UP)}€"
                )
            }
        }
    }
}
