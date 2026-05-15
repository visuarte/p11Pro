package com.generated.ciberpunk

import io.ktor.client.request.header
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.HttpHeaders
import io.ktor.http.HttpStatusCode
import io.ktor.http.contentType
import io.ktor.server.testing.testApplication
import kotlin.io.path.createTempDirectory
import kotlin.io.path.deleteIfExists
import kotlin.io.path.writeText
import kotlin.test.AfterTest
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class KotguaicliApiTest {
    private val managedProperties = listOf(
        "SKIP_DB_INIT",
        "KOTGUAICLI_AUTH_TOKEN",
        "KOTGUAICLI_PATH"
    )

    private fun deleteRecursively(path: java.nio.file.Path) {
        path.toFile().deleteRecursively()
    }

    @AfterTest
    fun cleanup() {
        managedProperties.forEach(System::clearProperty)
        java.io.File("tmp/kotguaicli-serves.json").delete()
    }

    @Test
    fun `kotguaicli endpoints require auth when token configured`() = testApplication {
        System.setProperty("SKIP_DB_INIT", "1")
        System.setProperty("KOTGUAICLI_AUTH_TOKEN", "secret-token")

        application { module() }

        val response = client.post("/api/v1/kotguaicli/generate-docs")

        assertEquals(HttpStatusCode.Unauthorized, response.status)
        assertTrue(response.bodyAsText().contains("missing or invalid auth token"))
    }

    @Test
    fun `generate docs executes configured gradle wrapper`() = testApplication {
        val kotDir = createTempDirectory("kotguaicli-test")
        val gradlew = kotDir.resolve("gradlew")
        gradlew.writeText(
            """
            #!/bin/sh
            echo generated-docs
            exit 0
            """.trimIndent()
        )
        gradlew.toFile().setExecutable(true)

        System.setProperty("SKIP_DB_INIT", "1")
        System.setProperty("KOTGUAICLI_AUTH_TOKEN", "secret-token")
        System.setProperty("KOTGUAICLI_PATH", kotDir.toString())

        application { module() }

        val response = client.post("/api/v1/kotguaicli/generate-docs") {
            header("X-KOTGUAICLI-AUTH", "secret-token")
        }

        assertEquals(HttpStatusCode.OK, response.status)
        assertTrue(response.bodyAsText().contains("generated-docs"))

        gradlew.deleteIfExists()
        deleteRecursively(kotDir)
    }

    @Test
    fun `serve docs lifecycle can be started and stopped`() = testApplication {
        val kotDir = createTempDirectory("kotguaicli-serve-test")
        val gradlew = kotDir.resolve("gradlew")
        gradlew.writeText(
            """
            #!/bin/sh
            if [ "$1" = "serveDocs" ]; then
              sleep 30
              exit 0
            fi
            echo generated-docs
            exit 0
            """.trimIndent()
        )
        gradlew.toFile().setExecutable(true)

        System.setProperty("SKIP_DB_INIT", "1")
        System.setProperty("KOTGUAICLI_AUTH_TOKEN", "secret-token")
        System.setProperty("KOTGUAICLI_PATH", kotDir.toString())

        application { module() }

        val startResponse = client.post("/api/v1/kotguaicli/serve-docs") {
            header("X-KOTGUAICLI-AUTH", "secret-token")
            contentType(ContentType.Application.Json)
            setBody("""{"port": 8099}""")
        }
        assertEquals(HttpStatusCode.Accepted, startResponse.status)
        val startBody = startResponse.bodyAsText()
        val id = Regex(""""id"\s*:\s*"([^"]+)"""").find(startBody)?.groupValues?.get(1)
        assertTrue(!id.isNullOrBlank())

        val stopResponse = client.post("/api/v1/kotguaicli/stop") {
            header("X-KOTGUAICLI-AUTH", "secret-token")
            header(HttpHeaders.ContentType, ContentType.Application.Json.toString())
            setBody("""{"id":"$id"}""")
        }
        assertEquals(HttpStatusCode.OK, stopResponse.status)

        gradlew.deleteIfExists()
        deleteRecursively(kotDir)
    }
}
