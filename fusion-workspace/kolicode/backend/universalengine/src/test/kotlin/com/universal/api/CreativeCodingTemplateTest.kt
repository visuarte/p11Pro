package com.universal.api

import io.kotest.core.spec.style.StringSpec
import io.kotest.matchers.collections.shouldNotBeEmpty
import io.kotest.matchers.shouldBe
import io.kotest.matchers.string.shouldContain
import io.ktor.client.request.*
import io.ktor.client.statement.bodyAsText
import io.ktor.http.*
import io.ktor.server.testing.testApplication

class CreativeCodingTemplateTest : StringSpec({
    "resolve profile creative-coding y engine py5" {
        val req = ProjectCreateRequest(
            name = "Creative Demo",
            profile = "creative-coding",
            engine = "py5",
            runtime = "python3.11",
            tags = listOf("creative", "visual"),
            preview = "cover.png"
        )

        resolveProjectProfile(req) shouldBe ProjectProfile.CREATIVE_CODING
        resolveCreativeEngineToken(req.engine) shouldBe CreativeEngine.PY5
    }

    "resolveProjectConfig aplica domainSpec base cuando no se envia" {
        val resolved = resolveProjectConfig(
            ProjectCreateRequest(
                name = "Domain Base Demo",
                profile = "static",
                cliente = "Acme",
                tarea = "MVP"
            )
        )

        resolved.domainSpec.functionalRequirements.shouldNotBeEmpty()
        resolved.domainSpec.useCases.shouldNotBeEmpty()
        resolved.domainSpec.dataModel.shouldNotBeEmpty()
        resolved.domainSpec.requiredApis.shouldNotBeEmpty()
    }

    "buildCreativeCodingTemplate para py5 incluye pyproject y uv.lock" {
        val files = buildCreativeCodingTemplate(
            projectName = "Creative Demo",
            engine = CreativeEngine.PY5,
            runtime = "python3.11",
            description = "Demo",
            tags = listOf("creative"),
            preview = "cover.png"
        )

        files.any { it.ruta == "/creative/py5" && it.nombreArchivo == "pyproject.toml" } shouldBe true
        files.any { it.ruta == "/creative/py5" && it.nombreArchivo == "uv.lock" } shouldBe true
        files.first { it.ruta == "/creative/py5" && it.nombreArchivo == "main.py" }.contenido shouldContain "py5.run_sketch()"
    }

    "POST /api/v1/projects/{id}/execute devuelve 403 por politica de seguridad" {
        testApplication {
            application { module(testMode = true) }

            val response = client.post("/api/v1/projects/999/execute") {
                contentType(ContentType.Application.Json)
                setBody("{}")
            }

            response.status shouldBe HttpStatusCode.Forbidden
            response.bodyAsText() shouldContain "sketch execution is disabled on backend"
        }
    }
})


