package com.universal.api

import io.kotest.core.spec.style.StringSpec
import io.kotest.matchers.shouldBe
import io.ktor.client.request.*
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.HttpStatusCode
import io.ktor.http.contentType
import io.ktor.server.testing.testApplication
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive

class ErrorHandlingApiTest : StringSpec({
    "invalid payload retorna ApiError uniforme" {
        testApplication {
            application { module(testMode = true) }

            val response = client.post("/api/v1/projects/init-from-knowledge") {
                contentType(ContentType.Application.Json)
                setBody("{\"name\":\"demo\"")
            }

            response.status shouldBe HttpStatusCode.BadRequest
            val json = Json.parseToJsonElement(response.bodyAsText()).jsonObject
            json["status"]?.jsonPrimitive?.content shouldBe "ERROR"
            json["apiError"]?.jsonObject?.get("code")?.jsonPrimitive?.content shouldBe "VALIDATION_ERROR"
            json["apiError"]?.jsonObject?.get("category")?.jsonPrimitive?.content shouldBe "VALIDATION"
        }
    }

    "errores incluyen requestId y tenantId estructurados" {
        testApplication {
            application { module(testMode = true) }

            val response = client.post("/api/v1/projects/init-from-knowledge") {
                contentType(ContentType.Application.Json)
                header("X-Request-Id", "req-123")
                header("X-Tenant-Id", "tenant-demo")
                setBody("{}")
            }

            response.status shouldBe HttpStatusCode.BadRequest
            response.headers["X-Request-Id"] shouldBe "req-123"

            val json = Json.parseToJsonElement(response.bodyAsText()).jsonObject
            val apiError = json["apiError"]!!.jsonObject
            apiError["requestId"]!!.jsonPrimitive.content shouldBe "req-123"
            apiError["tenantId"]!!.jsonPrimitive.content shouldBe "tenant-demo"
        }
    }

    "init-from-knowledge retorna estructura CREATED en testMode con policy strict" {
        testApplication {
            application { module(testMode = true) }

            val response = client.post("/api/v1/projects/init-from-knowledge") {
                contentType(ContentType.Application.Json)
                setBody(
                    """
                    {
                      "name": "Proyecto prueba policy",
                      "query": "consulta de prueba",
                      "sourceIds": []
                    }
                    """.trimIndent()
                )
            }

            response.status shouldBe HttpStatusCode.Created
            val body = Json.parseToJsonElement(response.bodyAsText()).jsonObject
            body["status"]?.jsonPrimitive?.content shouldBe "CREATED"
            body["payload"]?.jsonObject?.get("policy")?.jsonObject?.get("enforcement")?.jsonPrimitive?.content shouldBe "strict"
        }
    }
})


