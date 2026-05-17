package com.universal.api.project

import org.jetbrains.exposed.dao.*
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.transactions.transaction
import java.util.UUID

object ProjectService {

    /**
     * Get all projects from the database.
     * @return List of Project entities
     */
    fun getAllProjects(): List<Project> = transaction {
        Projects.selectAll().map { it.toEntity() }
    }

    /**
     * Get a project by its internal alias.
     * @param internalAlias The internal alias of the project (e.g., "p18_ref")
     * @return The Project entity if found, null otherwise
     */
    fun getProjectByAlias(internalAlias: String): Project? = transaction {
        Projects.select { Projects.internalAlias.eq(internalAlias) }.map { it.toEntity() }.firstOrNull()
    }

    /**
     * Get a project by its UUID ID.
     * @param id The UUID of the project
     * @return The Project entity if found, null otherwise
     */
    fun getProjectById(id: UUID): Project? = transaction {
        Projects.select { Projects.id.eq(id) }.map { it.toEntity() }.firstOrNull()
    }

    /**
     * Create a new project.
     * @param internalAlias The internal alias (must be unique)
     * @param displayName The display name
     * @param absolutePath The absolute path on the server
     * @param status The status (default: 'active')
     * @param engineConfig The engine configuration as a JSON string (optional)
     * @return The created Project entity
     */
    fun createProject(
        internalAlias: String,
        displayName: String,
        absolutePath: String,
        status: String = "active",
        engineConfig: String? = null
    ): Project = transaction {
        Projects.insert {
            it[internalAlias] = internalAlias
            it[displayName] = displayName
            it[absolutePath] = absolutePath
            it[status] = status
            it[engineConfig] = engineConfig
        }.getId()
    }.let { getProjectById(it)!! }

    /**
     * Update an existing project.
     * @param id The UUID of the project to update
     * @param internalAlias The new internal alias (optional)
     * @param displayName The new display name (optional)
     * @param absolutePath The new absolute path (optional)
     * @param status The new status (optional)
     * @param engineConfig The new engine configuration (optional)
     * @return The updated Project entity if found, null otherwise
     */
    fun updateProject(
        id: UUID,
        internalAlias: String? = null,
        displayName: String? = null,
        absolutePath: String? = null,
        status: String? = null,
        engineConfig: String? = null
    ): Project? = transaction {
        Projects.update({ Projects.id.eq(id) }) {
            internalAlias?.let { it[Projects.internalAlias] = it }
            displayName?.let { it[Projects.displayName] = it }
            absolutePath?.let { it[Projects.absolutePath] = it }
            status?.let { it[Projects.status] = it }
            engineConfig?.let { it[Projects.engineConfig] = it }
        }
        getProjectById(id)
    }

    /**
     * Delete a project by its ID.
     * @param id The UUID of the project to delete
     * @return True if the project was deleted, false if not found
     */
    fun deleteProject(id: UUID): Boolean = transaction {
        Projects.deleteWhere { Projects.id.eq(id) } > 0
    }

    /**
     * Archive a project by setting its status to 'archived'.
     * @param id The UUID of the project to archive
     * @return The updated Project entity if found, null otherwise
     */
    fun archiveProject(id: UUID): Project? = updateProject(id, status = "archived")

    /**
     * Activate a project by setting its status to 'active'.
     * @param id The UUID of the project to activate
     * @return The updated Project entity if found, null otherwise
     */
    fun activateProject(id: UUID): Project? = updateProject(id, status = "active")
}