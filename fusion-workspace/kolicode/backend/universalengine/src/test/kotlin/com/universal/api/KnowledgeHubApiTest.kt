package com.universal.api

import io.kotest.core.spec.style.StringSpec
import io.kotest.matchers.doubles.shouldBeGreaterThanOrEqual
import io.kotest.matchers.shouldBe
import io.kotest.matchers.string.shouldContain
import io.ktor.client.request.*
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.HttpStatusCode
import io.ktor.http.contentType
import io.ktor.server.testing.testApplication
import java.util.Base64
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.double
import kotlinx.serialization.json.int
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive

class KnowledgeHubApiTest : StringSpec({

    "GET /api/v1/capabilities expone knowledge hub y politica mixta" {
        testApplication {
            application { module(testMode = true) }

            val response = client.get("/api/v1/capabilities")
            response.status shouldBe HttpStatusCode.OK

            val body = response.bodyAsText()
            body shouldContain "\"knowledgeHubEnabled\""
            body shouldContain "\"groundedPolicyMode\":\"mixed\""
            body shouldContain "\"knowledgeSourceFormats\""
        }
    }

    "POST /api/v1/knowledge/sources registra fuente basica y devuelve chunks" {
        testApplication {
            application { module(testMode = true) }

            val response = client.post("/api/v1/knowledge/sources") {
                contentType(ContentType.Application.Json)
                setBody(
                    """
                    {
                      "name": "runbook-motor",
                      "type": "md",
                      "content": "El motor universal crea proyectos y valida contratos HTTP JSON.",
                      "tags": ["runbook", "motor"]
                    }
                    """.trimIndent()
                )
            }

            response.status shouldBe HttpStatusCode.Created
            val json = Json.parseToJsonElement(response.bodyAsText()).jsonObject
            json["status"]?.jsonPrimitive?.content shouldBe "CREATED"
            val payload = json["payload"]?.jsonObject
            payload?.get("name")?.jsonPrimitive?.content shouldBe "runbook-motor"
            payload?.get("chunkCount")?.jsonPrimitive?.int?.let { it >= 1 } shouldBe true
        }
    }

    "POST /api/v1/knowledge/query devuelve respuesta grounded con citas y confidence" {
        testApplication {
            application { module(testMode = true) }

            val sourceResponse = client.post("/api/v1/knowledge/sources") {
                contentType(ContentType.Application.Json)
                setBody(
                    """
                    {
                      "name": "dominio-core",
                      "type": "txt",
                      "content": "DomainSpec contiene functionalRequirements, useCases, dataModel y requiredApis.",
                      "tags": ["domainSpec"]
                    }
                    """.trimIndent()
                )
            }
            sourceResponse.status shouldBe HttpStatusCode.Created
            val sourceJson = Json.parseToJsonElement(sourceResponse.bodyAsText()).jsonObject
            val sourceId = sourceJson["payload"]!!.jsonObject["id"]!!.jsonPrimitive.int

            val queryResponse = client.post("/api/v1/knowledge/query") {
                contentType(ContentType.Application.Json)
                setBody(
                    """
                    {
                      "query": "Que incluye domainSpec para crear proyectos?",
                      "sourceIds": [$sourceId],
                      "intent": "assist"
                    }
                    """.trimIndent()
                )
            }

            queryResponse.status shouldBe HttpStatusCode.OK
            val queryJson = Json.parseToJsonElement(queryResponse.bodyAsText()).jsonObject
            queryJson["status"]?.jsonPrimitive?.content shouldBe "SUCCESS"

            val payload = queryJson["payload"]!!.jsonObject
            payload["confidence"]!!.jsonPrimitive.double shouldBeGreaterThanOrEqual 0.8
            payload["citations"]!!.jsonArray.size shouldBe 1
            payload["policy"]!!.jsonObject["enforcement"]!!.jsonPrimitive.content shouldBe "assisted"
        }
    }

    "POST /api/v1/knowledge/sources valida PDF con capa de texto y rechaza PDF vacio" {
        testApplication {
            application { module(testMode = true) }

            val validPdfBase64 = buildPdfBase64("DomainSpec y APIs requeridas para scaffolding")
            val okResponse = client.post("/api/v1/knowledge/sources") {
                contentType(ContentType.Application.Json)
                setBody(
                    """
                    {
                      "name": "spec-pdf",
                      "type": "pdf",
                      "content": "$validPdfBase64"
                    }
                    """.trimIndent()
                )
            }
            okResponse.status shouldBe HttpStatusCode.Created

            val blankPdfBase64 = buildPdfBase64("")
            val badResponse = client.post("/api/v1/knowledge/sources") {
                contentType(ContentType.Application.Json)
                setBody(
                    """
                    {
                      "name": "blank-pdf",
                      "type": "pdf",
                      "content": "$blankPdfBase64"
                    }
                    """.trimIndent()
                )
            }

            badResponse.status shouldBe HttpStatusCode.BadRequest
            badResponse.bodyAsText() shouldContain "extractable text layer"
        }
    }

    "POST /api/v1/projects/init-from-knowledge crea proyecto cuando hay evidencia estricta" {
        testApplication {
            application { module(testMode = true) }

            val sourceResponse = client.post("/api/v1/knowledge/sources") {
                contentType(ContentType.Application.Json)
                setBody(
                    """
                    {
                      "name": "analysis-doc",
                      "type": "md",
                      "content": "El proyecto requiere autenticacion por roles, CRUD y endpoint POST /api/v1/auth/login."
                    }
                    """.trimIndent()
                )
            }
            sourceResponse.status shouldBe HttpStatusCode.Created
            val sourceId = Json.parseToJsonElement(sourceResponse.bodyAsText()).jsonObject["payload"]!!
                .jsonObject["id"]!!.jsonPrimitive.int

            val createResponse = client.post("/api/v1/projects/init-from-knowledge") {
                contentType(ContentType.Application.Json)
                setBody(
                    """
                    {
                      "name": "Proyecto Grounded",
                      "query": "proyecto requiere autenticacion roles crud endpoint auth login",
                      "sourceIds": [$sourceId],
                      "profile": "static",
                      "cliente": "Acme",
                      "tarea": "MVP"
                    }
                    """.trimIndent()
                )
            }

            val createBody = createResponse.bodyAsText()
            if (createResponse.status != HttpStatusCode.Created) {
                error("init-from-knowledge unexpected status=${createResponse.status} body=$createBody")
            }
            val payload = Json.parseToJsonElement(createBody).jsonObject["payload"]!!.jsonObject
            (payload["projectId"]!!.jsonPrimitive.int >= 1) shouldBe true
            (payload["citations"]!!.jsonPrimitive.int >= 1) shouldBe true
        }
    }
})

