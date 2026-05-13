package main.kotlin.utils

import java.time.LocalDateTime
import java.util.UUID

// Placeholder para la entidad AuditLog (debería mapearse a la entidad real de la base de datos)
data class AuditLog(
    val id: String,
    val entityType: String,
    val entitySubtype: String? = null,
    val entityId: String,
    val action: String,
    val userId: String,
    val changesJson: Map<String, Any?>? = null,
    val relatedCharacterId: String? = null,
    val relatedSceneOrDay: String? = null,
    val photoEvidenceUrl: String? = null,
    val comment: String? = null,
    val timestamp: LocalDateTime = LocalDateTime.now()
)

fun logAudit(
    entityType: String,
    entitySubtype: String? = null,
    entityId: String,
    action: String,
    userId: String,
    changes: Map<String, Any?>? = null,
    relatedCharacterId: String? = null,
    relatedSceneOrDay: String? = null,
    photoEvidenceUrl: String? = null,
    comment: String? = null
): AuditLog {
    return AuditLog(
        id = UUID.randomUUID().toString(),
        entityType = entityType,
        entitySubtype = entitySubtype,
        entityId = entityId,
        action = action,
        userId = userId,
        changesJson = changes,
        relatedCharacterId = relatedCharacterId,
        relatedSceneOrDay = relatedSceneOrDay,
        photoEvidenceUrl = photoEvidenceUrl,
        comment = comment,
        timestamp = LocalDateTime.now()
    )
}

// Nota: La persistencia debe implementarse usando el ORM o framework de persistencia elegido en Kotlin.