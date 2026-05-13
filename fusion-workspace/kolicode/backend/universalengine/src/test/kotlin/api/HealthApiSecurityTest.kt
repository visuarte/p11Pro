package main.kotlin.api

import io.kotest.core.spec.style.StringSpec
import io.kotest.matchers.shouldBe
import io.ktor.client.request.get
import io.ktor.client.request.header
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.http.ContentType
import io.ktor.http.HttpStatusCode
import io.ktor.http.contentType
import io.ktor.server.testing.testApplication

class HealthApiSecurityTest : StringSpec({

    beforeEach {
        System.setProperty("security.enforced", "true")
        System.setProperty("security.api.key", "test-key")
    }

    afterEach {
        System.clearProperty("security.enforced")
        System.clearProperty("security.api.key")
    }

    "health bloquea request sin credenciales cuando seguridad está activa" {
        testApplication {
            application { module(testMode = true) }
            val response = client.get("/health")
            response.status shouldBe HttpStatusCode.Unauthorized
        }
    }

    "health permite lectura con viewer autenticado" {
        testApplication {
            application { module(testMode = true) }
            val response = client.get("/health") {
                header("Authorization", "Bearer test-key")
                header("X-Role", "viewer")
            }
            response.status shouldBe HttpStatusCode.OK
        }
    }

    "example post rechaza rol viewer" {
        testApplication {
            application { module(testMode = true) }
            val response = client.post("/api/v1/example") {
                contentType(ContentType.Application.Json)
                header("Authorization", "Bearer test-key")
                header("X-Role", "viewer")
                setBody("{\"name\":\"Visuarte\"}")
            }
            response.status shouldBe HttpStatusCode.Forbidden
        }
    }

    "legacy project route bloquea request sin credenciales" {
        testApplication {
            application { module(testMode = true) }

            val response = client.post("/api/v1/projects") {
                contentType(ContentType.Application.Json)
                setBody(
                    """
                    {
                      "nombre": "Legacy Demo",
                      "director": "PM Team",
                      "fecha_inicio": "2026-05-01",
                      "equipo": ["Diseño", "Backend"]
                    }
                    """.trimIndent()
                )
            }

            response.status shouldBe HttpStatusCode.Unauthorized
        }
    }

    "legacy project route permite editor autenticado" {
        testApplication {
            application { module(testMode = true) }

            val response = client.post("/api/v1/projects") {
                contentType(ContentType.Application.Json)
                header("Authorization", "Bearer test-key")
                header("X-Tenant-Id", "tenant-1")
                header("X-Role", "editor")
                setBody(
                    """
                    {
                      "nombre": "Legacy Demo",
                      "director": "PM Team",
                      "fecha_inicio": "2026-05-01",
                      "equipo": ["Diseño", "Backend"]
                    }
                    """.trimIndent()
                )
            }

            response.status shouldBe HttpStatusCode.OK
        }
    }
})
