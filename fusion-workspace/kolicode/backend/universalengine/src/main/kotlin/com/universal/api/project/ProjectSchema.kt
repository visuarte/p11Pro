package com.universal.api.project

import org.jetbrains.exposed.dao.id.UUIDIdTable
import org.jetbrains.exposed.dao.id.UUIDLongIdTable
import org.jetbrains.exposed.sql.SchemaUtils
import java.util.UUID

object Projects : UUIDIdTable<Project>() {
    override val schemaName = "kolicode"
    override val name = "projects"

    override val id = uuid("id").primaryKey()
    val internalAlias = varchar("internal_alias", 50).uniqueIndex()
    val displayName = varchar("display_name", 255)
    val absolutePath = varchar("absolute_path")
    val status = varchar("status", 20)
    val engineConfig = json("engine_config")
    val createdAt = timestamp("created_at")
    val updatedAt = timestamp("updated_at")
}

class Project(id: EntityID<UUID>) : UUIDIdTableEntity(id) {
    companion object : UUIDIdEntityCompanion<Project, Projects>(Projects)

    val internalAlias: String
        get() = get(Projects.internalAlias)
    val displayName: String
        get() = get(Projects.displayName)
    val absolutePath: String
        get() = get(Projects.absolutePath)
    val status: String
        get() = get(Projects.status)
    val engineConfig: Any?
        get() = get(Projects.engineConfig)
    val createdAt: java.time.OffsetDateTime
        get() = get(Projects.createdAt)
    val updatedAt: java.time.OffsetDateTime
        get() = get(Projects.updatedAt)
}

fun SchemaUtils.createProjectTableIfNotExists() {
    SchemaUtils.createIfNotExists(Projects)
}