private fun buildPdfBase64(text: String): String {
    val escaped = text
        .replace("\\", "\\\\")
        .replace("(", "\\(")
        .replace(")", "\\)")

    val streamContent = if (escaped.isBlank()) {
        "BT ET"
    } else {
        "BT /F1 12 Tf 72 720 Td ($escaped) Tj ET"
    }

    val objects = mutableListOf<String>()
    objects += "<< /Type /Catalog /Pages 2 0 R >>"
    objects += "<< /Type /Pages /Kids [3 0 R] /Count 1 >>"
    objects += "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>"
    objects += "<< /Length ${streamContent.toByteArray(Charsets.US_ASCII).size} >>\nstream\n$streamContent\nendstream"
    objects += "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"

    val sb = StringBuilder()
    sb.append("%PDF-1.4\n")
    val offsets = mutableListOf<Int>()
    objects.forEachIndexed { index, obj ->
        offsets += sb.toString().toByteArray(Charsets.US_ASCII).size
        sb.append("${index + 1} 0 obj\n")
        sb.append(obj)
        sb.append("\nendobj\n")
    }

    val xrefStart = sb.toString().toByteArray(Charsets.US_ASCII).size
    sb.append("xref\n")
    sb.append("0 ${objects.size + 1}\n")
    sb.append("0000000000 65535 f \n")
    offsets.forEach { offset -> sb.append(String.format("%010d 00000 n \n", offset)) }
    sb.append("trailer\n")
    sb.append("<< /Size ${objects.size + 1} /Root 1 0 R >>\n")
    sb.append("startxref\n")
    sb.append("$xrefStart\n")
    sb.append("%%EOF")

    return Base64.getEncoder().encodeToString(sb.toString().toByteArray(Charsets.US_ASCII))
}

