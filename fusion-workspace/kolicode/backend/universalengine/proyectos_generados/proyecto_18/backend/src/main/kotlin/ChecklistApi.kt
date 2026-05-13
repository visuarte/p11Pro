package com.generated.ciberpunk

import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.http.*
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.transactions.transaction
import org.jetbrains.exposed.sql.Database

@Serializable
data class CreateChecklistResponse(val id: Int, val status: String = "created")

fun Route.checklistRoutes() {
    post("/api/v1/checklist") {
        val estado = call.receiveText()
        val id = transaction {
            ChecklistEstado.insert {
                it[ChecklistEstado.estado] = estado
            } get ChecklistEstado.id
        }
        call.respond(HttpStatusCode.Created, CreateChecklistResponse(id = id))
    }
    get("/api/v1/checklist/{id}") {
        val id = call.parameters["id"]?.toIntOrNull()
        if (id == null) {
            call.respond(HttpStatusCode.BadRequest, "ID inválido")
            return@get
        }
        val estado = transaction {
            ChecklistEstado.select { ChecklistEstado.id eq id }
                .map { it[ChecklistEstado.estado] }
                .firstOrNull()
        }
        if (estado == null) {
            call.respond(HttpStatusCode.NotFound, "No encontrado")
        } else {
            call.respondText(estado, ContentType.Application.Json)
        }
    }
}
