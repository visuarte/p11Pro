package main.kotlin.api

import io.kotest.core.spec.style.StringSpec
import io.kotest.matchers.shouldBe
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import io.ktor.server.testing.testApplication
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive

class ExampleApiTest : StringSpec({
    "GET /api/v1/example responde mensaje" {
        testApplication {
            application { module(testMode = true) }
            val response = client.get("/api/v1/example")
            response.status shouldBe HttpStatusCode.OK
            val body = Json.parseToJsonElement(response.bodyAsText()).jsonObject
            body["message"]?.jsonPrimitive?.content shouldBe "¡Hola desde el backend Kotlin!"
        }
    }

    "POST /api/v1/example responde con datos recibidos" {
        testApplication {
            application { module(testMode = true) }
            val response = client.post("/api/v1/example") {
                contentType(ContentType.Application.Json)
                setBody("{\"name\":\"Visuarte\"}")
            }
            response.status shouldBe HttpStatusCode.OK
            val body = Json.parseToJsonElement(response.bodyAsText()).jsonObject
            val received = body["received"]?.jsonObject
            received?.get("name")?.jsonPrimitive?.content shouldBe "Visuarte"
        }
    }
})
