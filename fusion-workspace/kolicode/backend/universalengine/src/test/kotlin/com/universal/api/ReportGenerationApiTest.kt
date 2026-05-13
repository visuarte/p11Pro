package com.universal.api

import io.kotest.core.spec.style.StringSpec
import io.kotest.matchers.shouldBe
import io.kotest.matchers.string.shouldContain
import io.ktor.client.request.*
import io.ktor.client.statement.bodyAsText
import io.ktor.http.*
import io.ktor.server.testing.testApplication
import java.io.File
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive

class ReportGenerationApiTest : StringSpec({
    "POST /api/v1/projects/reports/generate diario crea archivo con fecha" {
        val targetDate = "2026-04-10"
        val expectedFile = File("docs/reportes_generados/reportediario-$targetDate.md")
        expectedFile.delete()

        testApplication {
            application { module(testMode = true) }

            val response = client.post("/api/v1/projects/reports/generate") {
                contentType(ContentType.Application.Json)
                setBody("""{"tipo":"diario","date":"$targetDate","responsable":"QA"}""")
            }

            response.status shouldBe HttpStatusCode.OK
            val json = Json.parseToJsonElement(response.bodyAsText()).jsonObject
            json["status"]?.jsonPrimitive?.content shouldBe "SUCCESS"
            json.toString() shouldContain "reportediario-$targetDate.md"
        }

        expectedFile.exists() shouldBe true
        expectedFile.delete()
    }

    "POST /api/v1/projects/reports/generate semanal crea archivo con semana" {
        val targetWeek = "2026-W15"
        val expectedFile = File("docs/reportes_generados/reportesemanal-$targetWeek.md")
        expectedFile.delete()

        testApplication {
            application { module(testMode = true) }

            val response = client.post("/api/v1/projects/reports/generate") {
                contentType(ContentType.Application.Json)
                setBody("""{"tipo":"semanal","week":"$targetWeek","responsable":"QA"}""")
            }

            response.status shouldBe HttpStatusCode.OK
            val json = Json.parseToJsonElement(response.bodyAsText()).jsonObject
            json["status"]?.jsonPrimitive?.content shouldBe "SUCCESS"
            json.toString() shouldContain "reportesemanal-$targetWeek.md"
        }

        expectedFile.exists() shouldBe true
        expectedFile.delete()
    }
})

