package com.universal.api

import main.kotlin.api.module
import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.shouldBe
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import io.ktor.server.testing.*
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive

class ProjectTest : DescribeSpec({
    describe("Generador de Proyectos") {

        it("debe crear un proyecto y responder el contrato HTTP esperado") {
            testApplication {
                application { module(testMode = true) }

                val response = client.post("/api/v1/projects") {
                    contentType(ContentType.Application.Json)
                    setBody(
                        """
                        {
                          "nombre": "Test Automatizado",
                          "director": "QA Team",
                          "fecha_inicio": "2026-04-05",
                          "equipo": ["Backend", "Frontend"]
                        }
                        """.trimIndent()
                    )
                }

                response.status shouldBe HttpStatusCode.OK

                val body = Json.parseToJsonElement(response.bodyAsText()).jsonObject
                body["id"]?.jsonPrimitive?.content?.toInt() shouldBe 1
                body["nombre"]?.jsonPrimitive?.content shouldBe "Test Automatizado"
                body["director"]?.jsonPrimitive?.content shouldBe "QA Team"
                body["fecha_inicio"]?.jsonPrimitive?.content shouldBe "2026-04-05"
                val equipo = body["equipo"]?.jsonArray?.map { it.jsonPrimitive.content }
                equipo shouldBe listOf("Backend", "Frontend")
                body["estado"]?.jsonPrimitive?.content shouldBe "CREADO"
            }
        }
    }
})