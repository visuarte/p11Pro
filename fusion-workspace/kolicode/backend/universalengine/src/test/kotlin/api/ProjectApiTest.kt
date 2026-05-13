package main.kotlin.api

import io.kotest.core.spec.style.StringSpec
import io.kotest.matchers.shouldBe
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import io.ktor.server.testing.testApplication
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive

class ProjectApiTest : StringSpec({
    "POST /api/v1/projects crea un proyecto y responde con el contrato esperado" {
        testApplication {
            application { module(testMode = true) }
            val response = client.post("/api/v1/projects") {
                contentType(ContentType.Application.Json)
                setBody("""
                    {
                        "nombre": "Corto Demo",
                        "director": "Ana Pérez",
                        "fecha_inicio": "2026-05-10",
                        "equipo": ["Dirección", "Producción", "Arte"]
                    }
                """.trimIndent())
            }
            response.status shouldBe HttpStatusCode.OK
            val body = Json.parseToJsonElement(response.bodyAsText()).jsonObject
            body["id"]?.jsonPrimitive?.content?.toInt() shouldBe 1
            body["nombre"]?.jsonPrimitive?.content shouldBe "Corto Demo"
            body["director"]?.jsonPrimitive?.content shouldBe "Ana Pérez"
            body["fecha_inicio"]?.jsonPrimitive?.content shouldBe "2026-05-10"
            val equipo = body["equipo"]?.jsonArray?.map { it.jsonPrimitive.content }
            equipo shouldBe listOf("Dirección", "Producción", "Arte")
            body["estado"]?.jsonPrimitive?.content shouldBe "CREADO"
        }
    }
})
