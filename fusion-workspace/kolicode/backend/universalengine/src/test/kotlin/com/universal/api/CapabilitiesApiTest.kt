package com.universal.api

import io.kotest.core.spec.style.StringSpec
import io.kotest.matchers.shouldBe
import io.kotest.matchers.string.shouldContain
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import io.ktor.server.testing.testApplication
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive

class CapabilitiesApiTest : StringSpec({
    "GET /api/v1/capabilities responde 200 con payload JSON consistente" {
        testApplication {
            application { module(testMode = true) }

            val response = client.get("/api/v1/capabilities")
            response.status shouldBe HttpStatusCode.OK

            val body = response.bodyAsText()
            body shouldContain "\"status\":\"SUCCESS\""
            body shouldContain "\"profiles\""
            body shouldContain "\"next-level\""
            body shouldContain "\"domainSpecFields\""
            body shouldContain "\"uiPresets\""
            body shouldContain "\"uiTooling\""
        }
    }

    "POST /api/v1/projects/init-static con JSON invalido responde 400 con cuerpo consistente" {
        testApplication {
            application { module(testMode = true) }

            val response = client.post("/api/v1/projects/init-static") {
                contentType(ContentType.Application.Json)
                setBody("{\"nombre\":\"demo\"")
            }

            response.status shouldBe HttpStatusCode.BadRequest
            val json = Json.parseToJsonElement(response.bodyAsText()).jsonObject
            json["status"]?.jsonPrimitive?.content shouldBe "ERROR"
            json["error"]?.jsonPrimitive?.content shouldBe "invalid request payload"
        }
    }

    "Capabilities e init-static error exponen Content-Type application/json" {
        testApplication {
            application { module(testMode = true) }

            val capabilitiesResponse = client.get("/api/v1/capabilities")
            val capabilitiesContentType = capabilitiesResponse.headers[HttpHeaders.ContentType].orEmpty()
            capabilitiesContentType shouldContain ContentType.Application.Json.toString()

            val invalidInitStaticResponse = client.post("/api/v1/projects/init-static") {
                contentType(ContentType.Application.Json)
                setBody("{\"nombre\":\"demo\"")
            }
            val invalidInitStaticContentType = invalidInitStaticResponse.headers[HttpHeaders.ContentType].orEmpty()
            invalidInitStaticContentType shouldContain ContentType.Application.Json.toString()
        }
    }
})

