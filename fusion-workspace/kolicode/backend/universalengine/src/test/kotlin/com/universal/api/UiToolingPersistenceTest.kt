package com.universal.api

import io.kotest.core.spec.style.StringSpec
import io.kotest.matchers.shouldBe
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive

class UiToolingPersistenceTest : StringSpec({
    "buildProjectSupportFiles persiste uiPreset y uiTooling en PROJECT_CONTEXT" {
        val files = buildProjectSupportFiles(
            projectName = "UI Demo",
            clientName = "Acme",
            taskName = "UI hardening",
            description = "Validar persistencia UI",
            timeline = emptyList(),
            profile = ProjectProfile.STATIC,
            creativeEngine = null,
            runtime = "jvm",
            tags = listOf("ui", "qa"),
            preview = "cover.png",
            domainSpec = DomainSpec(
                functionalRequirements = listOf("Login"),
                useCases = listOf("User signs in"),
                dataModel = listOf("User(id,email)"),
                requiredApis = listOf("POST /api/v1/auth/login")
            ),
            uiPreset = "modern-saas",
            uiTooling = listOf("design-tokens", "ui-kit", "a11y-checks"),
            enableA11yChecks = true,
            enableVisualRegression = false,
            useThreeJsInterop = false,
            enableTailwindDirectives = false,
            dependencies = emptyList()
        )

        val context = files.first { it.nombreArchivo == "PROJECT_CONTEXT.json" }
        val json = customJson.parseToJsonElement(context.contenido).jsonObject

        json["uiPreset"]?.jsonPrimitive?.content shouldBe "modern-saas"
        json["enableA11yChecks"]?.jsonPrimitive?.content shouldBe "true"
        json["enableVisualRegression"]?.jsonPrimitive?.content shouldBe "false"

        val uiTooling = json["uiTooling"]?.jsonArray?.map { it.jsonPrimitive.content }.orEmpty()
        uiTooling shouldBe listOf("design-tokens", "ui-kit", "a11y-checks")
    }

    "buildProjectSupportFiles genera design-tokens.css cuando uiTooling lo solicita" {
        val files = buildProjectSupportFiles(
            projectName = "UI Demo",
            clientName = "",
            taskName = "",
            description = null,
            timeline = emptyList(),
            profile = ProjectProfile.NEXT_LEVEL,
            creativeEngine = null,
            runtime = "jvm",
            tags = emptyList(),
            preview = null,
            domainSpec = DomainSpec(),
            uiPreset = "enterprise-dashboard",
            uiTooling = listOf("design-tokens"),
            enableA11yChecks = false,
            enableVisualRegression = false,
            useThreeJsInterop = true,
            enableTailwindDirectives = false,
            dependencies = emptyList()
        )

        val designTokensFile = files.firstOrNull {
            it.nombreArchivo == "design-tokens.css" && it.ruta == "/ui/styles"
        }

        (designTokensFile != null) shouldBe true
        designTokensFile?.contenido?.contains("--color-primary") shouldBe true
    }
})

