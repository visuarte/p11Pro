package main.kotlin.api

import io.kotest.core.spec.style.StringSpec
import io.kotest.matchers.shouldBe
import io.kotest.matchers.shouldNotBe
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import io.ktor.server.testing.*
import kotlinx.serialization.json.*
import main.kotlin.services.ShotService

class ShotApiTest : StringSpec({

    beforeEach { ShotService.clearAll() }

    "POST /api/v1/shots crea un shot y devuelve 201" {
        testApplication {
            application { module(testMode = true) }
            val response = client.post("/api/v1/shots") {
                contentType(ContentType.Application.Json)
                header("X-Tenant-Id", "tenant-1")
                setBody(
                    """
                    {
                        "sceneNumber": "01",
                        "shotType": "WIDE",
                        "description": "Plano general del set",
                        "cameraMovement": "STATIC",
                        "lens": "35mm",
                        "estimatedDuration": 5,
                        "equipmentType": "ARRI ALEXA",
                        "tenantId": "tenant-1",
                        "projectId": "proj-1"
                    }
                    """.trimIndent()
                )
            }
            response.status shouldBe HttpStatusCode.Created
            val body = Json.parseToJsonElement(response.bodyAsText()).jsonObject
            body["id"] shouldNotBe null
            body["sceneNumber"]?.jsonPrimitive?.content shouldBe "01"
            body["shotType"]?.jsonPrimitive?.content shouldBe "WIDE"
            body["projectId"]?.jsonPrimitive?.content shouldBe "proj-1"
            body["estado"] shouldBe null // campo no existente — no debe filtrarse
        }
    }

    "GET /api/v1/shots lista shots por proyecto" {
        testApplication {
            application { module(testMode = true) }
            // Crear dos shots
            repeat(2) { i ->
                client.post("/api/v1/shots") {
                    contentType(ContentType.Application.Json)
                    header("X-Tenant-Id", "t1")
                    setBody(
                        """{"sceneNumber":"0$i","shotType":"CLOSE","description":"Desc $i",
                           "cameraMovement":"PAN","lens":"50mm","estimatedDuration":3,
                           "equipmentType":"RED","tenantId":"t1","projectId":"proj-A"}"""
                    )
                }
            }
            // Crear uno en otro proyecto
            client.post("/api/v1/shots") {
                contentType(ContentType.Application.Json)
                header("X-Tenant-Id", "t1")
                setBody(
                    """{"sceneNumber":"99","shotType":"MEDIUM","description":"Otro",
                       "cameraMovement":"TILT","lens":"85mm","estimatedDuration":4,
                       "equipmentType":"SONY","tenantId":"t1","projectId":"proj-B"}"""
                )
            }

            val response = client.get("/api/v1/shots?projectId=proj-A") {
                header("X-Tenant-Id", "t1")
            }
            response.status shouldBe HttpStatusCode.OK
            val arr = Json.parseToJsonElement(response.bodyAsText()).jsonArray
            arr.size shouldBe 2
        }
    }

    "GET /api/v1/shots/{id} devuelve el shot o 404" {
        testApplication {
            application { module(testMode = true) }
            val create = client.post("/api/v1/shots") {
                contentType(ContentType.Application.Json)
                header("X-Tenant-Id", "t1")
                setBody(
                    """{"sceneNumber":"05","shotType":"INSERT","description":"Detalle prop",
                       "cameraMovement":"STATIC","lens":"100mm","estimatedDuration":2,
                       "equipmentType":"CANON","tenantId":"t1","projectId":"p1"}"""
                )
            }
            val id = Json.parseToJsonElement(create.bodyAsText()).jsonObject["id"]!!.jsonPrimitive.content

            val found = client.get("/api/v1/shots/$id") {
                header("X-Tenant-Id", "t1")
            }
            found.status shouldBe HttpStatusCode.OK

            val notFound = client.get("/api/v1/shots/id-inexistente") {
                header("X-Tenant-Id", "t1")
            }
            notFound.status shouldBe HttpStatusCode.NotFound
        }
    }

    "DELETE /api/v1/shots/{id} elimina el shot" {
        testApplication {
            application { module(testMode = true) }
            val create = client.post("/api/v1/shots") {
                contentType(ContentType.Application.Json)
                header("X-Tenant-Id", "t1")
                setBody(
                    """{"sceneNumber":"10","shotType":"POV","description":"Subjetiva",
                       "cameraMovement":"HANDHELD","lens":"24mm","estimatedDuration":3,
                       "equipmentType":"BMPCC","tenantId":"t1","projectId":"p1"}"""
                )
            }
            val id = Json.parseToJsonElement(create.bodyAsText()).jsonObject["id"]!!.jsonPrimitive.content

            val del = client.delete("/api/v1/shots/$id") {
                header("X-Tenant-Id", "t1")
            }
            del.status shouldBe HttpStatusCode.OK
            Json.parseToJsonElement(del.bodyAsText()).jsonObject["status"]?.jsonPrimitive?.content shouldBe "DELETED"

            // Segunda vez → 404
            client.delete("/api/v1/shots/$id") { header("X-Tenant-Id", "t1") }.status shouldBe HttpStatusCode.NotFound
        }
    }
})

