package com.universal.api

import io.kotest.core.spec.style.StringSpec
import io.kotest.matchers.shouldBe
import io.kotest.matchers.nulls.shouldBeNull
import io.kotest.matchers.nulls.shouldNotBeNull
import io.kotest.matchers.string.shouldContain
import io.kotest.matchers.string.shouldNotContain
import io.kotest.matchers.collections.shouldNotBeEmpty

class AiPromptPolicyTest : StringSpec({

    "resolveProjectProfile usa profile prioritario y fallback a cliente legacy" {
        resolveProjectProfile(ProjectCreateRequest(name = "Demo", profile = "next-level", cliente = "static")) shouldBe ProjectProfile.NEXT_LEVEL
        resolveProjectProfile(ProjectCreateRequest(name = "Demo", cliente = "next-level")) shouldBe ProjectProfile.NEXT_LEVEL
        resolveProjectProfile(ProjectCreateRequest(name = "Demo", cliente = "Cliente Real")) shouldBe ProjectProfile.STATIC
    }

    "resolveProjectName prioriza name y cae a nombre" {
        resolveProjectName(ProjectCreateRequest(name = "New Name", nombre = "Viejo Nombre")) shouldBe "New Name"
        resolveProjectName(ProjectCreateRequest(nombre = "Solo Legacy")) shouldBe "Solo Legacy"
    }

    "buildFritz2WebglTemplate crea backend y frontend con switch WebGL" {
        val files = buildFritz2WebglTemplate(
            projectName = "Demo Next",
            profile = ProjectProfile.NEXT_LEVEL,
            useThreeJsInterop = true,
            enableTailwindDirectives = true,
            clientName = "Acme",
            taskName = "PoC",
            description = "Plantilla inicial"
        )

        files.any { it.ruta == "/backend" && it.nombreArchivo == "build.gradle.kts" } shouldBe true
        files.any { it.ruta == "/frontend" && it.nombreArchivo == "build.gradle.kts" } shouldBe true
        val mainKt = files.first { it.ruta == "/frontend/src/main/kotlin" && it.nombreArchivo == "Main.kt" }.contenido
        mainKt shouldContain "if (config.useThreeJsInterop)"
        mainKt shouldContain "initThreeJs"
        mainKt shouldContain "initRawWebGL"
    }

    "resolveAiPromptMode usa PATCH por defecto y soporta SCAFFOLD" {
        resolveAiPromptMode(null) shouldBe AiPromptMode.PATCH
        resolveAiPromptMode("") shouldBe AiPromptMode.PATCH
        resolveAiPromptMode("patch") shouldBe AiPromptMode.PATCH
        resolveAiPromptMode("SCAFFOLD") shouldBe AiPromptMode.SCAFFOLD
    }

    "buildKotlinPatchPrompt fuerza salida solo Kotlin segura con strict gate activo" {
        val prompt = buildKotlinPatchPrompt(
            existingCode = "fun demo() = Unit",
            instruction = "Agrega validaciones"
        )

        prompt shouldContain "Devuelve SOLO codigo Kotlin valido"
        prompt shouldContain "STRICT GATE ACTIVO"
        prompt shouldContain "PROHIBIDO usar !!"
        prompt shouldContain "PROHIBIDO System.exit()"
        prompt shouldContain "PROHIBIDO credenciales"
        prompt shouldContain "Maximo $MAX_TODOS_IN_PATCH comentarios TODO"
        prompt shouldContain "Agrega validaciones"
    }

    "buildKotlinScaffoldPrompt define formato FILE para multiarchivo" {
        val prompt = buildKotlinScaffoldPrompt(
            existingCode = "package demo",
            instruction = "Genera capa domain y application"
        )

        prompt shouldContain "### FILE: <ruta/archivo.kt>"
        prompt shouldContain "Genera capa domain y application"
    }

    "normalizePatchProposal limpia fences y acepta kotlin valido" {
        val raw = """
            ```kotlin
            package demo
            fun ok(): String = "ok"
            ```
        """.trimIndent()

        val normalized = normalizePatchProposal(raw)
        normalized shouldContain "package demo"
        normalized shouldContain "fun ok(): String"
    }

    "normalizePatchProposal rechaza texto no kotlin" {
        val normalized = normalizePatchProposal("Este es un texto descriptivo sin codigo")
        normalized.shouldBeNull()
    }

    "normalizePatchProposal rechaza mezcla de codigo con narrativa" {
        val mixed = """
            package demo
            fun ok(): Unit = Unit

            Este codigo fue generado para ayudarte y puedes modificarlo.
        """.trimIndent()
        normalizePatchProposal(mixed).shouldBeNull()
    }

    "normalizePatchProposal rechaza propuesta kotlin valida que contiene !!" {
        val withBang = """
            package com.demo
            fun risky(s: String?): String = s!!.trim()
        """.trimIndent()
        normalizePatchProposal(withBang).shouldBeNull()
    }

    "normalizeScaffoldProposal exige patron FILE" {
        val raw = """
            ### FILE: src/main/kotlin/demo/App.kt
            package demo
            fun run(): Unit = Unit

            ### FILE: src/main/kotlin/demo/Model.kt
            package demo
            data class Model(val id: Int)
        """.trimIndent()

        val normalized = normalizeScaffoldProposal(raw)
        normalized shouldContain "### FILE: src/main/kotlin/demo/App.kt"
        normalized shouldContain "data class Model"
    }

    "normalizeScaffoldProposal rechaza respuestas sin patron FILE" {
        normalizeScaffoldProposal("package demo\nfun x(): Unit = Unit").shouldBeNull()
    }

    "buildFallbackProposal entrega formato seguro para ambos modos" {
        val source = "package demo\nfun fallback(): Unit = Unit"
        buildFallbackProposal(AiPromptMode.PATCH, source) shouldContain "fun fallback(): Unit"
        buildFallbackProposal(AiPromptMode.SCAFFOLD, source) shouldContain "### FILE: src/main/kotlin/Fallback.kt"
    }

    "sanitizeIterateBaseline limpia texto narrativo y preserva codigo kotlin" {
        val contaminated = """
            Para generar tarjetas QR, sigue estos pasos.

            ```kotlin
            package com.app

            fun main(): Unit {
                println("QR")
            }
            ```

            Este codigo fue generado para ayudarte.
        """.trimIndent()

        val sanitized = sanitizeIterateBaseline(contaminated)
        sanitized shouldContain "package com.app"
        sanitized shouldContain "fun main(): Unit"
        normalizePatchProposal(sanitized).shouldNotBeNull()
    }

    "sanitizeIterateBaseline mantiene baseline si no puede mejorar" {
        val original = "texto sin estructura kotlin"
        sanitizeIterateBaseline(original) shouldBe original
    }

    "sanitizeIterateBaseline limpia caso real contaminado con narrativa y def" {
        val contaminated = """
            package com.app

            fun main() {
                println("QR Code Generator")
            }

            Para generar tarjetas QR, puedes usar la biblioteca qrcodeview.

            package com.app

            import android.graphics.drawable.QrCodeDrawable
            import android.view.View
            import android.widget.Button

            def generateQRCode(): Unit = {
                val qrView = findViewById<QrCodeDrawable>(R.id.qrView)
                if (qrView != null) {
                    qrView.generateQrCode()
                }
            }
        """.trimIndent()

        val sanitized = sanitizeIterateBaseline(contaminated)
        sanitized shouldNotContain "Para generar tarjetas QR"
        sanitized shouldNotContain "def generateQRCode"
        normalizePatchProposal(sanitized).shouldNotBeNull()
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Strict Patch Gate — tests de reglas individuales
    // ──────────────────────────────────────────────────────────────────────────

    "strictPatchGate pasa con codigo kotlin limpio y unico package" {
        val clean = """
            package com.demo
            fun greet(name: String): String = "Hello, ${'$'}name"
            val defaultName: String = "World"
        """.trimIndent()
        strictPatchGate(clean) shouldBe PatchGateResult.Pass
    }

    "strictPatchGate rechaza uso de !! (non-null assertion)" {
        val code = """
            package com.demo
            fun risky(s: String?): String = s!!.trim()
        """.trimIndent()
        val result = strictPatchGate(code)
        result as PatchGateResult.Fail
        result.violations.any { it.rule == "no-double-bang" } shouldBe true
    }

    "strictPatchGate rechaza ausencia de declaracion package" {
        val code = """
            fun orphan(): Unit = Unit
            val x = 42
        """.trimIndent()
        val result = strictPatchGate(code)
        result as PatchGateResult.Fail
        result.violations.any { it.rule == "require-package" } shouldBe true
    }

    "strictPatchGate rechaza multiples declaraciones package" {
        val code = """
            package com.first
            fun a(): Unit = Unit
            package com.second
            fun b(): Unit = Unit
        """.trimIndent()
        val result = strictPatchGate(code)
        result as PatchGateResult.Fail
        result.violations.any { it.rule == "single-package" } shouldBe true
    }

    "strictPatchGate rechaza System.exit()" {
        val code = """
            package com.demo
            fun shutdown() { System.exit(0) }
        """.trimIndent()
        val result = strictPatchGate(code)
        result as PatchGateResult.Fail
        result.violations.any { it.rule == "no-system-exit" } shouldBe true
    }

    "strictPatchGate rechaza credenciales hardcodeadas" {
        val code = """
            package com.demo
            val password = "super_secret_abc"
        """.trimIndent()
        val result = strictPatchGate(code)
        result as PatchGateResult.Fail
        result.violations.any { it.rule == "no-hardcoded-secrets" } shouldBe true
    }

    "strictPatchGate rechaza exceso de TODOs" {
        val code = """
            package com.demo
            fun a(): Unit = Unit
            // TODO: step 1
            // TODO: step 2
            // TODO: step 3
            // TODO: step 4
        """.trimIndent()
        val result = strictPatchGate(code)
        result as PatchGateResult.Fail
        result.violations.any { it.rule == "max-todos" } shouldBe true
    }

    "strictPatchGate Fail acumula multiples violaciones simultaneas" {
        val code = """
            package com.demo
            fun bad(s: String?): String = s!!.trim()
            System.exit(1)
        """.trimIndent()
        val result = strictPatchGate(code)
        result as PatchGateResult.Fail
        result.violations.shouldNotBeEmpty()
        result.violations.any { it.rule == "no-double-bang" } shouldBe true
        result.violations.any { it.rule == "no-system-exit" } shouldBe true
    }
})


