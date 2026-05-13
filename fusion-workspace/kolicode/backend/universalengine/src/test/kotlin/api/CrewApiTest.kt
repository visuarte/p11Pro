package main.kotlin.api

import io.kotest.core.spec.style.StringSpec
import io.kotest.matchers.shouldBe
import io.kotest.matchers.shouldNotBe
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import io.ktor.server.testing.*
import kotlinx.serialization.json.*
import main.kotlin.services.CrewService

class CrewApiTest : StringSpec({

    beforeEach { CrewService.clearAll() }

    "POST /api/v1/crew crea un miembro y devuelve 201" {
        testApplication {
            application { module(testMode = true) }
            val response = client.post("/api/v1/crew") {
                contentType(ContentType.Application.Json)
                header("X-Tenant-Id", "tenant-1")
                setBody(
                    """
                    {
                        "name": "María García",
                        "department": "Dirección",
                        "position": "Directora",
                        "email": "maria@cineops.mx",
                        "phone": "5551234567",
                        "tenantId": "tenant-1",
                        "projectId": "proj-1"
                    }
                    """.trimIndent()
                )
            }
            response.status shouldBe HttpStatusCode.Created
            val body = Json.parseToJsonElement(response.bodyAsText()).jsonObject
            body["id"] shouldNotBe null
            body["name"]?.jsonPrimitive?.content shouldBe "María García"
            body["department"]?.jsonPrimitive?.content shouldBe "Dirección"
            body["status"]?.jsonPrimitive?.content shouldBe "ACTIVE"
        }
    }

    "GET /api/v1/crew lista miembros por proyecto" {
        testApplication {
            application { module(testMode = true) }
            repeat(3) { i ->
                client.post("/api/v1/crew") {
                    contentType(ContentType.Application.Json)
                    header("X-Tenant-Id", "t1")
                    setBody(
                        """{"name":"Persona $i","department":"Arte","position":"Asistente $i",
                           "tenantId":"t1","projectId":"proj-X"}"""
                    )
                }
            }
            // Uno en otro proyecto
            client.post("/api/v1/crew") {
                contentType(ContentType.Application.Json)
                header("X-Tenant-Id", "t1")
                setBody(
                    """{"name":"Externo","department":"Sonido","position":"Operador",
                       "tenantId":"t1","projectId":"proj-Y"}"""
                )
            }

            val response = client.get("/api/v1/crew?projectId=proj-X") {
                header("X-Tenant-Id", "t1")
            }
            response.status shouldBe HttpStatusCode.OK
            Json.parseToJsonElement(response.bodyAsText()).jsonArray.size shouldBe 3
        }
    }

    "GET /api/v1/crew/{id} devuelve el miembro o 404" {
        testApplication {
            application { module(testMode = true) }
            val create = client.post("/api/v1/crew") {
                contentType(ContentType.Application.Json)
                header("X-Tenant-Id", "t1")
                setBody(
                    """{"name":"Luis Méndez","department":"Fotografía","position":"Director de Fotografía",
                       "tenantId":"t1","projectId":"p1"}"""
                )
            }
            val id = Json.parseToJsonElement(create.bodyAsText()).jsonObject["id"]!!.jsonPrimitive.content

            client.get("/api/v1/crew/$id") { header("X-Tenant-Id", "t1") }.status shouldBe HttpStatusCode.OK
            client.get("/api/v1/crew/id-inexistente") { header("X-Tenant-Id", "t1") }.status shouldBe HttpStatusCode.NotFound
        }
    }

    "PUT /api/v1/crew/{id} actualiza el miembro" {
        testApplication {
            application { module(testMode = true) }
            val create = client.post("/api/v1/crew") {
                contentType(ContentType.Application.Json)
                header("X-Tenant-Id", "t1")
                setBody(
                    """{"name":"Original","department":"Producción","position":"Coordinador",
                       "tenantId":"t1","projectId":"p1"}"""
                )
            }
            val id = Json.parseToJsonElement(create.bodyAsText()).jsonObject["id"]!!.jsonPrimitive.content

            val update = client.put("/api/v1/crew/$id") {
                contentType(ContentType.Application.Json)
                header("X-Tenant-Id", "t1")
                setBody(
                    """{"name":"Actualizado","department":"Producción","position":"Productor",
                       "tenantId":"t1","projectId":"p1"}"""
                )
            }
            update.status shouldBe HttpStatusCode.OK
            val body = Json.parseToJsonElement(update.bodyAsText()).jsonObject
            body["name"]?.jsonPrimitive?.content shouldBe "Actualizado"
            body["position"]?.jsonPrimitive?.content shouldBe "Productor"
        }
    }

    "DELETE /api/v1/crew/{id} elimina el miembro" {
        testApplication {
            application { module(testMode = true) }
            val create = client.post("/api/v1/crew") {
                contentType(ContentType.Application.Json)
                header("X-Tenant-Id", "t1")
                setBody(
                    """{"name":"A Borrar","department":"Arte","position":"Asistente",
                       "tenantId":"t1","projectId":"p1"}"""
                )
            }
            val id = Json.parseToJsonElement(create.bodyAsText()).jsonObject["id"]!!.jsonPrimitive.content

            client.delete("/api/v1/crew/$id") { header("X-Tenant-Id", "t1") }.status shouldBe HttpStatusCode.OK
            client.delete("/api/v1/crew/$id") { header("X-Tenant-Id", "t1") }.status shouldBe HttpStatusCode.NotFound
        }
    }

    "aislamiento tenant: un tenant no puede leer miembro de otro tenant" {
        testApplication {
            application { module(testMode = true) }
            val create = client.post("/api/v1/crew") {
                contentType(ContentType.Application.Json)
                header("X-Tenant-Id", "t1")
                setBody(
                    """{"name":"Privado","department":"Arte","position":"Lead","tenantId":"t1","projectId":"p1"}"""
                )
            }
            val id = Json.parseToJsonElement(create.bodyAsText()).jsonObject["id"]!!.jsonPrimitive.content

            client.get("/api/v1/crew/$id") { header("X-Tenant-Id", "t1") }.status shouldBe HttpStatusCode.OK
            client.get("/api/v1/crew/$id") { header("X-Tenant-Id", "t2") }.status shouldBe HttpStatusCode.NotFound
        }
    }
})

