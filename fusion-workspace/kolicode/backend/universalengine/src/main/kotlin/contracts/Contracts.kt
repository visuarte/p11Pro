package main.kotlin.contracts

import java.time.LocalDateTime
import kotlinx.serialization.Serializable

// --- Contratos para ShotService ---
@Serializable
data class ShotContract(
    val id: String,
    val sceneNumber: String,
    val shotType: String,
    val description: String,
    val cameraMovement: String,
    val lens: String,
    val estimatedDuration: Int,
    val equipmentType: String,
    val createdAt: String,
    val projectId: String,
    val tenantId: String
)

@Serializable
data class ShotCreate(
    val sceneNumber: String,
    val shotType: String,
    val description: String,
    val cameraMovement: String,
    val lens: String,
    val estimatedDuration: Int,
    val equipmentType: String,
    val tenantId: String,
    val projectId: String
)

@Serializable
data class CrewMemberContract(
    val id: String,
    val name: String,
    val department: String,
    val position: String,
    val status: String,
    val dailyRate: Double,
    val notes: String = "",
    val createdAt: String = "",
    val projectId: String,
    val tenantId: String
)

@Serializable
data class CrewMemberCreate(
    val name: String,
    val department: String,
    val position: String,
    val email: String = "",
    val phone: String = "",
    val tenantId: String,
    val projectId: String? = null
)
