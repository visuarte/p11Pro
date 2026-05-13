package main.kotlin.services

import main.kotlin.contracts.CrewMemberContract
import main.kotlin.contracts.CrewMemberCreate
import java.time.Instant
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap

object CrewService {
    private val store = ConcurrentHashMap<String, CrewMemberContract>()

    fun list(projectId: String? = null, tenantId: String): List<CrewMemberContract> =
        store.values
            .filter { m ->
                (projectId == null || m.projectId == projectId) &&
                m.tenantId == tenantId
            }
            .sortedBy { it.createdAt }

    fun getById(id: String, tenantId: String): CrewMemberContract? =
        store[id]?.takeIf { it.tenantId == tenantId }

    fun create(cmd: CrewMemberCreate): CrewMemberContract {
        val member = CrewMemberContract(
            id = UUID.randomUUID().toString(),
            name = cmd.name,
            department = cmd.department,
            position = cmd.position,
            status = "ACTIVE",
            dailyRate = 0.0,
            notes = "",
            createdAt = Instant.now().toString(),
            projectId = cmd.projectId ?: "",
            tenantId = cmd.tenantId
        )
        store[member.id] = member
        return member
    }

    fun update(id: String, cmd: CrewMemberCreate, tenantId: String): CrewMemberContract? {
        val existing = store[id]?.takeIf { it.tenantId == tenantId } ?: return null
        val updated = existing.copy(
            name = cmd.name,
            department = cmd.department,
            position = cmd.position,
            projectId = cmd.projectId ?: existing.projectId
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

