package com.generated.ciberpunk

import org.jetbrains.exposed.sql.Table

object ChecklistEstado : Table("checklist_estado") {
    val id = integer("id").autoIncrement()
    val estado = text("estado") // JSON serializado
    override val primaryKey = PrimaryKey(id)
}