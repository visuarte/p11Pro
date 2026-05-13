package main.kotlin.api

import io.kotest.core.spec.style.StringSpec
import io.kotest.matchers.shouldBe
import io.ktor.http.ContentType
import io.ktor.server.testing.testApplication
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.HttpStatusCode
import io.ktor.http.contentType
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive


class HealthApiTest : StringSpec({
    "GET /health responde status ok" {
        testApplication {
            application { module(testMode = true) }
            val response = client.get("/health") {
                header("Accept", "application/json")
            }
            response.status.value shouldBe 200
            val body = Json.parseToJsonElement(response.bodyAsText()).jsonObject
            body["status"]?.jsonPrimitive?.content shouldBe "ok"
        }
    }

    "POST /api/v1/example con payload invalido devuelve contrato ApiError" {
        testApplication {
            application { module(testMode = true) }
            val response = client.post("/api/v1/example") {
                contentType(ContentType.Application.Json)
                setBody("{\"foo\":")
            }
            response.status shouldBe HttpStatusCode.BadRequest
            val body = Json.parseToJsonElement(response.bodyAsText()).jsonObject
            body["status"]?.jsonPrimitive?.content shouldBe "ERROR"
            body["apiError"]?.jsonObject?.get("code")?.jsonPrimitive?.content shouldBe "VALIDATION_ERROR"
        }
    }

    "GET /api/v1/crew sin tenant header devuelve validacion" {
        testApplication {
            application { module(testMode = true) }
            val response = client.get("/api/v1/crew")
            response.status shouldBe HttpStatusCode.BadRequest
            val body = Json.parseToJsonElement(response.bodyAsText()).jsonObject
            body["apiError"]?.jsonObject?.get("category")?.jsonPrimitive?.content shouldBe "VALIDATION"
        }
    }
})
