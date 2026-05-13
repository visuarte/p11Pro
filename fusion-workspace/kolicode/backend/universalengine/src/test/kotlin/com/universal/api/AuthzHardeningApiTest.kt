package com.universal.api

import io.kotest.core.spec.style.StringSpec
import io.kotest.matchers.shouldBe
import io.ktor.client.request.header
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.HttpStatusCode
import io.ktor.http.contentType
import io.ktor.server.testing.testApplication
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive

class AuthzHardeningApiTest : StringSpec({

    beforeEach {
        System.setProperty("security.enforced", "true")
        System.setProperty("security.api.key", "test-key")
    }

    afterEach {
        System.clearProperty("security.enforced")
        System.clearProperty("security.api.key")
    }

    "knowledge query sin credenciales es bloqueado" {
        testApplication {
            application { module(testMode = true) }
            val response = client.post("/api/v1/knowledge/query") {
                contentType(ContentType.Application.Json)
                setBody("""{"query":"hola"}""")
            }
            response.status shouldBe HttpStatusCode.Forbidden
        }
    }

    "knowledge query bloquea rol viewer para escritura" {
        testApplication {
            application { module(testMode = true) }
            val response = client.post("/api/v1/knowledge/query") {
                contentType(ContentType.Application.Json)
                header("Authorization", "Bearer test-key")
                header("X-Tenant-Id", "tenant-1")
                header("X-Role", "viewer")
                setBody("""{"query":"hola"}""")
            }
            response.status shouldBe HttpStatusCode.Forbidden
            val body = Json.parseToJsonElement(response.bodyAsText()).jsonObject
            body["apiError"]?.jsonObject?.get("category")?.jsonPrimitive?.content shouldBe "FORBIDDEN"
        }
    }

    "knowledge query permite rol editor" {
        testApplication {
            application { module(testMode = true) }
            val response = client.post("/api/v1/knowledge/query") {
                contentType(ContentType.Application.Json)
                header("Authorization", "Bearer test-key")
                header("X-Tenant-Id", "tenant-1")
                header("X-Role", "editor")
                setBody("""{"query":"hola"}""")
            }
            response.status shouldBe HttpStatusCode.OK
        }
    }
})

