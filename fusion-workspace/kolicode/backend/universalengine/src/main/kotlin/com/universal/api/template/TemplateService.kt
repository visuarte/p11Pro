package com.universal.api.template

import com.universal.api.project.Project
import com.universal.api.project.ProjectService
import org.jetbrains.exposed.dao.*
import org.jetbrains.exposed.sql.transactions.transaction
import java.io.File
import java.nio.file.Files
import java.nio.file.Path
import java.util.UUID

/**
 * Service for validating and creating projects based on templates.
 */
object TemplateService {

    /**
     * Validates a project directory against a template.
     * @param projectDir The path to the project directory to validate.
     * @param templateKey The key of the template to validate against (e.g., "kolicode-boilerplate-v1").
     * @return A list of validation errors, empty if the project is valid.
     */
    fun validateProjectAgainstTemplate(projectDir: Path, templateKey: String): List<String> {
        val errors = mutableListOf<String>()

        // Check if the directory exists
        if (!Files.exists(projectDir)) {
            errors.add("Project directory does not exist: $projectDir")
            return errors
        }

        // Get the template from the database
        val template = getTemplate(templateKey) ?: return listOf("Template not found: $templateKey")

        // Validate required folders
        val requiredFolders = template.structureJson["folders"] as? List<*> ?: emptyList()
        for (folder in requiredFolders) {
            val folderPath = projectDir.resolve(folder.toString())
            if (!Files.exists(folderPath) || !Files.isDirectory(folderPath)) {
                errors.add("Missing required folder: $folder")
            }
        }

        // Validate required files
        val requiredFiles = template.structureJson["required_files"] as? List<*> ?: emptyList()
        for (file in requiredFiles) {
            val filePath = projectDir.resolve(file.toString())
            if (!Files.exists(filePath) || !Files.isRegularFile(filePath)) {
                errors.add("Missing required file: $file")
            }
        }

        // TODO: Validate backend and frontend specific structure if present in the template

        return errors
    }

    /**
     * Creates a new project from a template.
     * @param templateKey The key of the template to use.
     * @param projectName The name of the new project.
     * @param clientName The client name for the project.
     * @param taskName The task name for the project.
     * @param description The project description.
     * @param dependencies The list of dependency keys.
     * @param timeline The list of milestone create requests.
     * @param useThreeJsInterop Whether to use three.js interop.
     * @param enableTailwindDirectives Whether to enable tailwind directives.
     * @param creativeEngine The creative engine (if applicable).
     * @param runtime The runtime (if applicable).
     * @param tags The list of tags.
     * @param preview The preview URL or path.
     * @param domainSpec The domain specification.
     * @param uiPreset The UI preset.
     * @param uiTooling The list of UI tooling.
     * @param enableA11yChecks Whether to enable accessibility checks.
     * @param enableVisualRegression Whether to enable visual regression.
     * @param useThreeJsInterop Whether to use three.js interop.
     * @return The created project.
     */
    fun createProjectFromTemplate(
        templateKey: String,
        projectName: String,
        clientName: String = "",
        taskName: String = "",
        description: String? = null,
        dependencies: List<String> = emptyList(),
        timeline: List<MilestoneCreateRequest> = emptyList(),
        useThreeJsInterop: Boolean = false,
        enableTailwindDirectives: Boolean = false,
        creativeEngine: CreativeEngine? = null,
        runtime: String? = null,
        tags: List<String> = emptyList(),
        preview: String? = null,
        domainSpec: DomainSpec = DomainSpec(),
        uiPreset: String = "modern-saas",
        uiTooling: List<String> = emptyList(),
        enableA11yChecks: Boolean = false,
        enableVisualRegression: Boolean = false
    ): Project {
        // Get the template
        val template = getTemplate(templateKey) ?: throw IllegalArgumentException("Template not found: $templateKey")

        // Use the template's engine profile and structure as defaults if not provided
        val finalEngineProfile = template.engineProfile
        val finalStructureJson = template.structureJson

        // TODO: Merge template defaults with provided parameters

        // For now, we'll use the existing project creation flow but we need to set the base directory
        // from the template or from the configuration.

        // This is a placeholder: we would need to integrate with the existing project creation process.
        // Since the task is to standardize the template, we assume that the template provides the
        // structure and the project creation service uses it.

        // We'll throw an exception indicating that this is a placeholder.
        throw UnsupportedOperationException("Template-based project creation is not yet fully implemented. " +
                "This service validates templates but creation requires integration with ProjectService.")
    }

    /**
     * Gets a template by its key.
     * @param templateKey The key of the template.
     * @return The template if found, null otherwise.
     */
    private fun getTemplate(templateKey: String): Template? = transaction {
        ProjectTemplates.select { ProjectTemplates.templateKey.eq(templateKey) }.map { it.toEntity() }.firstOrNull()
    }

    /**
     * Converts a TemplateEntity to a Template object.
     * This is a simple data class for holding template data.
     */
    private data class Template(
        val id: UUID,
        val templateKey: String,
        val displayName: String,
        val description: String?,
        val structureJson: Any, // In reality, this would be a parsed JSON structure, but we keep it as Any for simplicity.
        val engineProfile: Any?, // Similarly, this would be a JSON object.
        val isActive: Boolean,
        val createdAt: java.time.OffsetDateTime,
        val updatedAt: java.time.OffsetDateTime
    )

    /**
     * Converts a ProjectTemplates entity to a Template object.
     */
    private fun ProjectTemplates.toEntity(): Template {
        return Template(
            id = id,
            templateKey = templateKey,
            displayName = displayName,
            description = description,
            structureJson = structureJson.getValue(),
            engineProfile = engineProfile?.getValue(),
            isActive = isActive,
            createdAt = createdAt,
            updatedAt = updatedAt
        )
    }
}