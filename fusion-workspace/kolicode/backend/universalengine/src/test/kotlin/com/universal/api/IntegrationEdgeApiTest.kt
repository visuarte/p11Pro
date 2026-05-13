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

class IntegrationEdgeApiTest : StringSpec({

    "iterate simula timeout de IA y responde ApiError TIMEOUT" {
        val old = System.getProperty("test.ai.timeout")
        System.setProperty("test.ai.timeout", "true")
        try {
            testApplication {
                application { module(testMode = true) }

                val response = client.post("/api/v1/projects/iterate") {
                    contentType(ContentType.Application.Json)
                    setBody(
                        """
                        {
                          "fileId": 1,
                          "instruccion": "refactor"
                        }
                        """.trimIndent()
                    )
                }

                response.status shouldBe HttpStatusCode.GatewayTimeout
                val json = Json.parseToJsonElement(response.bodyAsText()).jsonObject
                json["apiError"]?.jsonObject?.get("code")?.jsonPrimitive?.content shouldBe "TIMEOUT_ERROR"
                json["apiError"]?.jsonObject?.get("category")?.jsonPrimitive?.content shouldBe "TIMEOUT"
            }
        } finally {
            if (old == null) System.clearProperty("test.ai.timeout") else System.setProperty("test.ai.timeout", old)
        }
    }

    "ready simula DB caida sin DB real" {
        val old = System.getProperty("test.db.down")
        System.setProperty("test.db.down", "true")
        try {
            testApplication {
                application { module(testMode = true) }

                val response = client.get("/ready")
                response.status shouldBe HttpStatusCode.ServiceUnavailable
                val body = response.bodyAsText()
                body.contains("NOT_READY") shouldBe true
                body.contains("database unavailable") shouldBe true
            }
        } finally {
            if (old == null) System.clearProperty("test.db.down") else System.setProperty("test.db.down", old)
        }
    }
})

