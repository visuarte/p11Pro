package main.kotlin.services

import main.kotlin.contracts.ShotContract
import main.kotlin.contracts.ShotCreate
import java.time.Instant
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap

object ShotService {
    private val store = ConcurrentHashMap<String, ShotContract>()

    fun list(projectId: String? = null, tenantId: String): List<ShotContract> =
        store.values
            .filter { s ->
                (projectId == null || s.projectId == projectId) &&
                s.tenantId == tenantId
            }
            .sortedBy { it.createdAt }

    fun getById(id: String, tenantId: String): ShotContract? =
        store[id]?.takeIf { it.tenantId == tenantId }

    fun create(cmd: ShotCreate): ShotContract {
        val shot = ShotContract(
            id = UUID.randomUUID().toString(),
            sceneNumber = cmd.sceneNumber,
            shotType = cmd.shotType,
            description = cmd.description,
            cameraMovement = cmd.cameraMovement,
            lens = cmd.lens,
            estimatedDuration = cmd.estimatedDuration,
            equipmentType = cmd.equipmentType,
            createdAt = Instant.now().toString(),
            projectId = cmd.projectId,
            tenantId = cmd.tenantId
        )
        store[shot.id] = shot
        return shot
    }

    fun update(id: String, cmd: ShotCreate, tenantId: String): ShotContract? {
        val existing = store[id]?.takeIf { it.tenantId == tenantId } ?: return null
        val updated = existing.copy(
            sceneNumber = cmd.sceneNumber,
            shotType = cmd.shotType,
            description = cmd.description,
            cameraMovement = cmd.cameraMovement,
            lens = cmd.lens,
            estimatedDuration = cmd.estimatedDuration,
            equipmentType = cmd.equipmentType
        )
        store[id] = updated
        return updated
    }

    fun delete(id: String, tenantId: String): Boolean {
        val existing = store[id] ?: return false
        if (existing.tenantId != tenantId) return false
        return store.remove(id) != null
    }

    /** Útil en tests para aislar estado entre specs. */
    internal fun clearAll() { store.clear() }
}

