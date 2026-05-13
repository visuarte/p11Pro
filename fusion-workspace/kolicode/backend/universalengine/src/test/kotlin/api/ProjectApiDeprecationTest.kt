package main.kotlin.api

import io.kotest.core.spec.style.StringSpec
import io.kotest.matchers.shouldBe
import io.ktor.client.request.*
import io.ktor.http.*
import io.ktor.server.testing.testApplication

class ProjectApiDeprecationTest : StringSpec({
    "POST /api/v1/projects legacy expone headers de deprecacion" {
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

            response.status shouldBe HttpStatusCode.OK
            response.headers["Deprecation"] shouldBe "true"
            response.headers["Sunset"] shouldBe "2026-10-06T00:00:00Z"
        }
    }
})

