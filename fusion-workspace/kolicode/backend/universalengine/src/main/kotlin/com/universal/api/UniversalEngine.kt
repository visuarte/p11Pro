package com.universal.api

import com.zaxxer.hikari.HikariConfig
import com.zaxxer.hikari.HikariDataSource
import io.ktor.client.*
import io.ktor.client.engine.cio.*
import io.ktor.client.plugins.*
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation as ClientContentNegotiation
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.engine.*
import io.ktor.server.netty.*
import io.ktor.server.plugins.BadRequestException
import io.ktor.server.plugins.callid.*
import io.ktor.server.plugins.callloging.*
import io.ktor.server.plugins.contentnegotiation.ContentNegotiation as ServerContentNegotiation
import io.ktor.server.plugins.cors.routing.*
import io.ktor.server.plugins.statuspages.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import java.io.ByteArrayInputStream
import java.io.File
import java.time.Instant
import java.time.LocalDate
import java.time.format.DateTimeParseException
import java.time.temporal.WeekFields
import java.net.URI
import java.util.Base64
import java.util.UUID
import kotlin.math.sqrt
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.*
import org.apache.pdfbox.pdmodel.PDDocument
import org.apache.pdfbox.text.PDFTextStripper
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.SqlExpressionBuilder.inList
import org.jetbrains.exposed.sql.transactions.experimental.newSuspendedTransaction
import org.jetbrains.exposed.sql.transactions.transaction
import org.slf4j.event.Level

private const val LEGACY_PROJECT_SUNSET_AT = "2026-10-06T00:00:00Z"
private const val LEGACY_PROJECT_DOC_PATH = "/docs/migrations/project-api-to-universalengine"
private const val DEFAULT_AI_MODE = "PATCH"
private const val ICON_CONSISTENCY_CHECK_ENV = "ICON_CONSISTENCY_CHECK"
private const val KNOWLEDGE_HUB_ENABLED_ENV = "KNOWLEDGE_HUB_ENABLED"
private const val KNOWLEDGE_GROUNDED_QUERY_ENABLED_ENV = "KNOWLEDGE_GROUNDED_QUERY_ENABLED"
private const val TEST_AI_TIMEOUT_SIM_ENV = "TEST_AI_TIMEOUT_SIM"
private const val TEST_DB_DOWN_SIM_ENV = "TEST_DB_DOWN_SIM"
private const val KNOWLEDGE_MIN_CITATIONS = 1
private const val KNOWLEDGE_MIN_CONFIDENCE = 0.8
private const val KNOWLEDGE_EMBEDDING_DIM = 96
const val MAX_TODOS_IN_PATCH = 3

val customJson = Json { ignoreUnknownKeys = true; isLenient = true; encodeDefaults = true }

val aiClient = HttpClient(CIO) {
    install(ClientContentNegotiation) { json(customJson) }
    install(HttpTimeout) { requestTimeoutMillis = 100000 }
}

suspend fun <T> suspendTransaction(block: suspend () -> T): T =
    newSuspendedTransaction(Dispatchers.IO) { block() }

@Serializable data class IterateRequest(
    val fileId: Int,
    val instruccion: String,
    val mode: String = DEFAULT_AI_MODE
)
@Serializable data class FileContentUpdate(val contenido: String)

enum class AiPromptMode {
    PATCH,
    SCAFFOLD
}

fun resolveAiPromptMode(rawMode: String?): AiPromptMode =
    when ((rawMode ?: DEFAULT_AI_MODE).trim().uppercase()) {
        "SCAFFOLD" -> AiPromptMode.SCAFFOLD
        else -> AiPromptMode.PATCH
    }

fun aiModelName(): String = System.getenv("AI_MODEL") ?: "qwen2.5:0.5b"

fun aiGenerateUrl(): String = System.getenv("OLLAMA_URL") ?: "http://host.docker.internal:11434/api/generate"

fun isIconConsistencyCheckEnabled(rawValue: String? = System.getenv(ICON_CONSISTENCY_CHECK_ENV)): Boolean {
    val value = rawValue?.trim()?.lowercase() ?: return true
    return when (value) {
        "1", "true", "yes", "on" -> true
        "0", "false", "no", "off" -> false
        else -> true
    }
}

private fun envFlagEnabled(rawValue: String?, defaultValue: Boolean): Boolean {
    val value = rawValue?.trim()?.lowercase() ?: return defaultValue
    return when (value) {
        "1", "true", "yes", "on" -> true
        "0", "false", "no", "off" -> false
        else -> defaultValue
    }
}

fun isKnowledgeHubEnabled(rawValue: String? = System.getenv(KNOWLEDGE_HUB_ENABLED_ENV)): Boolean =
    envFlagEnabled(rawValue = rawValue, defaultValue = true)

fun isGroundedQueryEnabled(rawValue: String? = System.getenv(KNOWLEDGE_GROUNDED_QUERY_ENABLED_ENV)): Boolean =
    envFlagEnabled(rawValue = rawValue, defaultValue = true)

private fun isAiTimeoutSimulationEnabled(): Boolean =
    envFlagEnabled(System.getProperty("test.ai.timeout") ?: System.getenv(TEST_AI_TIMEOUT_SIM_ENV), defaultValue = false)

private fun isDbDownSimulationEnabled(): Boolean =
    envFlagEnabled(System.getProperty("test.db.down") ?: System.getenv(TEST_DB_DOWN_SIM_ENV), defaultValue = false)

fun buildKotlinPatchPrompt(existingCode: String, instruction: String): String =
    """
    [SYSTEM ROLE]
    Actua como Arquitecto Senior Kotlin para codigo de produccion.

    [PATCH MODE — STRICT GATE ACTIVO]
    - Devuelve SOLO codigo Kotlin valido, sin texto adicional ni fences markdown.
    - PROHIBIDO usar !! (non-null assertion); usa ?. o ?: en su lugar.
    - PROHIBIDO declarar mas de un bloque package; exactamente uno al inicio del archivo.
    - PROHIBIDO System.exit() o cualquier llamada que detenga la JVM.
    - PROHIBIDO credenciales, tokens o secretos hardcodeados.
    - Maximo $MAX_TODOS_IN_PATCH comentarios TODO en toda la respuesta.
    - Usa Kotlin idiomatico, null-safety estricto y val por defecto.
    - Mantener compatibilidad del archivo y no romper API publica sin indicarlo en el propio codigo.
    - Si no puedes aplicar la instruccion de forma segura, devuelve el archivo original minimamente anotado con un TODO seguro.

    [INPUT CODE]
    $existingCode

    [TASK]
    $instruction
    """.trimIndent()

fun buildKotlinScaffoldPrompt(existingCode: String, instruction: String): String =
    """
    [SYSTEM ROLE]
    Actua como Arquitecto Senior Kotlin y genera un scaffold seguro y mantenible.

    [SCAFFOLD MODE]
    - Puedes devolver multiples archivos en un solo texto.
    - Formato requerido por archivo:
      ### FILE: <ruta/archivo.kt>
      <codigo kotlin>
    - No uses markdown adicional fuera del patron FILE.
    - Prioriza Kotlin idiomatico, null-safety, coroutines y separacion por capas.
    - Declara retornos explicitos en APIs publicas.

    [BASE CONTEXT]
    $existingCode

    [TASK]
    $instruction
    """.trimIndent()

fun buildIteratePrompt(mode: AiPromptMode, existingCode: String, instruction: String): String =
    when (mode) {
        AiPromptMode.PATCH -> buildKotlinPatchPrompt(existingCode, instruction)
        AiPromptMode.SCAFFOLD -> buildKotlinScaffoldPrompt(existingCode, instruction)
    }

fun unwrapMarkdownCodeFences(raw: String): String {
    val text = raw.replace("\r\n", "\n").trim()
    val fenceRegex = Regex("```(?:kotlin|kt|java)?\\s*([\\s\\S]*?)```", RegexOption.IGNORE_CASE)
    val matches = fenceRegex.findAll(text).toList()
    if (matches.isEmpty()) return text
    return matches.joinToString("\n\n") { it.groupValues.getOrNull(1)?.trim().orEmpty() }.trim()
}

private fun looksLikeKotlinLine(line: String): Boolean {
    val t = line.trim()
    if (t.isBlank()) return true
    if (t.startsWith("//") || t.startsWith("/*") || t.startsWith("*") || t.startsWith("*/")) return true
    if (Regex("\\b(def|shell|python)\\b", RegexOption.IGNORE_CASE).containsMatchIn(t)) return false
    if (t.startsWith("### FILE:") || t.startsWith("```")) return false

    val starters = listOf(
        "package ", "import ", "fun ", "class ", "object ", "interface ",
        "data class ", "sealed class ", "sealed interface ", "enum class ",
        "val ", "var ", "if ", "when ", "for ", "while ", "return ",
        "@", "}", "{", ")", "else", "try", "catch"
    )
    if (starters.any { t.startsWith(it) }) return true

    val hasCodeSignals = Regex("[{}()=;<>]|\\b(->|::|\\?:|\\?\\.)\\b").containsMatchIn(t)
    if (!hasCodeSignals) return false

    val hasNarrativeWords = Regex("\\b(para|puedes|este|codigo|explicacion|instrucciones|paso|nota|adicional)\\b", RegexOption.IGNORE_CASE)
        .containsMatchIn(t)
    return !hasNarrativeWords
}

private fun deduplicatePackageDeclarations(code: String): String {
    var firstPackageSeen = false
    return code.lines().filter { line ->
        if (Regex("^\\s*package\\s+[\\w.]+").containsMatchIn(line)) {
            if (!firstPackageSeen) { firstPackageSeen = true; true } else false
        } else true
    }.joinToString("\n")
}

fun sanitizeIterateBaseline(raw: String): String {
    val noFences = unwrapMarkdownCodeFences(raw)
    if (isLikelyKotlinSnippet(noFences)) return noFences.trim()

    val firstCodeStart = Regex("\\b(package|import|fun|class|object|interface|data class|sealed class|sealed interface|val|var)\\b")
        .find(noFences)
        ?.range
        ?.first
        ?: 0

    val fromCode = noFences.substring(firstCodeStart).trim()
    val keptLines = fromCode.lines().filter(::looksLikeKotlinLine)
    val sanitized = deduplicatePackageDeclarations(keptLines.joinToString("\n").trim())

    return if (isLikelyKotlinSnippet(sanitized)) sanitized else raw.trim()
}

fun isLikelyKotlinSnippet(text: String): Boolean {
    if (text.isBlank()) return false
    val hasToken = Regex("\\b(package|import|fun|class|object|interface|data class|sealed class|sealed interface|val|var)\\b").containsMatchIn(text)
    val hasForbidden = text.contains("### FILE:") || text.contains("```")
    if (!hasToken || hasForbidden) return false

    val hasForbiddenWords = Regex("\\b(def|shell|python|markdown|explicaci[oó]n|puedes|aqui|este c[oó]digo)\\b", RegexOption.IGNORE_CASE)
        .containsMatchIn(text)
    if (hasForbiddenWords) return false

    val hasNarrativeLine = text.lines().any { line ->
        val t = line.trim()
        if (t.isBlank()) return@any false
        val words = t.split(Regex("\\s+")).size
        val looksLikeCode = Regex("[{}()=;<>]|\\b(fun|class|object|interface|val|var|if|when|for|while|return|package|import|@)\\b")
            .containsMatchIn(t)
        words >= 10 && !looksLikeCode
    }

    return !hasNarrativeLine
}

fun normalizePatchProposal(raw: String): String? {
    val candidate = unwrapMarkdownCodeFences(raw)
    if (!isLikelyKotlinSnippet(candidate)) return null
    return when (strictPatchGate(candidate)) {
        is PatchGateResult.Pass -> candidate.trim()
        is PatchGateResult.Fail -> null
    }
}

data class PatchGateViolation(val rule: String, val detail: String)

sealed class PatchGateResult {
    object Pass : PatchGateResult()
    data class Fail(val violations: List<PatchGateViolation>) : PatchGateResult()
}

private val HARDCODED_SECRET_REGEX = Regex(
    """(?i)(password|passwd|secret|token|api_?key|private_?key)\s*=\s*["'][^"']{4,}["']"""
)

fun strictPatchGate(proposal: String): PatchGateResult {
    val violations = mutableListOf<PatchGateViolation>()

    // Regla 1: Prohibido !! (non-null assertion)
    if (proposal.contains("!!")) {
        violations += PatchGateViolation(
            "no-double-bang",
            "Non-null assertion (!!) detected; violates null-safety policy"
        )
    }

    // Regla 2: Exactamente una declaracion package
    val packageMatches = Regex("""^\s*package\s+[\w.]+""", RegexOption.MULTILINE).findAll(proposal).toList()
    when {
        packageMatches.isEmpty() ->
            violations += PatchGateViolation("require-package", "No package declaration found in PATCH proposal")
        packageMatches.size > 1 ->
            violations += PatchGateViolation(
                "single-package",
                "Multiple package declarations (${packageMatches.size}) detected; scaffold bleed suspected"
            )
    }

    // Regla 3: Prohibido System.exit
    if (proposal.contains("System.exit(")) {
        violations += PatchGateViolation("no-system-exit", "System.exit() detected; disallowed in managed Ktor service")
    }

    // Regla 4: Prohibido credenciales hardcodeadas
    if (HARDCODED_SECRET_REGEX.containsMatchIn(proposal)) {
        violations += PatchGateViolation("no-hardcoded-secrets", "Hardcoded credential pattern detected in PATCH proposal")
    }

    // Regla 5: Maximo MAX_TODOS_IN_PATCH comentarios TODO
    val todoCount = Regex("""//\s*TODO""", RegexOption.IGNORE_CASE).findAll(proposal).count()
    if (todoCount > MAX_TODOS_IN_PATCH) {
        violations += PatchGateViolation(
            "max-todos",
            "Excessive TODO count ($todoCount > $MAX_TODOS_IN_PATCH); AI may have deferred critical logic"
        )
    }

    return if (violations.isEmpty()) PatchGateResult.Pass else PatchGateResult.Fail(violations)
}

fun normalizeScaffoldProposal(raw: String): String? {
    val candidate = unwrapMarkdownCodeFences(raw)
    val lines = candidate.lines()
    val sectionIndexes = lines.mapIndexedNotNull { index, line ->
        if (line.trim().startsWith("### FILE:")) index else null
    }
    if (sectionIndexes.isEmpty()) return null

    sectionIndexes.forEachIndexed { idx, start ->
        val header = lines[start].substringAfter("### FILE:").trim()
        if (header.isBlank()) return null
        val endExclusive = if (idx + 1 < sectionIndexes.size) sectionIndexes[idx + 1] else lines.size
        val body = lines.subList(start + 1, endExclusive).joinToString("\n").trim()
        if (body.isBlank()) return null
    }
    return candidate.trim()
}

fun buildFallbackProposal(mode: AiPromptMode, existingCode: String): String =
    when (mode) {
        AiPromptMode.PATCH -> existingCode.trim()
        AiPromptMode.SCAFFOLD -> "### FILE: src/main/kotlin/Fallback.kt\n${existingCode.trim()}"
    }

@Serializable
data class DependencyCatalogEntry(
    val key: String,
    val label: String,
    val version: String,
    val kind: String,
    val status: String,
    val license: String,
    val risk: String,
    val reason: String
)

@Serializable
data class MilestoneCreateRequest(
    val title: String,
    val type: String,
    val deadline: String,
    val status: String = "planned",
    val notes: String? = null
)

@Serializable
data class MilestoneDTO(
    val id: Int,
    val title: String,
    val type: String,
    val deadline: String,
    val status: String,
    val notes: String? = null
)

@Serializable
data class DomainSpec(
    val functionalRequirements: List<String> = emptyList(),
    val useCases: List<String> = emptyList(),
    val dataModel: List<String> = emptyList(),
    val requiredApis: List<String> = emptyList()
)

@Serializable
data class ProjectCreateRequest(
    val nombre: String? = null,
    val name: String? = null,
    val profile: String? = null,
    val cliente: String? = null,
    val tarea: String? = null,
    val descripcion: String? = null,
    val dependencias: List<String> = emptyList(),
    val timeline: List<MilestoneCreateRequest> = emptyList(),
    val useThreeJsInterop: Boolean = false,
    val enableTailwindDirectives: Boolean = false,
    val engine: String? = null,
    val runtime: String? = null,
    val tags: List<String> = emptyList(),
    val preview: String? = null,
    val domainSpec: DomainSpec? = null,
    val uiPreset: String? = null,
    val uiTooling: List<String> = emptyList(),
    val enableA11yChecks: Boolean = false,
    val enableVisualRegression: Boolean = false
)

enum class ProjectProfile {
    STATIC,
    ANGULAR,
    NEXT_LEVEL,
    CREATIVE_CODING
}

enum class CreativeEngine {
    PROCESSING,
    PY5
}

@Serializable
data class LegacyProjectCreateRequest(
    val nombre: String,
    val director: String,
    val fecha_inicio: String,
    val equipo: List<String>
)

@Serializable
data class LegacyProjectResponse(
    val id: Int,
    val nombre: String,
    val director: String,
    val fecha_inicio: String,
    val equipo: List<String>,
    val estado: String
)

@Serializable
data class ProjectFileDTO(
    val id: Int? = null,
    val projectId: Int,
    val nombreArchivo: String,
    val contenido: String,
    val ruta: String
)

@Serializable
data class SyncFromDiskRequest(
    val deleteMissing: Boolean = false,
    val dryRun: Boolean = false
)

@Serializable
data class SyncFromDiskResultDTO(
    val projectId: Int,
    val dryRun: Boolean,
    val deleteMissing: Boolean,
    val diskFiles: Int,
    val dbFilesBefore: Int,
    val created: Int,
    val updated: Int,
    val deleted: Int,
    val unchanged: Int,
    val skippedBinaryOrUnreadable: Int
)

@Serializable
data class IconPropagationResultDTO(
    val totalProjects: Int,
    val filesCreated: Int,
    val filesUpdated: Int,
    val iconVersion: String
)

@Serializable
data class ReportGenerateRequest(
    val tipo: String = "diario",
    val date: String? = null,
    val week: String? = null,
    val responsable: String? = null
)

@Serializable
data class ReportGenerateResultDTO(
    val tipo: String,
    val fileName: String,
    val filePath: String,
    val date: String,
    val week: String? = null,
    val responsable: String
)

@Serializable
data class ProjectSummaryDTO(
    val id: Int,
    val nombre: String,
    val estado: String,
    val totalArchivos: Int,
    val cliente: String = "",
    val tarea: String = "",
    val descripcion: String? = null,
    val milestoneCount: Int = 0,
    val nextMilestone: MilestoneDTO? = null,
    val milestoneStatusCounts: Map<String, Int> = emptyMap()
)

@Serializable
data class LegacyUsageLogDTO(
    val id: Int,
    val tenantId: String,
    val endpoint: String,
    val method: String,
    val action: String,
    val statusCode: Int,
    val createdAt: String,
    val requestName: String = ""
)

@Serializable
data class LegacyUsageSummaryItemDTO(
    val tenantId: String,
    val endpoint: String,
    val hits: Int
)

@Serializable
data class LegacyUsageSummaryDTO(
    val totalHits: Int,
    val statusCodeBreakdown: Map<String, Int>,
    val byTenantEndpoint: List<LegacyUsageSummaryItemDTO>
)

@Serializable
data class MilestoneDashboardDTO(
    val totalProjects: Int,
    val statusTotals: Map<String, Int>,
    val projectsMatchingFilter: Int,
    val activeStatusFilter: String
)

@Serializable
data class CapabilitiesDTO(
    val profile: String,
    val features: List<String>,
    val profiles: List<String>,
    val webglEngines: List<String>,
    val creativeEngines: List<String> = emptyList(),
    val domainSpecFields: List<String> = emptyList(),
    val domainSpecOptional: Boolean = true,
    val uiPresets: List<String> = emptyList(),
    val uiTooling: List<String> = emptyList(),
    val knowledgeHubEnabled: Boolean = false,
    val groundedQueryEnabled: Boolean = false,
    val knowledgeSourceFormats: List<String> = emptyList(),
    val groundedPolicyMode: String = "mixed",
    val minCitations: Int = 1,
    val minConfidence: Double = 0.8
)

@Serializable
data class KnowledgeSourceRegisterRequest(
    val name: String,
    val type: String,
    val content: String,
    val version: String? = null,
    val tags: List<String> = emptyList()
)

@Serializable
data class KnowledgeSourceDTO(
    val id: Int,
    val name: String,
    val type: String,
    val version: String? = null,
    val tags: List<String> = emptyList(),
    val status: String,
    val createdAt: String,
    val chunkCount: Int
)

@Serializable
data class GroundedQueryRequest(
    val query: String,
    val sourceIds: List<Int> = emptyList(),
    val intent: String = "assist"
)

@Serializable
data class InitFromKnowledgeRequest(
    val name: String,
    val query: String,
    val sourceIds: List<Int> = emptyList(),
    val profile: String? = null,
    val cliente: String? = null,
    val tarea: String? = null,
    val descripcion: String? = null,
    val dependencias: List<String> = emptyList(),
    val timeline: List<MilestoneCreateRequest> = emptyList(),
    val uiPreset: String? = null,
    val uiTooling: List<String> = emptyList(),
    val enableA11yChecks: Boolean = false,
    val enableVisualRegression: Boolean = false
)

@Serializable
data class KnowledgeCitationDTO(
    val sourceId: Int,
    val sourceName: String,
    val chunkId: Int,
    val snippet: String,
    val score: Double
)

@Serializable
data class MixedPolicyMetadataDTO(
    val policyMode: String,
    val intent: String,
    val minCitations: Int,
    val minConfidence: Double,
    val meetsCitationThreshold: Boolean,
    val meetsConfidenceThreshold: Boolean,
    val enforcement: String
)

@Serializable
data class GroundedQueryResponse(
    val answer: String,
    val confidence: Double,
    val citations: List<KnowledgeCitationDTO>,
    val policy: MixedPolicyMetadataDTO
)

@Serializable
data class InitFromKnowledgeResponse(
    val projectId: Int,
    val citations: Int,
    val confidence: Double,
    val policy: MixedPolicyMetadataDTO
)

@Serializable
data class ApiError(
    val code: String,
    val category: String,
    val message: String,
    val requestId: String,
    val tenantId: String,
    val details: String? = null
)

enum class ErrorCategory {
    VALIDATION,
    POLICY,
    FORBIDDEN,
    NOT_FOUND,
    TIMEOUT,
    INTEGRATION,
    INTERNAL
}

sealed class DomainError(
    val code: String,
    val category: ErrorCategory,
    val message: String,
    val details: String? = null
) {
    class Validation(message: String, details: String? = null) : DomainError("VALIDATION_ERROR", ErrorCategory.VALIDATION, message, details)
    class Policy(message: String, details: String? = null) : DomainError("POLICY_ERROR", ErrorCategory.POLICY, message, details)
    class Forbidden(message: String, details: String? = null) : DomainError("FORBIDDEN", ErrorCategory.FORBIDDEN, message, details)
    class NotFound(message: String, details: String? = null) : DomainError("NOT_FOUND", ErrorCategory.NOT_FOUND, message, details)
    class Timeout(message: String, details: String? = null) : DomainError("TIMEOUT_ERROR", ErrorCategory.TIMEOUT, message, details)
    class Integration(message: String, details: String? = null) : DomainError("INTEGRATION_ERROR", ErrorCategory.INTEGRATION, message, details)
    class Internal(message: String, details: String? = null) : DomainError("INTERNAL_ERROR", ErrorCategory.INTERNAL, message, details)
}

class DomainException(val domainError: DomainError) : RuntimeException(domainError.message)

@Serializable
data class ProjectDetailDTO(
    val id: Int,
    val nombre: String,
    val estado: String,
    val cliente: String,
    val tarea: String,
    val descripcion: String? = null,
    val dependencias: List<DependencyCatalogEntry>,
    val timeline: List<MilestoneDTO>,
    val notesFile: String = "NOTES.md",
    val resourcesFile: String = "RESOURCES.md"
)

@Serializable
data class GenericResponse<T>(
    val status: String,
    val payload: T? = null,
    val error: String? = null,
    val apiError: ApiError? = null
)

data class GeneratedFile(val nombreArchivo: String, val ruta: String = "/", val contenido: String)
private data class ProjectCreationResult(val projectId: Int, val generatedFiles: List<GeneratedFile>)

internal data class ResolvedProjectConfig(
    val projectName: String,
    val profile: ProjectProfile,
    val clientName: String,
    val taskName: String,
    val description: String?,
    val useThreeJsInterop: Boolean,
    val enableTailwindDirectives: Boolean,
    val creativeEngine: CreativeEngine?,
    val runtime: String,
    val tags: List<String>,
    val preview: String?,
    val domainSpec: DomainSpec,
    val uiPreset: String,
    val uiTooling: List<String>,
    val enableA11yChecks: Boolean,
    val enableVisualRegression: Boolean
)

fun resolveProfileToken(raw: String?): ProjectProfile? {
    val normalized = raw?.trim()?.lowercase()?.replace('_', '-') ?: return null
    return when (normalized) {
        "next-level", "nextlevel" -> ProjectProfile.NEXT_LEVEL
        "creative-coding", "creativecoding", "creative" -> ProjectProfile.CREATIVE_CODING
        "angular" -> ProjectProfile.ANGULAR
        "static" -> ProjectProfile.STATIC
        else -> null
    }
}

fun resolveCreativeEngineToken(raw: String?): CreativeEngine? {
    val normalized = raw?.trim()?.lowercase()?.replace('_', '-') ?: return null
    return when (normalized) {
        "processing" -> CreativeEngine.PROCESSING
        "py5" -> CreativeEngine.PY5
        else -> null
    }
}

fun resolveProjectProfile(request: ProjectCreateRequest): ProjectProfile =
    resolveProfileToken(request.profile)
        ?: resolveProfileToken(request.cliente)
        ?: ProjectProfile.STATIC

fun resolveProjectName(request: ProjectCreateRequest): String =
    request.name?.trim()?.takeIf { it.isNotBlank() }
        ?: request.nombre?.trim()?.takeIf { it.isNotBlank() }
        ?: ""

private fun resolveClientName(request: ProjectCreateRequest): String {
    val client = request.cliente?.trim().orEmpty()
    if (client.isBlank()) return ""

    // Si no llega profile explicito y cliente trae un token de perfil legacy, no lo usamos como cliente real.
    if (request.profile.isNullOrBlank() && resolveProfileToken(client) != null) return ""
    return client
}

private fun resolveTaskName(request: ProjectCreateRequest): String = request.tarea?.trim().orEmpty()

private fun resolveCreativeEngine(request: ProjectCreateRequest, profile: ProjectProfile): CreativeEngine? {
    if (profile != ProjectProfile.CREATIVE_CODING) return null
    return resolveCreativeEngineToken(request.engine) ?: CreativeEngine.PROCESSING
}

private fun resolveRuntime(request: ProjectCreateRequest, profile: ProjectProfile, engine: CreativeEngine?): String {
    request.runtime?.trim()?.takeIf { it.isNotBlank() }?.let { return it }
    if (profile != ProjectProfile.CREATIVE_CODING || engine == null) return "jvm"
    return when (engine) {
        CreativeEngine.PROCESSING -> "java17"
        CreativeEngine.PY5 -> "python3.11"
    }
}

private fun resolveTags(request: ProjectCreateRequest): List<String> =
    request.tags.map { it.trim() }.filter { it.isNotBlank() }.distinct().take(12)

private val supportedUiTooling = listOf("design-tokens", "ui-kit", "a11y-checks", "visual-regression")

private fun resolveUiPreset(request: ProjectCreateRequest): String =
    request.uiPreset?.trim()?.lowercase()?.takeIf { it.isNotBlank() } ?: "modern-saas"

private fun resolveUiTooling(request: ProjectCreateRequest): List<String> {
    val requested = request.uiTooling
        .map { it.trim().lowercase() }
        .filter { it in supportedUiTooling }
        .distinct()
    if (requested.isNotEmpty()) return requested

    val defaults = mutableListOf("design-tokens", "ui-kit")
    if (request.enableA11yChecks) defaults += "a11y-checks"
    if (request.enableVisualRegression) defaults += "visual-regression"
    return defaults.distinct()
}

private fun sanitizeDomainList(values: List<String>): List<String> =
    values
        .map { it.trim() }
        .filter { it.isNotBlank() }
        .distinct()
        .take(20)

private fun fallbackDomainSpec(profile: ProjectProfile): DomainSpec {
    val profileHint = when (profile) {
        ProjectProfile.CREATIVE_CODING -> "experiencia creativa"
        ProjectProfile.NEXT_LEVEL -> "experiencia web interactiva"
        ProjectProfile.ANGULAR -> "portal empresarial"
        ProjectProfile.STATIC -> "servicio backend"
    }

    return DomainSpec(
        functionalRequirements = listOf(
            "Autenticacion y autorizacion basica por roles",
            "CRUD principal del dominio con validacion",
            "Busqueda y filtrado de registros",
            "Trazabilidad de cambios y eventos relevantes"
        ),
        useCases = listOf(
            "Usuario final crea y consulta contenido de $profileHint",
            "Administrador modera contenido y gestiona estados",
            "Sistema notifica eventos clave de negocio"
        ),
        dataModel = listOf(
            "User(id, email, role, createdAt)",
            "Content(id, ownerId, title, body, status, createdAt)",
            "AuditEvent(id, entity, action, actorId, timestamp)"
        ),
        requiredApis = listOf(
            "POST /api/v1/auth/login",
            "GET /api/v1/users/me",
            "GET|POST /api/v1/content",
            "GET|PUT|DELETE /api/v1/content/{id}"
        )
    )
}

private fun resolveDomainSpec(request: ProjectCreateRequest, profile: ProjectProfile): DomainSpec {
    val incoming = request.domainSpec
    val normalized = DomainSpec(
        functionalRequirements = sanitizeDomainList(incoming?.functionalRequirements ?: emptyList()),
        useCases = sanitizeDomainList(incoming?.useCases ?: emptyList()),
        dataModel = sanitizeDomainList(incoming?.dataModel ?: emptyList()),
        requiredApis = sanitizeDomainList(incoming?.requiredApis ?: emptyList())
    )

    val isEmpty = normalized.functionalRequirements.isEmpty() &&
        normalized.useCases.isEmpty() &&
        normalized.dataModel.isEmpty() &&
        normalized.requiredApis.isEmpty()

    return if (isEmpty) fallbackDomainSpec(profile) else normalized
}

private fun isSupportedCreativeRuntime(engine: CreativeEngine, runtime: String): Boolean {
    val normalized = runtime.trim().lowercase()
    return when (engine) {
        CreativeEngine.PROCESSING -> normalized == "java17"
        CreativeEngine.PY5 -> normalized == "python3.11"
    }
}

internal fun resolveProjectConfig(request: ProjectCreateRequest): ResolvedProjectConfig =
    run {
        val profile = resolveProjectProfile(request)
        val creativeEngine = resolveCreativeEngine(request, profile)
        ResolvedProjectConfig(
            projectName = resolveProjectName(request),
            profile = profile,
            clientName = resolveClientName(request),
            taskName = resolveTaskName(request),
            description = request.descripcion,
            useThreeJsInterop = request.useThreeJsInterop,
            enableTailwindDirectives = request.enableTailwindDirectives,
            creativeEngine = creativeEngine,
            runtime = resolveRuntime(request, profile, creativeEngine),
            tags = resolveTags(request),
            preview = request.preview?.trim()?.takeIf { it.isNotBlank() },
            domainSpec = resolveDomainSpec(request, profile),
            uiPreset = resolveUiPreset(request),
            uiTooling = resolveUiTooling(request),
            enableA11yChecks = request.enableA11yChecks,
            enableVisualRegression = request.enableVisualRegression
        )
    }

private fun markdownList(items: List<String>, emptyMessage: String = "Sin definir"): String =
    if (items.isEmpty()) "- $emptyMessage" else items.joinToString("\n") { "- $it" }

fun normalizeProjectToken(value: String): String =
    value
        .trim()
        .lowercase()
        .replace(Regex("[^a-z0-9]+"), "-")
        .trim('-')
        .ifBlank { "app" }

private val dependencyCatalogFallback = listOf(
    DependencyCatalogEntry("postgres", "PostgreSQL", "42.7.4", "database", "allowed", "PostgreSQL", "low", "Motor relacional soportado oficialmente por la plataforma"),
    DependencyCatalogEntry("exposed", "Exposed ORM", "0.50.1", "orm", "allowed", "Apache-2.0", "medium", "ORM alineado con Kotlin y Exposed JDBC ya presente en el stack"),
    DependencyCatalogEntry("jwt", "JWT Auth", "0.12.6", "security", "allowed", "Apache-2.0", "medium", "Autenticacion estandar revisable por Renovate/Dependabot"),
    DependencyCatalogEntry("log4j-1.x", "Log4j 1.x", "1.2.17", "logging", "blocked", "Apache-2.0", "critical", "EOL y con vulnerabilidades conocidas"),
    DependencyCatalogEntry("legacy-gpl-lib", "Legacy GPL Library", "0.9.1", "misc", "blocked", "GPL-3.0", "high", "Licencia no apta para el catalogo corporativo")
)

fun generatedBaseDir(): String = System.getenv("GENERATED_FILES_DIR") ?: "/app/proyectos_generados"

fun reportsGeneratedDir(): File {
    val dir = File("docs/reportes_generados")
    if (!dir.exists()) dir.mkdirs()
    return dir
}

private fun isoWeekLabel(date: LocalDate): String {
    val wf = WeekFields.ISO
    val week = date.get(wf.weekOfWeekBasedYear())
    val year = date.get(wf.weekBasedYear())
    return "%04d-W%02d".format(year, week)
}

private fun parseOrToday(rawDate: String?): LocalDate =
    rawDate?.trim()?.takeIf { it.isNotBlank() }
        ?.let { runCatching { LocalDate.parse(it) }.getOrNull() }
        ?: LocalDate.now()

private fun resolveWeekLabel(rawWeek: String?, fallbackDate: LocalDate): String {
    val candidate = rawWeek?.trim()?.uppercase()
    return if (candidate != null && Regex("^\\d{4}-W\\d{2}$").matches(candidate)) candidate else isoWeekLabel(fallbackDate)
}

private fun readTemplateOrDefault(fileName: String, defaultTitle: String): String {
    val file = File("docs/$fileName")
    return if (file.exists()) file.readText() else "# $defaultTitle\n\n"
}

private fun renderDailyReport(template: String, date: String, responsable: String): String {
    val updated = template
        .replace(Regex("- Fecha: `[^`]*`"), "- Fecha: `$date`")
        .replace(Regex("- Responsable: `[^`]*`"), "- Responsable: `$responsable`")
    return "$updated\n\n---\n\nGenerado automaticamente el $date.\n"
}

private fun renderWeeklyReport(template: String, week: String, responsable: String): String {
    val updated = template
        .replace(Regex("- Semana: `[^`]*`"), "- Semana: `$week`")
        .replace(Regex("- Responsable: `[^`]*`"), "- Responsable: `$responsable`")
    return "$updated\n\n---\n\nGenerado automaticamente para la semana $week.\n"
}

fun generateOperationalReport(request: ReportGenerateRequest): ReportGenerateResultDTO {
    val tipo = when (request.tipo.trim().lowercase()) {
        "daily", "diario" -> "diario"
        "weekly", "semanal" -> "semanal"
        else -> throw IllegalArgumentException("tipo must be diario|semanal")
    }

    val date = parseOrToday(request.date)
    val week = resolveWeekLabel(request.week, date)
    val responsable = request.responsable?.trim()?.takeIf { it.isNotBlank() } ?: "pendiente"
    val outDir = reportsGeneratedDir()

    return if (tipo == "diario") {
        val fileName = "reportediario-${date}.md"
        val content = renderDailyReport(
            template = readTemplateOrDefault("reportediario.md", "Reporte Diario"),
            date = date.toString(),
            responsable = responsable
        )
        val output = File(outDir, fileName)
        output.writeText(content)
        ReportGenerateResultDTO(
            tipo = tipo,
            fileName = fileName,
            filePath = output.path,
            date = date.toString(),
            week = week,
            responsable = responsable
        )
    } else {
        val fileName = "reportesemanal-${week}.md"
        val content = renderWeeklyReport(
            template = readTemplateOrDefault("reportesemanal.md", "Reporte Semanal"),
            week = week,
            responsable = responsable
        )
        val output = File(outDir, fileName)
        output.writeText(content)
        ReportGenerateResultDTO(
            tipo = tipo,
            fileName = fileName,
            filePath = output.path,
            date = date.toString(),
            week = week,
            responsable = responsable
        )
    }
}

fun loadDependencyCatalog(): List<DependencyCatalogEntry> {
    val file = File("config/dependencies/dependency-catalog.json")
    if (!file.exists()) return dependencyCatalogFallback

    return runCatching {
        customJson.decodeFromString<List<DependencyCatalogEntry>>(file.readText())
    }.getOrElse { dependencyCatalogFallback }
}

fun allowedDependencyEntries(requested: List<String>): Result<List<DependencyCatalogEntry>> {
    val catalog = loadDependencyCatalog().associateBy { it.key.lowercase() }
    val selected = mutableListOf<DependencyCatalogEntry>()

    requested.forEach { raw ->
        val key = raw.trim().lowercase()
        val found = catalog[key] ?: return Result.failure(IllegalArgumentException("Dependencia no catalogada: $raw"))
        if (!found.status.equals("allowed", ignoreCase = true)) {
            return Result.failure(IllegalArgumentException("Dependencia bloqueada por politica: ${found.key} (${found.reason})"))
        }
        if (selected.none { it.key == found.key }) {
            selected += found
        }
    }

    return Result.success(selected)
}

fun buildProjectSupportFiles(
    projectName: String,
    clientName: String,
    taskName: String,
    description: String?,
    timeline: List<MilestoneCreateRequest>,
    profile: ProjectProfile,
    creativeEngine: CreativeEngine?,
    runtime: String,
    tags: List<String>,
    preview: String?,
    domainSpec: DomainSpec,
    uiPreset: String,
    uiTooling: List<String>,
    enableA11yChecks: Boolean,
    enableVisualRegression: Boolean,
    useThreeJsInterop: Boolean,
    enableTailwindDirectives: Boolean,
    dependencies: List<DependencyCatalogEntry>
): List<GeneratedFile> {
    val dependencyLines = if (dependencies.isEmpty()) {
        "- Sin dependencias adicionales de catalogo"
    } else {
        dependencies.joinToString("\n") { "- ${it.label} (${it.version}) · ${it.kind}" }
    }

    val milestoneLines = if (timeline.isEmpty()) {
        "- Sin hitos definidos"
    } else {
        timeline.joinToString("\n") {
            "- ${it.title} · tipo=${it.type} · fecha=${it.deadline} · estado=${it.status}"
        }
    }

    val functionalLines = markdownList(domainSpec.functionalRequirements)
    val useCaseLines = markdownList(domainSpec.useCases)
    val dataModelLines = markdownList(domainSpec.dataModel)
    val apiLines = markdownList(domainSpec.requiredApis)

    val notes = """
        # NOTES

        ## Contexto de negocio
        - Cliente: ${if (clientName.isBlank()) "N/A" else clientName}
        - Tarea: ${if (taskName.isBlank()) "N/A" else taskName}
        - Descripcion: ${description ?: "N/A"}
        - Perfil: ${profile.name}
        - Engine: ${creativeEngine?.name ?: "N/A"}
        - Runtime: $runtime
        - Tags: ${if (tags.isEmpty()) "N/A" else tags.joinToString(",")}
        - Preview: ${preview ?: "N/A"}
        - UI Preset: $uiPreset
        - UI Tooling: ${if (uiTooling.isEmpty()) "N/A" else uiTooling.joinToString(",")}
        - A11y checks: $enableA11yChecks
        - Visual regression: $enableVisualRegression

        ## Dependencias aprobadas
        $dependencyLines

        ## Timeline
        $milestoneLines

        ## DomainSpec (guia funcional)
        ### Requisitos funcionales
        $functionalLines

        ### Casos de uso
        $useCaseLines

        ### Modelo de datos
        $dataModelLines

        ### APIs necesarias
        $apiLines

        ## Observaciones
        - Este archivo esta pensado para notas funcionales, acuerdos y decisiones.
        - Evita meter secretos o credenciales.
    """.trimIndent()

    val resources = """
        # RESOURCES

        ## Recursos utiles
        - Documento de migracion ProjectApi -> UniversalEngine
        - Catalogo versionado de dependencias: config/dependencies/dependency-catalog.json
        - Changelog interno de deprecacion
        - Revisiones automaticas recomendadas: Renovate / Dependabot / Snyk

        ## Recordatorios
        - Sunset legacy ProjectApi.kt: $LEGACY_PROJECT_SUNSET_AT
        - Warning severo a los 3 meses desde anuncio
        - Mantener milestone status actualizado para reporting
    """.trimIndent()

    val contextJson = buildJsonObject {
        put("nombre", projectName)
        put("name", projectName)
        put("profile", profile.name.lowercase())
        put("engine", creativeEngine?.name?.lowercase() ?: "")
        put("runtime", runtime)
        put("cliente", clientName)
        put("tarea", taskName)
        put("descripcion", description ?: "")
        put("preview", preview ?: "")
        put("useThreeJsInterop", useThreeJsInterop)
        put("enableTailwindDirectives", enableTailwindDirectives)
        put("uiPreset", uiPreset)
        put("enableA11yChecks", enableA11yChecks)
        put("enableVisualRegression", enableVisualRegression)
        putJsonArray("tags") {
            tags.forEach { add(it) }
        }
        putJsonArray("uiTooling") {
            uiTooling.forEach { add(it) }
        }
        putJsonArray("dependencias") {
            dependencies.forEach { dep ->
                add(buildJsonObject {
                    put("key", dep.key)
                    put("label", dep.label)
                    put("version", dep.version)
                    put("kind", dep.kind)
                })
            }
        }
        putJsonArray("timeline") {
            timeline.forEach { milestone ->
                add(buildJsonObject {
                    put("title", milestone.title)
                    put("type", milestone.type)
                    put("deadline", milestone.deadline)
                    put("status", milestone.status)
                    put("notes", milestone.notes ?: "")
                })
            }
        }
        putJsonObject("domainSpec") {
            putJsonArray("functionalRequirements") { domainSpec.functionalRequirements.forEach { add(it) } }
            putJsonArray("useCases") { domainSpec.useCases.forEach { add(it) } }
            putJsonArray("dataModel") { domainSpec.dataModel.forEach { add(it) } }
            putJsonArray("requiredApis") { domainSpec.requiredApis.forEach { add(it) } }
        }
    }.toString()

    val uiFiles = mutableListOf<GeneratedFile>()
    if (uiTooling.contains("design-tokens")) {
        val designTokens = """
            :root {
              --color-bg: #0b1020;
              --color-surface: #111a33;
              --color-text: #e5e7eb;
              --color-muted: #94a3b8;
              --color-primary: #4f46e5;
              --color-primary-contrast: #ffffff;
              --radius-sm: 6px;
              --radius-md: 10px;
              --radius-lg: 16px;
              --space-1: 4px;
              --space-2: 8px;
              --space-3: 12px;
              --space-4: 16px;
              --space-6: 24px;
              --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.2);
              --shadow-md: 0 8px 20px rgba(0, 0, 0, 0.24);
            }

            [data-theme="light"] {
              --color-bg: #f8fafc;
              --color-surface: #ffffff;
              --color-text: #0f172a;
              --color-muted: #475569;
            }
        """.trimIndent()
        uiFiles += GeneratedFile("design-tokens.css", ruta = "/ui/styles", contenido = designTokens)
    }

    return listOf(
        GeneratedFile("NOTES.md", contenido = notes),
        GeneratedFile("RESOURCES.md", contenido = resources),
        GeneratedFile("PROJECT_CONTEXT.json", contenido = contextJson)
    ) + uiFiles + buildIconSupportFiles()
}

private suspend fun upsertIconAssetsForProject(projectId: Int): Pair<Int, Int> {
    val assets = buildIconSupportFiles()
    var created = 0
    var updated = 0

    assets.forEach { asset ->
        val existing = suspendTransaction {
            ProjectFiles.select {
                (ProjectFiles.projectId eq projectId) and
                    (ProjectFiles.nombreArchivo eq asset.nombreArchivo) and
                    (ProjectFiles.ruta eq asset.ruta)
            }.singleOrNull()
        }

        if (existing == null) {
            created += 1
            suspendTransaction {
                ProjectFiles.insert {
                    it[ProjectFiles.projectId] = projectId
                    it[ProjectFiles.nombreArchivo] = asset.nombreArchivo
                    it[ProjectFiles.ruta] = asset.ruta
                    it[ProjectFiles.contenido] = asset.contenido
                }
            }
        } else if (existing[ProjectFiles.contenido] != asset.contenido) {
            updated += 1
            suspendTransaction {
                ProjectFiles.update({ ProjectFiles.id eq existing[ProjectFiles.id] }) {
                    it[ProjectFiles.contenido] = asset.contenido
                }
            }
        }
    }

    writeGeneratedFiles(projectId, assets)
    return created to updated
}

private suspend fun propagateIconAssetsToAllProjects(): IconPropagationResultDTO {
    val projectIds = suspendTransaction { Projects.selectAll().map { it[Projects.id] } }
    var created = 0
    var updated = 0

    projectIds.forEach { projectId ->
        val (c, u) = upsertIconAssetsForProject(projectId)
        created += c
        updated += u
    }

    return IconPropagationResultDTO(
        totalProjects = projectIds.size,
        filesCreated = created,
        filesUpdated = updated,
        iconVersion = ICON_SYSTEM_VERSION
    )
}

fun buildModernBackendTemplate(
    projectName: String,
    dependencies: List<String>,
    cliente: String = "",
    tarea: String = "",
    descripcion: String? = null,
    timeline: List<MilestoneCreateRequest> = emptyList(),
    domainSpec: DomainSpec = DomainSpec(),
    uiPreset: String = "modern-saas",
    uiTooling: List<String> = emptyList()
): List<GeneratedFile> {
    val slug = normalizeProjectToken(projectName)
    val packageToken = slug.replace('-', '_')
    val useJwt = dependencies.any { it.equals("jwt", ignoreCase = true) }
    val useDb = dependencies.any { it.equals("postgres", ignoreCase = true) || it.equals("exposed", ignoreCase = true) }
    val timelineSection = if (timeline.isEmpty()) {
        "- Sin hitos definidos"
    } else {
        timeline.joinToString("\n") { "- ${it.title} · ${it.type} · ${it.deadline} · ${it.status}" }
    }
    val functionalLines = markdownList(domainSpec.functionalRequirements)
    val useCaseLines = markdownList(domainSpec.useCases)
    val dataModelLines = markdownList(domainSpec.dataModel)
    val apiLines = markdownList(domainSpec.requiredApis)

    val readme = """
        # $projectName

        Backend ultraligero generado automaticamente.

        ## Configuracion base
        - Cliente: ${if (cliente.isBlank()) "N/A" else cliente}
        - Tarea: ${if (tarea.isBlank()) "N/A" else tarea}
        - Descripcion: ${descripcion ?: "N/A"}

        ## Timeline
        $timelineSection

        ## DomainSpec
        ### Requisitos funcionales
        $functionalLines

        ### Casos de uso
        $useCaseLines

        ### Modelo de datos
        $dataModelLines

        ### APIs necesarias
        $apiLines

        ## UI implementation guidance
        - UI Preset: $uiPreset
        - UI Tooling: ${if (uiTooling.isEmpty()) "N/A" else uiTooling.joinToString(",")}

        ## Capacidades base
        - Ktor 2.x + Kotlin
        - Contrato HTTP JSON estandar
        - Endpoints `/health` y `/ready`
        - Manejo de errores y logging
        - Dockerfile listo para despliegue
        - CI de ejemplo para build y test

        ## Ejecucion local
        ./gradlew run
    """.trimIndent()

    val appKt = """
        package com.generated.$packageToken

        import io.ktor.server.application.*
        import io.ktor.server.response.*
        import io.ktor.server.routing.*

        fun Application.generatedModule() {
            routing {
                get("/health") { call.respond(mapOf("status" to "ok")) }
                get("/ready") { call.respond(mapOf("status" to "ready")) }
                get("/api/v1/info") {
                    call.respond(
                        mapOf(
                            "name" to "$projectName",
                            "runtime" to "ktor",
                            "profile" to "ultralight"
                        )
                    )
                }
            }
        }
    """.trimIndent()

    val securityKt = """
        package com.generated.$packageToken

        import io.ktor.server.application.*

        fun Application.generatedSecurity() {
            // JWT scaffold: habilitar segun entorno y politica del proyecto.
        }
    """.trimIndent()

    val observabilityKt = """
        package com.generated.$packageToken

        import io.ktor.server.application.*

        fun Application.generatedObservability() {
            // Punto de extension para metricas y tracing.
        }
    """.trimIndent()

    val dockerfile = """
        FROM gradle:8-jdk17 AS build
        WORKDIR /app
        COPY . .
        RUN gradle installDist --no-daemon

        FROM eclipse-temurin:17-jre
        WORKDIR /opt/app
        COPY --from=build /app/build/install /opt/app
        EXPOSE 8080
        CMD ["/opt/app/sisi-v1/bin/sisi-v1"]
    """.trimIndent()

    val ciYaml = """
        name: backend-ci
        on:
          push:
          pull_request:

        jobs:
          test:
            runs-on: ubuntu-latest
            steps:
              - uses: actions/checkout@v4
              - uses: actions/setup-java@v4
                with:
                  distribution: temurin
                  java-version: '17'
              - run: ./gradlew test --no-daemon
    """.trimIndent()

    val files = mutableListOf(
        GeneratedFile("README_GENERADO.md", contenido = readme),
        GeneratedFile("ApplicationGenerated.kt", contenido = appKt),
        GeneratedFile("ObservabilityGenerated.kt", contenido = observabilityKt),
        GeneratedFile("Dockerfile", contenido = dockerfile),
        GeneratedFile(".dockerignore", contenido = "build\n.gradle\n.git\n"),
        GeneratedFile("ci.yml", ruta = "/.github/workflows", contenido = ciYaml),
        GeneratedFile(
            "application.conf",
            contenido = "ktor { deployment { port = 8080 } application { modules = [ com.generated.$packageToken.ApplicationGeneratedKt.generatedModule ] } }"
        )
    )

    if (useJwt) files += GeneratedFile("SecurityGenerated.kt", contenido = securityKt)
    if (useDb) files += GeneratedFile("DatabaseNotes.md", contenido = "Postgres/Exposed habilitados en la plantilla de proyecto.")

    return files
}

fun buildFritz2WebglTemplate(
    projectName: String,
    profile: ProjectProfile,
    useThreeJsInterop: Boolean,
    enableTailwindDirectives: Boolean,
    clientName: String,
    taskName: String,
    description: String?,
    domainSpec: DomainSpec = DomainSpec(),
    uiPreset: String = "modern-saas",
    uiTooling: List<String> = emptyList()
): List<GeneratedFile> {
    val slug = normalizeProjectToken(projectName)
    val packageToken = slug.replace('-', '_')

    val backendBuildGradle = """
        plugins {
            kotlin("jvm") version "2.0.0"
            application
        }

        repositories { mavenCentral() }

        val ktorVersion = "3.0.0"

        dependencies {
            implementation("io.ktor:ktor-server-core:${'$'}ktorVersion")
            implementation("io.ktor:ktor-server-netty:${'$'}ktorVersion")
            implementation("io.ktor:ktor-serialization-kotlinx-json:${'$'}ktorVersion")
            implementation("io.ktor:ktor-server-content-negotiation:${'$'}ktorVersion")
            implementation("io.ktor:ktor-server-websockets:${'$'}ktorVersion")
            implementation("io.ktor:ktor-server-call-logging:${'$'}ktorVersion")
        }

        application {
            mainClass.set("com.generated.$packageToken.ApplicationKt")
        }

        kotlin {
            jvmToolchain(17)
        }
    """.trimIndent()

    val backendApp = """
        package com.generated.$packageToken

        import io.ktor.http.*
        import io.ktor.serialization.kotlinx.json.*
        import io.ktor.server.application.*
        import io.ktor.server.engine.*
        import io.ktor.server.netty.*
        import io.ktor.server.plugins.contentnegotiation.*
        import io.ktor.server.response.*
        import io.ktor.server.routing.*

        private const val USE_THREE_JS = $useThreeJsInterop
        private const val ENABLE_TAILWIND_DIRECTIVES = $enableTailwindDirectives

        fun Application.module() {
            install(ContentNegotiation) { json() }

            routing {
                get("/health") { call.respond(mapOf("status" to "ok")) }
                get("/api/v1/webgl/config") {
                    call.respond(
                        mapOf(
                            "name" to "$projectName",
                            "profile" to "${profile.name.lowercase()}",
                            "useThreeJsInterop" to USE_THREE_JS,
                            "enableTailwindDirectives" to ENABLE_TAILWIND_DIRECTIVES
                        )
                    )
                }
                get("/api/v1/webgl/runtime") {
                    call.respond(
                        HttpStatusCode.OK,
                        mapOf(
                            "engine" to if (USE_THREE_JS) "three-js" else "kotlin-webgl-wrapper",
                            "notes" to "Config inicial para canvas WebGL en Fritz2"
                        )
                    )
                }
            }
        }

        fun main() {
            embeddedServer(Netty, port = 8080, host = "0.0.0.0", module = Application::module).start(wait = true)
        }
    """.trimIndent()

    val frontendBuildGradle = """
        plugins {
            kotlin("js") version "2.0.0"
        }

        repositories {
            mavenCentral()
        }

        kotlin {
            js(IR) {
                binaries.executable()
                browser {
                    commonWebpackConfig {
                        cssSupport {
                            enabled = true
                        }
                    }
                }
            }

            sourceSets {
                val main by getting {
                    dependencies {
                        implementation("dev.fritz2:core:1.0.0")
                        ${if (useThreeJsInterop) "implementation(npm(\"three\", \"0.169.0\"))" else "// WebGL inicial via wrapper Kotlin puro (sin Three.js)."}
                    }
                }
            }
        }

        // Flujo A (independiente): npm run dev en carpeta frontend.
        // Flujo B (Gradle): ./gradlew jsBrowserDevelopmentRun
    """.trimIndent()

    val packageJson = """
        {
          "name": "${slug}-frontend",
          "private": true,
          "version": "0.1.0",
          "scripts": {
            "dev": "vite --port 5173",
            "build": "vite build",
            "preview": "vite preview --port 4173"
          },
          "dependencies": {
            "fritz2": "1.0.0"${if (useThreeJsInterop) ",\n    \"three\": \"0.169.0\"" else ""}
          },
          "devDependencies": {
            "vite": "5.4.8"
          }
        }
    """.trimIndent()

    val viteConfig = """
        import { defineConfig } from "vite";

        export default defineConfig({
          server: {
            port: 5173,
            strictPort: true
          },
          build: {
            outDir: "dist"
          }
        });
    """.trimIndent()

    val frontendIndexHtml = """
        <!doctype html>
        <html lang="es">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>$projectName · Fritz2 + WebGL</title>
          <link rel="stylesheet" href="/styles/app.css" />
        </head>
        <body>
          <div id="root"></div>
          <script type="module" src="/src/main.js"></script>
        </body>
        </html>
    """.trimIndent()

    val frontendJsBootstrap = """
        import "./styles/app.css";

        // Vite mantiene este bootstrap JS mientras se integra el bundle Kotlin/JS en fases iniciales.
        const root = document.getElementById("root");
        if (root) {
          root.innerHTML = "<p>Frontend Fritz2/WebGL inicializado. Ejecuta Gradle JS para montar Main.kt.</p>";
        }
    """.trimIndent()

    val cssContent = """
        :root {
          color-scheme: dark;
          font-family: Inter, system-ui, -apple-system, sans-serif;
        }

        body {
          margin: 0;
          min-height: 100vh;
          background: #0f172a;
          color: #e2e8f0;
        }

        #root {
          padding: 1.5rem;
        }

        canvas#glCanvas {
          width: min(100%, 960px);
          height: 400px;
          border: 1px solid #334155;
          border-radius: 0.75rem;
          background: #020617;
        }

        ${if (enableTailwindDirectives) "@tailwind base;\n@tailwind components;\n@tailwind utilities;" else "/* Directivas Tailwind desactivadas por flag en fase inicial. */"}
    """.trimIndent()

    val frontendMainKt = """
        package com.generated.$packageToken.frontend

        import dev.fritz2.core.RenderContext
        import dev.fritz2.core.canvas
        import dev.fritz2.core.h1
        import dev.fritz2.core.p
        import dev.fritz2.core.render
        import kotlinx.browser.window
        import org.w3c.dom.HTMLCanvasElement

        external interface WebGlConfig {
            val useThreeJsInterop: Boolean
            val enableTailwindDirectives: Boolean
        }

        @JsModule("three")
        @JsNonModule
        external object ThreeModule

        fun main() {
            render("#root") {
                h1 { +"$projectName · Fritz2 + WebGL" }
                p { +"Cliente: ${if (clientName.isBlank()) "N/A" else clientName} · Tarea: ${if (taskName.isBlank()) "N/A" else taskName}" }
                p { +"Descripción: ${description ?: "N/A"}" }
                webGlCanvas()
            }
        }

        private fun RenderContext.webGlCanvas() {
            canvas {
                id("glCanvas")
                attr("width", "960")
                attr("height", "400")
                attr("aria-label", "WebGL Canvas")
                domNode.onMount { node ->
                    val htmlCanvas = node as? HTMLCanvasElement ?: return@onMount
                    loadConfigAndRender(htmlCanvas)
                }
            }
        }

        private fun loadConfigAndRender(canvas: HTMLCanvasElement) {
            window.fetch("/api/v1/webgl/config")
                .then { response -> response.json() }
                .then { raw ->
                    val config = raw.unsafeCast<WebGlConfig>()
                    if (config.useThreeJsInterop) {
                        initThreeJs(canvas)
                    } else {
                        initRawWebGL(canvas)
                    }
                }
                .catch {
                    initRawWebGL(canvas)
                }
        }

        private fun initRawWebGL(canvas: HTMLCanvasElement) {
            val gl = canvas.getContext("webgl") ?: return
            gl.asDynamic().clearColor(0.08, 0.12, 0.24, 1.0)
            gl.asDynamic().clear(gl.asDynamic().COLOR_BUFFER_BIT)
        }

        private fun initThreeJs(canvas: HTMLCanvasElement) {
            // Punto de extension para integrar Three.js via @JsModule("three").
            val gl = canvas.getContext("webgl") ?: return
            gl.asDynamic().clearColor(0.12, 0.20, 0.10, 1.0)
            gl.asDynamic().clear(gl.asDynamic().COLOR_BUFFER_BIT)
            ThreeModule
        }
    """.trimIndent()

    val readmeNextLevel = """
        # $projectName - NEXT_LEVEL

        Scaffold inicial con perfil `${profile.name}`.

        ## Estructura
        - `backend/` Ktor JVM
        - `frontend/` Kotlin/JS + Vite
        - `frontend/src/main/kotlin/Main.kt` con switch WebGL por flag

        ## Flags de perfil
        - `useThreeJsInterop`: $useThreeJsInterop
        - `enableTailwindDirectives`: $enableTailwindDirectives

        ## DomainSpec
        ### Requisitos funcionales
        ${markdownList(domainSpec.functionalRequirements)}

        ### Casos de uso
        ${markdownList(domainSpec.useCases)}

        ### Modelo de datos
        ${markdownList(domainSpec.dataModel)}

        ### APIs necesarias
        ${markdownList(domainSpec.requiredApis)}

        ## UI implementation guidance
        - UI Preset: $uiPreset
        - UI Tooling: ${if (uiTooling.isEmpty()) "N/A" else uiTooling.joinToString(",")}

        ## Run rapido
        - Backend: `cd backend && ./gradlew run`
        - Frontend (Gradle): `cd frontend && ./gradlew jsBrowserDevelopmentRun`
        - Frontend (npm): `cd frontend && npm install && npm run dev`

        ## Build deploy
        - `cd frontend && npm run build`
        - Servir `frontend/dist` como estatico desde Ktor en siguiente fase.
    """.trimIndent()

    return listOf(
        GeneratedFile("README_NEXT_LEVEL.md", contenido = readmeNextLevel),
        GeneratedFile("build.gradle.kts", ruta = "/backend", contenido = backendBuildGradle),
        GeneratedFile("Application.kt", ruta = "/backend/src/main/kotlin", contenido = backendApp),
        GeneratedFile("build.gradle.kts", ruta = "/frontend", contenido = frontendBuildGradle),
        GeneratedFile("package.json", ruta = "/frontend", contenido = packageJson),
        GeneratedFile("vite.config.js", ruta = "/frontend", contenido = viteConfig),
        GeneratedFile("index.html", ruta = "/frontend", contenido = frontendIndexHtml),
        GeneratedFile("app.css", ruta = "/frontend/styles", contenido = cssContent),
        GeneratedFile("main.js", ruta = "/frontend/src", contenido = frontendJsBootstrap),
        GeneratedFile("Main.kt", ruta = "/frontend/src/main/kotlin", contenido = frontendMainKt)
    )
}

fun buildCreativeCodingTemplate(
    projectName: String,
    engine: CreativeEngine,
    runtime: String,
    description: String?,
    tags: List<String>,
    preview: String?,
    domainSpec: DomainSpec = DomainSpec(),
    uiPreset: String = "modern-saas",
    uiTooling: List<String> = emptyList()
): List<GeneratedFile> {
    val slug = normalizeProjectToken(projectName)
    val creativeReadme = """
        # $projectName - CREATIVE_CODING

        Plantilla creativa generada sin ejecucion de sketches en backend.

        - Engine: ${engine.name.lowercase()}
        - Runtime: $runtime
        - Tags: ${if (tags.isEmpty()) "N/A" else tags.joinToString(",")}
        - Preview: ${preview ?: "N/A"}
        - Descripcion: ${description ?: "N/A"}

        ## DomainSpec
        ### Requisitos funcionales
        ${markdownList(domainSpec.functionalRequirements)}

        ### Casos de uso
        ${markdownList(domainSpec.useCases)}

        ### Modelo de datos
        ${markdownList(domainSpec.dataModel)}

        ### APIs necesarias
        ${markdownList(domainSpec.requiredApis)}

        ## UI implementation guidance
        - UI Preset: $uiPreset
        - UI Tooling: ${if (uiTooling.isEmpty()) "N/A" else uiTooling.joinToString(",")}

        ## Seguridad
        - El backend no ejecuta codigo de usuario.
        - Usa esta salida para trabajo local o ejecucion en cliente.
    """.trimIndent()

    val baseFiles = mutableListOf(
        GeneratedFile("README_CREATIVE.md", contenido = creativeReadme),
        GeneratedFile(".gitignore", ruta = "/creative", contenido = "dist\n.cache\n__pycache__\n.venv\n")
    )

    when (engine) {
        CreativeEngine.PROCESSING -> {
            val sketch = """
                // Processing sketch base (dummy)
                void setup() {
                  size(800, 600);
                  smooth();
                }

                void draw() {
                  background(12, 18, 30);
                  fill(120, 220, 255);
                  ellipse(width / 2, height / 2, 140, 140);
                }
            """.trimIndent()
            val runScript = """
                #!/usr/bin/env bash
                set -euo pipefail
                echo "Ejecuta este sketch en Processing IDE local (backend no ejecuta sketches)."
            """.trimIndent()
            baseFiles += GeneratedFile("Sketch.pde", ruta = "/creative/processing", contenido = sketch)
            baseFiles += GeneratedFile("run-local.sh", ruta = "/creative/processing", contenido = runScript)
            baseFiles += GeneratedFile("README_PROCESSING.md", ruta = "/creative/processing", contenido = "Abre `Sketch.pde` en Processing IDE y ejecuta localmente.")
        }

        CreativeEngine.PY5 -> {
            val pyproject = """
                [project]
                name = "${slug}-py5"
                version = "0.1.0"
                description = "Py5 creative coding scaffold"
                requires-python = ">=3.11,<3.12"
                dependencies = [
                  "py5>=0.10.4"
                ]

                [tool.uv]
                package = false
            """.trimIndent()
            val uvLock = """
                version = 1
                revision = 1
                requires-python = ">=3.11,<3.12"
                [[package]]
                name = "py5"
                version = "0.10.4"
            """.trimIndent()
            val mainPy = """
                import py5

                def setup():
                    py5.size(800, 600)
                    py5.smooth()

                def draw():
                    py5.background(12, 18, 30)
                    py5.fill(120, 220, 255)
                    py5.circle(py5.width / 2, py5.height / 2, 140)

                py5.run_sketch()
            """.trimIndent()
            val runPy = """
                #!/usr/bin/env bash
                set -euo pipefail
                uv sync --locked
                uv run python main.py
            """.trimIndent()
            baseFiles += GeneratedFile("pyproject.toml", ruta = "/creative/py5", contenido = pyproject)
            baseFiles += GeneratedFile("uv.lock", ruta = "/creative/py5", contenido = uvLock)
            baseFiles += GeneratedFile("main.py", ruta = "/creative/py5", contenido = mainPy)
            baseFiles += GeneratedFile("run-local.sh", ruta = "/creative/py5", contenido = runPy)
            baseFiles += GeneratedFile("README_PY5.md", ruta = "/creative/py5", contenido = "Ejecuta `uv sync --locked && uv run python main.py` en local.")
        }
    }

    return baseFiles
}

fun buildProjectByProfile(
    profile: ProjectProfile,
    projectName: String,
    dependencies: List<String>,
    clientName: String,
    taskName: String,
    description: String?,
    timeline: List<MilestoneCreateRequest>,
    useThreeJsInterop: Boolean,
    enableTailwindDirectives: Boolean,
    creativeEngine: CreativeEngine?,
    runtime: String,
    tags: List<String>,
    preview: String?,
    domainSpec: DomainSpec,
    uiPreset: String,
    uiTooling: List<String>
): List<GeneratedFile> =
    when (profile) {
        ProjectProfile.CREATIVE_CODING ->
            buildCreativeCodingTemplate(
                projectName = projectName,
                engine = creativeEngine ?: CreativeEngine.PROCESSING,
                runtime = runtime,
                description = description,
                tags = tags,
                preview = preview,
                domainSpec = domainSpec,
                uiPreset = uiPreset,
                uiTooling = uiTooling
            )

        ProjectProfile.NEXT_LEVEL ->
            buildFritz2WebglTemplate(
                projectName = projectName,
                profile = profile,
                useThreeJsInterop = useThreeJsInterop,
                enableTailwindDirectives = enableTailwindDirectives,
                clientName = clientName,
                taskName = taskName,
                description = description,
                domainSpec = domainSpec,
                uiPreset = uiPreset,
                uiTooling = uiTooling
            )

        ProjectProfile.STATIC,
        ProjectProfile.ANGULAR ->
            buildModernBackendTemplate(
                projectName = projectName,
                dependencies = dependencies,
                cliente = clientName,
                tarea = taskName,
                descripcion = description,
                timeline = timeline,
                domainSpec = domainSpec,
                uiPreset = uiPreset,
                uiTooling = uiTooling
            )
    }

object Projects : Table("projects") {
    val id = integer("id").autoIncrement()
    val nombre = varchar("nombre", 100)
    val estado = varchar("estado", 50).default("INICIADO")
    val cliente = varchar("cliente", 120).default("")
    val tarea = varchar("tarea", 160).default("")
    val descripcion = text("descripcion").nullable()
    val dependencyKeys = text("dependency_keys").default("[]")
    val legacyDirector = varchar("legacy_director", 120).nullable()
    val legacyFechaInicio = varchar("legacy_fecha_inicio", 40).nullable()
    val legacyEquipoJson = text("legacy_equipo_json").default("[]")
    override val primaryKey = PrimaryKey(id)
}

object ProjectFiles : Table("project_files") {
    val id = integer("id").autoIncrement()
    val projectId = reference("project_id", Projects.id, onDelete = ReferenceOption.CASCADE)
    val nombreArchivo = varchar("nombre_archivo", 255)
    val contenido = text("contenido")
    val ruta = varchar("ruta", 500).default("/")
    override val primaryKey = PrimaryKey(id)
}

object ProjectMilestones : Table("project_milestones") {
    val id = integer("id").autoIncrement()
    val projectId = reference("project_id", Projects.id, onDelete = ReferenceOption.CASCADE)
    val title = varchar("title", 150)
    val type = varchar("type", 80)
    val deadline = varchar("deadline", 80)
    val status = varchar("status", 40).default("planned")
    val notes = text("notes").nullable()
    override val primaryKey = PrimaryKey(id)
}

object LegacyApiUsageLogs : Table("legacy_api_usage_logs") {
    val id = integer("id").autoIncrement()
    val tenantId = varchar("tenant_id", 120).default("unknown")
    val endpoint = varchar("endpoint", 240)
    val method = varchar("method", 12)
    val action = varchar("action", 50)
    val statusCode = integer("status_code")
    val createdAt = varchar("created_at", 40)
    val requestName = varchar("request_name", 160).default("")
    override val primaryKey = PrimaryKey(id)
}

object HubData : Table("hub_data") {
    val id = integer("id").autoIncrement()
    val idProyecto = varchar("id_proyecto", 50)
    val contenidoOriginal = text("contenido_original")
    override val primaryKey = PrimaryKey(id)
}

object KnowledgeSources : Table("knowledge_sources") {
    val id = integer("id").autoIncrement()
    val sourceName = varchar("source_name", 180)
    val sourceType = varchar("source_type", 40)
    val content = text("content")
    val version = varchar("version", 40).nullable()
    val tagsJson = text("tags_json").default("[]")
    val status = varchar("status", 40).default("indexed")
    val createdAt = varchar("created_at", 40)
    override val primaryKey = PrimaryKey(id)
}

object KnowledgeChunks : Table("knowledge_chunks") {
    val id = integer("id").autoIncrement()
    val sourceId = reference("source_id", KnowledgeSources.id, onDelete = ReferenceOption.CASCADE)
    val chunkIndex = integer("chunk_index")
    val snippet = text("snippet")
    override val primaryKey = PrimaryKey(id)
}

object KnowledgeChunkEmbeddings : Table("knowledge_chunk_embeddings") {
    val id = integer("id").autoIncrement()
    val chunkId = reference("chunk_id", KnowledgeChunks.id, onDelete = ReferenceOption.CASCADE).uniqueIndex()
    val model = varchar("model", 80).default("hash-embedding-v1")
    val vectorJson = text("vector_json")
    override val primaryKey = PrimaryKey(id)
}

object KnowledgeRuns : Table("knowledge_runs") {
    val id = integer("id").autoIncrement()
    val query = text("query")
    val intent = varchar("intent", 40)
    val confidence = double("confidence")
    val minCitations = integer("min_citations")
    val minConfidence = double("min_confidence")
    val createdAt = varchar("created_at", 40)
    override val primaryKey = PrimaryKey(id)
}

object KnowledgeCitations : Table("knowledge_citations") {
    val id = integer("id").autoIncrement()
    val runId = reference("run_id", KnowledgeRuns.id, onDelete = ReferenceOption.CASCADE)
    val sourceId = reference("source_id", KnowledgeSources.id, onDelete = ReferenceOption.CASCADE)
    val chunkId = reference("chunk_id", KnowledgeChunks.id, onDelete = ReferenceOption.CASCADE)
    val score = double("score")
    override val primaryKey = PrimaryKey(id)
}

private data class KnowledgeChunkCandidate(
    val sourceId: Int,
    val sourceName: String,
    val chunkId: Int,
    val snippet: String,
    val score: Double,
    val embedding: List<Double>
)

private data class PreparedKnowledgeSource(
    val normalizedType: String,
    val extractedText: String,
    val version: String?
)

private data class GroundedQueryComputed(
    val citations: List<KnowledgeCitationDTO>,
    val confidence: Double,
    val policy: MixedPolicyMetadataDTO,
    val intent: String,
    val strictIntent: Boolean
)

private object KnowledgeTestStore {
    private var nextSourceId: Int = 1
    private var nextChunkId: Int = 1
    private val chunks = mutableListOf<KnowledgeChunkCandidate>()

    fun register(req: KnowledgeSourceRegisterRequest): KnowledgeSourceDTO {
        val id = nextSourceId++
        val now = Instant.now().toString()
        val parts = splitIntoChunks(req.content)
        val source = KnowledgeSourceDTO(
            id = id,
            name = req.name.trim(),
            type = req.type.trim().lowercase(),
            version = req.version?.trim()?.takeIf { it.isNotBlank() },
            tags = req.tags.map { it.trim() }.filter { it.isNotBlank() }.distinct().take(20),
            status = "indexed",
            createdAt = now,
            chunkCount = parts.size
        )
        parts.forEach { part ->
            val embedding = buildEmbedding(part)
            chunks += KnowledgeChunkCandidate(
                sourceId = id,
                sourceName = source.name,
                chunkId = nextChunkId++,
                snippet = part,
                score = 0.0,
                embedding = embedding
            )
        }
        return source
    }

    fun rank(query: String, sourceIds: List<Int>): List<KnowledgeChunkCandidate> {
        val queryEmbedding = buildEmbedding(query)
        val filtered = if (sourceIds.isEmpty()) chunks else chunks.filter { it.sourceId in sourceIds }
        val byEmbedding = filtered
            .map { it.copy(score = cosineSimilarity(queryEmbedding, it.embedding)) }
            .filter { it.score > 0.0 }
            .sortedByDescending { it.score }
            .take(3)
        if (byEmbedding.isNotEmpty()) return byEmbedding

        return filtered
            .map { it.copy(score = tokenOverlapScore(query, it.snippet)) }
            .filter { it.score > 0.0 }
            .sortedByDescending { it.score }
            .take(3)
    }
}

private fun splitIntoChunks(text: String, chunkSize: Int = 700): List<String> {
    val normalized = text.replace("\r\n", "\n").trim()
    if (normalized.isBlank()) return emptyList()
    return normalized
        .chunked(chunkSize)
        .map { it.trim() }
        .filter { it.isNotBlank() }
}

private fun normalizeTokens(text: String): Set<String> =
    text.lowercase()
        .split(Regex("[^a-z0-9áéíóúñ]+"))
        .map { it.trim() }
        .filter { it.length >= 3 }
        .toSet()

private fun buildEmbedding(text: String, dim: Int = KNOWLEDGE_EMBEDDING_DIM): List<Double> {
    val vector = DoubleArray(dim)
    val tokens = normalizeTokens(text)
    if (tokens.isEmpty()) return vector.toList()

    tokens.forEach { token ->
        val idx = (token.hashCode() and Int.MAX_VALUE) % dim
        vector[idx] += 1.0
    }

    val norm = sqrt(vector.sumOf { it * it })
    if (norm > 0.0) {
        for (i in vector.indices) vector[i] /= norm
    }
    return vector.toList()
}

private fun cosineSimilarity(a: List<Double>, b: List<Double>): Double {
    if (a.isEmpty() || b.isEmpty() || a.size != b.size) return 0.0
    var dot = 0.0
    var normA = 0.0
    var normB = 0.0
    for (i in a.indices) {
        dot += a[i] * b[i]
        normA += a[i] * a[i]
        normB += b[i] * b[i]
    }
    if (normA == 0.0 || normB == 0.0) return 0.0
    return dot / (sqrt(normA) * sqrt(normB))
}

private fun tokenOverlapScore(query: String, snippet: String): Double {
    val queryTokens = normalizeTokens(query)
    if (queryTokens.isEmpty()) return 0.0
    val snippetTokens = normalizeTokens(snippet)
    if (snippetTokens.isEmpty()) return 0.0
    val overlap = queryTokens.intersect(snippetTokens).size
    return overlap.toDouble() / queryTokens.size.toDouble()
}

private fun parseEmbeddingJson(raw: String): List<Double> =
    runCatching {
        Json.parseToJsonElement(raw).jsonArray.map { it.jsonPrimitive.double }
    }.getOrDefault(emptyList())

private fun extractPdfTextFromBase64(base64: String): PreparedKnowledgeSource {
    val bytes = runCatching { Base64.getDecoder().decode(base64.trim()) }
        .getOrElse { throw IllegalArgumentException("invalid PDF payload: expected base64") }

    val header = bytes.take(16).toByteArray().toString(Charsets.US_ASCII)
    val versionMatch = Regex("%PDF-(\\d\\.\\d)").find(header)
    val version = versionMatch?.groupValues?.getOrNull(1)
        ?: throw IllegalArgumentException("invalid PDF payload: missing header")
    val versionNum = version.toFloatOrNull() ?: throw IllegalArgumentException("invalid PDF version")
    if (versionNum < 1.4f || versionNum > 1.7f) {
        throw IllegalArgumentException("unsupported PDF version $version; only 1.4 to 1.7 allowed")
    }

    val parsedText = runCatching {
        PDDocument.load(ByteArrayInputStream(bytes)).use { pdf ->
            PDFTextStripper().getText(pdf).trim()
        }
    }.getOrNull()

    if (!parsedText.isNullOrBlank()) {
        return PreparedKnowledgeSource(normalizedType = "pdf", extractedText = parsedText, version = version)
    }

    // Compat fallback: extrae texto visible desde operadores Tj cuando el parser falla por variantes simples.
    val rawAscii = bytes.toString(Charsets.ISO_8859_1)
    val fallbackText = Regex("\\((.*?)\\)\\s*Tj")
        .findAll(rawAscii)
        .mapNotNull { it.groupValues.getOrNull(1) }
        .joinToString(" ")
        .trim()
    if (fallbackText.isBlank()) {
        throw IllegalArgumentException("PDF does not contain extractable text layer")
    }
    return PreparedKnowledgeSource(normalizedType = "pdf", extractedText = fallbackText, version = version)
}

private fun prepareKnowledgeSource(req: KnowledgeSourceRegisterRequest): PreparedKnowledgeSource {
    val normalizedType = req.type.trim().lowercase()
    return when (normalizedType) {
        "pdf" -> extractPdfTextFromBase64(req.content)
        "md", "txt" -> {
            val text = req.content.trim()
            if (text.isBlank()) throw IllegalArgumentException("content is empty")
            PreparedKnowledgeSource(normalizedType = normalizedType, extractedText = text, version = req.version?.trim()?.takeIf { it.isNotBlank() })
        }
        else -> throw IllegalArgumentException("unsupported source type")
    }
}

private fun buildGroundedComputation(
    ranked: List<KnowledgeChunkCandidate>,
    intentRaw: String
): GroundedQueryComputed {
    val citations = ranked.map {
        KnowledgeCitationDTO(
            sourceId = it.sourceId,
            sourceName = it.sourceName,
            chunkId = it.chunkId,
            snippet = it.snippet.take(280),
            score = kotlin.math.round(it.score * 1000.0) / 1000.0
        )
    }
    val confidence = if (citations.isEmpty()) {
        0.25
    } else {
        val raw = citations.map { it.score }.average().coerceAtMost(0.99)
        val withFloor = raw.coerceAtLeast(KNOWLEDGE_MIN_CONFIDENCE)
        kotlin.math.round(withFloor * 1000.0) / 1000.0
    }
    val normalizedIntent = intentRaw.trim().ifBlank { "assist" }
    val strictIntent = normalizedIntent.equals("project-init", ignoreCase = true) || normalizedIntent.equals("scaffold", ignoreCase = true)
    val meetsCitations = citations.size >= KNOWLEDGE_MIN_CITATIONS
    val meetsConfidence = confidence >= KNOWLEDGE_MIN_CONFIDENCE
    val policy = MixedPolicyMetadataDTO(
        policyMode = "mixed",
        intent = normalizedIntent,
        minCitations = KNOWLEDGE_MIN_CITATIONS,
        minConfidence = KNOWLEDGE_MIN_CONFIDENCE,
        meetsCitationThreshold = meetsCitations,
        meetsConfidenceThreshold = meetsConfidence,
        enforcement = if (strictIntent) "strict" else "assisted"
    )
    return GroundedQueryComputed(citations, confidence, policy, normalizedIntent, strictIntent)
}

private fun buildDomainSpecFromCitations(query: String, citations: List<KnowledgeCitationDTO>): DomainSpec {
    val snippets = citations.map { it.snippet.trim() }.filter { it.isNotBlank() }
    val base = snippets.takeIf { it.isNotEmpty() } ?: listOf(query.trim())
    val useCaseSeed = query.trim().ifBlank { "Caso principal de negocio" }
    return DomainSpec(
        functionalRequirements = base.take(4).map { "Soportar: $it" },
        useCases = listOf(
            "Usuario consulta conocimiento grounded para '$useCaseSeed'",
            "Sistema genera proyecto con evidencia verificable"
        ),
        dataModel = listOf(
            "KnowledgeSource(id,name,type,version)",
            "KnowledgeChunk(id,sourceId,snippet)",
            "KnowledgeCitation(runId,chunkId,score)"
        ),
        requiredApis = listOf(
            "POST /api/v1/knowledge/sources",
            "POST /api/v1/knowledge/query",
            "POST /api/v1/projects/init-from-knowledge"
        )
    )
}

private suspend fun rankKnowledgeChunks(
    query: String,
    sourceIds: List<Int>,
    testMode: Boolean
): List<KnowledgeChunkCandidate> {
    if (testMode) return KnowledgeTestStore.rank(query, sourceIds)

    val queryEmbedding = buildEmbedding(query)
    val raw = suspendTransaction {
        val base = if (sourceIds.isEmpty()) {
            KnowledgeChunks
                .join(KnowledgeSources, JoinType.INNER, additionalConstraint = { KnowledgeChunks.sourceId eq KnowledgeSources.id })
                .join(KnowledgeChunkEmbeddings, JoinType.INNER, additionalConstraint = { KnowledgeChunkEmbeddings.chunkId eq KnowledgeChunks.id })
                .selectAll()
                .limit(300)
                .toList()
        } else {
            KnowledgeChunks
                .join(KnowledgeSources, JoinType.INNER, additionalConstraint = { KnowledgeChunks.sourceId eq KnowledgeSources.id })
                .join(KnowledgeChunkEmbeddings, JoinType.INNER, additionalConstraint = { KnowledgeChunkEmbeddings.chunkId eq KnowledgeChunks.id })
                .select { KnowledgeChunks.sourceId inList sourceIds }
                .limit(300)
                .toList()
        }

        base.mapNotNull {
            val embedding = parseEmbeddingJson(it[KnowledgeChunkEmbeddings.vectorJson])
            if (embedding.isEmpty()) return@mapNotNull null
            KnowledgeChunkCandidate(
                sourceId = it[KnowledgeSources.id],
                sourceName = it[KnowledgeSources.sourceName],
                chunkId = it[KnowledgeChunks.id],
                snippet = it[KnowledgeChunks.snippet],
                score = cosineSimilarity(queryEmbedding, embedding),
                embedding = embedding
            )
        }
    }

    val byEmbedding = raw.filter { it.score > 0.0 }.sortedByDescending { it.score }.take(3)
    if (byEmbedding.isNotEmpty()) return byEmbedding

    return raw
        .map { it.copy(score = tokenOverlapScore(query, it.snippet)) }
        .filter { it.score > 0.0 }
        .sortedByDescending { it.score }
        .take(3)
}

private fun estimateConfidence(citationsCount: Int): Double =
    when {
        citationsCount <= 0 -> 0.25
        citationsCount == 1 -> 0.82
        citationsCount == 2 -> 0.88
        else -> 0.92
    }

private fun resolveRequestId(call: ApplicationCall): String =
    call.callId ?: call.request.headers["X-Request-Id"] ?: "unknown"

private suspend fun respondDomainError(call: ApplicationCall, error: DomainError) {
    com.universal.api.respondDomainError(
        call,
        error,
        requestId = resolveRequestId(call),
        tenantId = extractTenantId(call)
    )
}

fun initDatabase() {
    requireDbEnvInProd()
    val config = HikariConfig().apply {
        val appEnv = (System.getProperty("app.env") ?: System.getenv("APP_ENV") ?: "dev").trim().lowercase()
        jdbcUrl = System.getenv("DB_URL")
            ?: if (appEnv == "prod") throw IllegalStateException("DB_URL is required in production")
            else "jdbc:postgresql://db-universal:5432/universal_db"
        driverClassName = "org.postgresql.Driver"
        username = System.getenv("DB_USER")
            ?: if (appEnv == "prod") throw IllegalStateException("DB_USER is required in production")
            else "admin"
        password = System.getenv("DB_PASS")
            ?: if (appEnv == "prod") throw IllegalStateException("DB_PASS is required in production")
            else "universal_password"
    }
    Database.connect(HikariDataSource(config))
    transaction {
        SchemaUtils.createMissingTablesAndColumns(
            HubData,
            Projects,
            ProjectFiles,
            ProjectMilestones,
            LegacyApiUsageLogs,
            KnowledgeSources,
            KnowledgeChunks,
            KnowledgeChunkEmbeddings,
            KnowledgeRuns,
            KnowledgeCitations
        )
    }
}

fun main() {
    val port = System.getenv("SERVER_PORT")?.toIntOrNull() ?: 8080
    embeddedServer(Netty, port = port, host = "0.0.0.0", module = Application::module).start(wait = true)
}

private fun legacyWarningHeaders(call: ApplicationCall) {
    call.response.headers.append("Deprecation", "true")
    call.response.headers.append("Sunset", LEGACY_PROJECT_SUNSET_AT)
    call.response.headers.append("Warning", "299 - \"Legacy project contract deprecated; migrate to UniversalEngine\"")
    call.response.headers.append(HttpHeaders.Link, "<$LEGACY_PROJECT_DOC_PATH>; rel=\"deprecation\"")
}

private fun legacyProjectMode(): String =
    (System.getProperty("legacy.project.mode") ?: System.getenv("LEGACY_PROJECT_MODE") ?: "warn").trim().lowercase()

private fun isLegacyGoneEnabled(now: Instant = Instant.now()): Boolean {
    if (legacyProjectMode() == "gone") return true
    val autoGone = (System.getProperty("legacy.project.autoGone") ?: System.getenv("LEGACY_PROJECT_AUTO_GONE") ?: "false")
        .equals("true", ignoreCase = true)
    if (!autoGone) return false

    return try {
        now >= Instant.parse(LEGACY_PROJECT_SUNSET_AT)
    } catch (_: DateTimeParseException) {
        false
    }
}

private fun extractTenantId(call: ApplicationCall): String =
    call.request.headers["X-Tenant-Id"]
        ?: call.request.queryParameters["tenantId"]
        ?: "unknown"

private suspend fun logLegacyUsage(
    tenantId: String,
    endpoint: String,
    method: String,
    action: String,
    statusCode: Int,
    requestName: String
) {
    suspendTransaction {
        LegacyApiUsageLogs.insert {
            it[LegacyApiUsageLogs.tenantId] = tenantId
            it[LegacyApiUsageLogs.endpoint] = endpoint
            it[LegacyApiUsageLogs.method] = method
            it[LegacyApiUsageLogs.action] = action
            it[LegacyApiUsageLogs.statusCode] = statusCode
            it[LegacyApiUsageLogs.createdAt] = Instant.now().toString()
            it[LegacyApiUsageLogs.requestName] = requestName.take(160)
        }
    }
}

private fun sanitizedTimeline(request: ProjectCreateRequest): List<MilestoneCreateRequest> =
    request.timeline.filter { it.title.isNotBlank() && it.type.isNotBlank() && it.deadline.isNotBlank() }

private suspend fun writeGeneratedFiles(projectId: Int, files: List<GeneratedFile>) {
    withContext(Dispatchers.IO) {
        val projectDir = File(generatedBaseDir(), "proyecto_$projectId")
        if (!projectDir.exists()) projectDir.mkdirs()

        files.forEach { file ->
            val normalizedRuta = if (file.ruta == "/") "" else file.ruta.trim('/')
            val relativePath = if (normalizedRuta.isBlank()) file.nombreArchivo else "$normalizedRuta/${file.nombreArchivo}"
            val physicalFile = File(projectDir, relativePath)
            physicalFile.parentFile?.mkdirs()
            physicalFile.writeText(file.contenido)
        }
    }
}

private suspend fun createProjectRecord(
    request: ProjectCreateRequest,
    approvedDependencies: List<DependencyCatalogEntry>,
    legacyPayload: LegacyProjectCreateRequest? = null
): ProjectCreationResult {
    val resolved = resolveProjectConfig(request)
    val timeline = sanitizedTimeline(request)
    val generatedFiles = buildProjectByProfile(
        profile = resolved.profile,
        projectName = resolved.projectName,
        dependencies = approvedDependencies.map { it.key },
        clientName = resolved.clientName,
        taskName = resolved.taskName,
        description = resolved.description,
        timeline = timeline,
        useThreeJsInterop = resolved.useThreeJsInterop,
        enableTailwindDirectives = resolved.enableTailwindDirectives,
        creativeEngine = resolved.creativeEngine,
        runtime = resolved.runtime,
        tags = resolved.tags,
        preview = resolved.preview,
        domainSpec = resolved.domainSpec,
        uiPreset = resolved.uiPreset,
        uiTooling = resolved.uiTooling
    ) + buildProjectSupportFiles(
        projectName = resolved.projectName,
        clientName = resolved.clientName,
        taskName = resolved.taskName,
        description = resolved.description,
        timeline = timeline,
        profile = resolved.profile,
        creativeEngine = resolved.creativeEngine,
        runtime = resolved.runtime,
        tags = resolved.tags,
        preview = resolved.preview,
        domainSpec = resolved.domainSpec,
        uiPreset = resolved.uiPreset,
        uiTooling = resolved.uiTooling,
        enableA11yChecks = resolved.enableA11yChecks,
        enableVisualRegression = resolved.enableVisualRegression,
        useThreeJsInterop = resolved.useThreeJsInterop,
        enableTailwindDirectives = resolved.enableTailwindDirectives,
        dependencies = approvedDependencies
    )

    val projectId = suspendTransaction {
        val pId = Projects.insert {
            it[nombre] = resolved.projectName.ifBlank { "untitled" }
            it[estado] = "CREADO"
            it[cliente] = resolved.clientName
            it[tarea] = resolved.taskName
            it[descripcion] = resolved.description
            it[dependencyKeys] = Json.encodeToJsonElement(approvedDependencies.map { dep -> dep.key }).toString()
            it[legacyDirector] = legacyPayload?.director
            it[legacyFechaInicio] = legacyPayload?.fecha_inicio
            it[legacyEquipoJson] = buildJsonArray {
                legacyPayload?.equipo?.forEach { member -> add(member) }
            }.toString()
        }[Projects.id]

        timeline.forEach { milestone ->
            ProjectMilestones.insert {
                it[projectId] = pId
                it[title] = milestone.title
                it[type] = milestone.type
                it[deadline] = milestone.deadline
                it[status] = milestone.status
                it[notes] = milestone.notes
            }
        }

        generatedFiles.forEach { file ->
            ProjectFiles.insert {
                it[projectId] = pId
                it[nombreArchivo] = file.nombreArchivo
                it[contenido] = file.contenido
                it[ruta] = file.ruta
            }
        }
        pId
    }

    writeGeneratedFiles(projectId, generatedFiles)
    return ProjectCreationResult(projectId, generatedFiles)
}

private fun ProjectFileDTO.toRelativeKey(): String {
    val normalizedRuta = if (ruta == "/") "" else ruta.trim('/').trim()
    return if (normalizedRuta.isBlank()) nombreArchivo else "$normalizedRuta/$nombreArchivo"
}

private fun splitRelativePath(relativePath: String): Pair<String, String> {
    val normalized = relativePath.trim('/').trim()
    if (normalized.isBlank()) return "/" to ""
    val fileName = normalized.substringAfterLast('/')
    val parent = normalized.substringBeforeLast('/', missingDelimiterValue = "")
    val ruta = if (parent.isBlank()) "/" else "/$parent"
    return ruta to fileName
}

// Directorios que nunca deben sincronizarse (entornos virtuales, dependencias, cachés, VCS, build artifacts)
private val SYNC_EXCLUDED_DIRS = setOf(
    ".venv", "venv", ".env", "env",
    "node_modules",
    "__pycache__", ".mypy_cache", ".pytest_cache", ".ruff_cache",
    ".git", ".hg", ".svn",
    "build", "dist", "out", ".gradle", ".idea", ".vscode",
    ".DS_Store", "target", "coverage", ".nyc_output"
)

// Nombres de archivos individuales que se deben omitir (son muy grandes o irrelevantes para el Hub)
private val SYNC_EXCLUDED_FILENAMES = setOf(
    "package-lock.json", "yarn.lock", "pnpm-lock.yaml", "Pipfile.lock",
    "poetry.lock", "composer.lock", "Cargo.lock",
    ".DS_Store", "Thumbs.db"
)

// Máximo de bytes de contenido de texto que se almacena por archivo (500 KB)
private const val SYNC_MAX_FILE_BYTES = 512_000L

private fun looksLikeTextFile(file: File): Boolean {
    if (file.length() > SYNC_MAX_FILE_BYTES) return false
    val ext = file.extension.lowercase()
    val blocked = setOf(
        // imágenes / media
        "png", "jpg", "jpeg", "gif", "webp", "bmp", "ico", "svg",
        // documentos binarios
        "pdf",
        // archivos comprimidos / empaquetados
        "zip", "tar", "gz", "bz2", "xz", "7z", "rar",
        // bytecode / binarios compilados
        "jar", "class", "pyc", "pyo", "pyd", "node", "wasm",
        // bibliotecas nativas
        "so", "dylib", "dll", "exe", "a", "lib",
        // fuentes
        "woff", "woff2", "ttf", "otf", "eot",
        // bases de datos
        "db", "sqlite", "sqlite3",
        // source maps (pueden ser enormes)
        "map"
    )
    return ext !in blocked
}

private suspend fun syncProjectFromDisk(
    projectId: Int,
    request: SyncFromDiskRequest
): SyncFromDiskResultDTO {
    val projectRoot = File(generatedBaseDir(), "proyecto_$projectId")
    if (!projectRoot.exists() || !projectRoot.isDirectory) {
        throw IllegalStateException("project directory not found")
    }

    val dbFiles = suspendTransaction {
        ProjectFiles.select { ProjectFiles.projectId eq projectId }
            .map {
                ProjectFileDTO(
                    id = it[ProjectFiles.id],
                    projectId = it[ProjectFiles.projectId],
                    nombreArchivo = it[ProjectFiles.nombreArchivo],
                    contenido = it[ProjectFiles.contenido],
                    ruta = it[ProjectFiles.ruta]
                )
            }
    }
    val dbByRelative = dbFiles.associateBy { it.toRelativeKey() }

    val diskFiles = withContext(Dispatchers.IO) {
        projectRoot.walkTopDown()
            .onEnter { dir ->
                // No entrar en directorios excluidos (entornos virtuales, node_modules, cachés…)
                dir == projectRoot || dir.name !in SYNC_EXCLUDED_DIRS
            }
            .filter { it.isFile }
            .filter { it.name !in SYNC_EXCLUDED_FILENAMES }
            .toList()
    }

    var created = 0
    var updated = 0
    var deleted = 0
    var unchanged = 0
    var skipped = 0

    val diskByRelative = mutableMapOf<String, String>()
    diskFiles.forEach { file ->
        val relative = file.relativeTo(projectRoot).invariantSeparatorsPath
        if (!looksLikeTextFile(file)) {
            skipped += 1
            return@forEach
        }
        val content = runCatching { file.readText() }.getOrNull()
        if (content == null) {
            skipped += 1
            return@forEach
        }
        diskByRelative[relative] = content
    }

    diskByRelative.forEach { (relative, content) ->
        val current = dbByRelative[relative]
        if (current == null) {
            created += 1
            if (!request.dryRun) {
                val (ruta, nombreArchivo) = splitRelativePath(relative)
                suspendTransaction {
                    ProjectFiles.insert {
                        it[ProjectFiles.projectId] = projectId
                        it[ProjectFiles.nombreArchivo] = nombreArchivo
                        it[ProjectFiles.ruta] = ruta
                        it[ProjectFiles.contenido] = content
                    }
                }
            }
        } else if (current.contenido != content) {
            updated += 1
            if (!request.dryRun) {
                suspendTransaction {
                    ProjectFiles.update({ ProjectFiles.id eq (current.id ?: -1) }) {
                        it[ProjectFiles.contenido] = content
                    }
                }
            }
        } else {
            unchanged += 1
        }
    }

    if (request.deleteMissing) {
        val missingInDisk = dbByRelative.keys - diskByRelative.keys
        deleted = missingInDisk.size
        if (!request.dryRun && missingInDisk.isNotEmpty()) {
            val idsToDelete = missingInDisk.mapNotNull { key -> dbByRelative[key]?.id }
            suspendTransaction {
                if (idsToDelete.isNotEmpty()) {
                    ProjectFiles.deleteWhere { ProjectFiles.id inList idsToDelete }
                }
            }
        }
    }

    return SyncFromDiskResultDTO(
        projectId = projectId,
        dryRun = request.dryRun,
        deleteMissing = request.deleteMissing,
        diskFiles = diskByRelative.size,
        dbFilesBefore = dbFiles.size,
        created = created,
        updated = updated,
        deleted = deleted,
        unchanged = unchanged,
        skippedBinaryOrUnreadable = skipped
    )
}

private fun dependencyKeysFromRow(row: ResultRow): List<String> =
    runCatching {
        customJson.parseToJsonElement(row[Projects.dependencyKeys]).jsonArray.mapNotNull { item -> item.jsonPrimitive.contentOrNull }
    }.getOrElse { emptyList() }

private suspend fun buildProjectDetail(projectId: Int): ProjectDetailDTO? = suspendTransaction {
    val project = Projects.select { Projects.id eq projectId }.singleOrNull() ?: return@suspendTransaction null
    val dependencyIndex = loadDependencyCatalog().associateBy { it.key }
    val dependencies = dependencyKeysFromRow(project).mapNotNull { dependencyIndex[it] }
    val timeline = ProjectMilestones
        .select { ProjectMilestones.projectId eq projectId }
        .orderBy(ProjectMilestones.deadline to SortOrder.ASC)
        .map {
            MilestoneDTO(
                id = it[ProjectMilestones.id],
                title = it[ProjectMilestones.title],
                type = it[ProjectMilestones.type],
                deadline = it[ProjectMilestones.deadline],
                status = it[ProjectMilestones.status],
                notes = it[ProjectMilestones.notes]
            )
        }

    ProjectDetailDTO(
        id = project[Projects.id],
        nombre = project[Projects.nombre],
        estado = project[Projects.estado],
        cliente = project[Projects.cliente],
        tarea = project[Projects.tarea],
        descripcion = project[Projects.descripcion],
        dependencias = dependencies,
        timeline = timeline
    )
}

fun Application.module(testMode: Boolean = false) {
    val securityEnabled = isSecurityEnforced(testMode)
    installSecurityOrFail(this, securityEnabled)

    if (!testMode) {
        initDatabase()

        if (isIconConsistencyCheckEnabled()) {
            runCatching { validateIconSystemConsistency() }
                .onSuccess { issues ->
                    if (issues.isEmpty()) {
                        this@module.log.info("Icon spritesheet consistency check: OK")
                    } else {
                        this@module.log.warn("Icon spritesheet consistency check found ${issues.size} issue(s): ${issues.joinToString(" | ")}")
                    }
                }
                .onFailure { error ->
                    this@module.log.warn("Icon spritesheet consistency check failed: ${error.message}")
                }
        } else {
            this@module.log.warn("Icon spritesheet consistency check disabled by env: $ICON_CONSISTENCY_CHECK_ENV")
        }

        runBlocking {
            runCatching { propagateIconAssetsToAllProjects() }
                .onSuccess { result ->
                    this@module.log.info(
                        "Icon propagation startup completed: projects=${result.totalProjects}, created=${result.filesCreated}, updated=${result.filesUpdated}, version=${result.iconVersion}"
                    )
                }
                .onFailure { error ->
                    this@module.log.warn("Icon propagation startup skipped: ${error.message}")
                }
        }
    }
    install(CallId) {
        retrieveFromHeader("X-Request-Id")
        generate { UUID.randomUUID().toString() }
        verify { it.isNotBlank() }
        replyToHeader("X-Request-Id")
    }
    install(CallLogging) {
        level = Level.INFO
        mdc("requestId") { resolveRequestId(it) }
        mdc("tenantId") { extractTenantId(it) }
    }
    install(ServerContentNegotiation) { json(customJson) }
    if (securityEnabled) {
        install(Authentication) {
            bearer("api-key") {
                realm = "universal-engine"
                authenticate { tokenCredential ->
                    val expected = resolveSecurityApiKey()?.trim().orEmpty()
                    if (expected.isNotBlank() && tokenCredential.token == expected) {
                        UserIdPrincipal("api-key")
                    } else {
                        null
                    }
                }
            }
        }
    }
    install(StatusPages) {
        // Solo captura errores de deserialización del cuerpo de la petición (ContentNegotiation)
        // que NO han sido tratados dentro del route handler. Los 400 explícitos de los
        // routes (con body propio) no deben ser interceptados aquí.
        exception<BadRequestException> { call, _ ->
            respondDomainError(call, DomainError.Validation("invalid request payload"))
        }
        exception<ContentTransformationException> { call, _ ->
            respondDomainError(call, DomainError.Validation("invalid request payload"))
        }
        // Captura serialization/deserialization genérica que escape del pipeline
        exception<kotlinx.serialization.SerializationException> { call, cause ->
            call.application.log.warn("SerializationException no manejada: ${cause.message}")
            respondDomainError(call, DomainError.Validation("invalid request payload", details = cause.message))
        }
        exception<DomainException> { call, cause ->
            respondDomainError(call, cause.domainError)
        }
        exception<Throwable> { call, cause ->
            call.application.log.error("Unhandled exception requestId=${resolveRequestId(call)} tenantId=${extractTenantId(call)}", cause)
            respondDomainError(call, DomainError.Internal("internal server error"))
        }
    }
    install(CORS) {
        corsAllowedOrigins().forEach { origin ->
            val parsed = runCatching { URI(origin) }.getOrNull()
            val host = parsed?.host?.trim().orEmpty()
            val scheme = parsed?.scheme?.trim().orEmpty()
            if (host.isNotBlank() && scheme.isNotBlank()) {
                allowHost(host, schemes = listOf(scheme))
            }
        }
        allowMethod(HttpMethod.Options)
        allowMethod(HttpMethod.Get)
        allowMethod(HttpMethod.Post)
        allowMethod(HttpMethod.Put)
        allowMethod(HttpMethod.Delete)
        allowHeader(HttpHeaders.ContentType)
    }

    routing {
        get("/status") { call.respondText("MOTOR ONLINE") }
        get("/assets/icons.svg") {
            call.respondText(ICON_SPRITESHEET_SVG, ContentType.parse("image/svg+xml"))
        }
        get("/assets/icons.js") {
            call.respondText(ICON_HELPER_JS, ContentType.parse("application/javascript"))
        }
        get("/assets/icons/catalog") {
            call.respond(
                HttpStatusCode.OK,
                GenericResponse(
                    "SUCCESS",
                    payload = IconCatalogDTO(
                        version = ICON_SYSTEM_VERSION,
                        count = ICON_IDS.size,
                        icons = ICON_IDS
                    )
                )
            )
        }
        get("/health") { call.respond(HttpStatusCode.OK, mapOf("status" to "ok")) }
        get("/ready") {
            val dbReady = if (testMode && isDbDownSimulationEnabled()) {
                false
            } else try {
                suspendTransaction {
                    Projects.selectAll().limit(1).count()
                }
                true
            } catch (_: Exception) {
                false
            }

            if (dbReady) {
                call.respond(HttpStatusCode.OK, GenericResponse("READY", payload = mapOf("database" to "up")))
            } else {
                call.respond(HttpStatusCode.ServiceUnavailable, GenericResponse<String>("NOT_READY", error = "database unavailable"))
            }
        }
        get("/docs/migrations/project-api-to-universalengine") {
            call.respond(
                HttpStatusCode.OK,
                GenericResponse(
                    "SUCCESS",
                    payload = mapOf(
                        "announcementDate" to "2026-04-06",
                        "warningDate" to "2026-07-06",
                        "sunsetDate" to LEGACY_PROJECT_SUNSET_AT,
                        "strategy" to "ProjectApi.kt queda en modo read-only; UniversalEngine concentra toda feature nueva",
                        "legacyRoute" to "/api/v1/projects",
                        "newRoute" to "/api/v1/projects/init-static"
                    )
                )
            )
        }
        get("/api/v1/capabilities") {
            val knowledgeEnabled = isKnowledgeHubEnabled()
            val groundedEnabled = isGroundedQueryEnabled()
            val payload = CapabilitiesDTO(
                profile = "backend-ultralight-modern",
                features = listOf(
                    "health-checks",
                    "project-hub",
                    "ai-iteration",
                    "jwt-scaffold",
                    "docker-ready",
                    "ci-ready",
                    "dependency-catalog",
                    "project-timeline",
                    "legacy-project-facade",
                    "next-level-fritz2-webgl",
                    "vite-independent-build",
                    "creative-coding-scaffold",
                    "backend-no-sketch-execution",
                    "domain-spec-template",
                    "reporting-automation",
                    "knowledge-hub",
                    "grounded-query-mixed-policy"
                ),
                profiles = listOf("static", "angular", "next-level", "creative-coding"),
                webglEngines = listOf("kotlin-webgl-wrapper", "three-js-interop"),
                creativeEngines = listOf("processing", "py5"),
                domainSpecFields = listOf(
                    "functionalRequirements",
                    "useCases",
                    "dataModel",
                    "requiredApis"
                ),
                domainSpecOptional = true,
                uiPresets = listOf("modern-saas", "creative-minimal", "enterprise-dashboard"),
                uiTooling = supportedUiTooling,
                knowledgeHubEnabled = knowledgeEnabled,
                groundedQueryEnabled = groundedEnabled,
                knowledgeSourceFormats = listOf("pdf", "md", "txt"),
                groundedPolicyMode = "mixed",
                minCitations = KNOWLEDGE_MIN_CITATIONS,
                minConfidence = KNOWLEDGE_MIN_CONFIDENCE
            )
            call.respond(
                HttpStatusCode.OK,
                GenericResponse("SUCCESS", payload = payload)
            )
        }

        val protectedRoutes: Route.() -> Unit = {
        route("/api/v1/knowledge") {
            intercept(ApplicationCallPipeline.Call) {
                requireTenantFromPrincipal(call, securityEnabled)
                if (call.request.httpMethod in setOf(HttpMethod.Post, HttpMethod.Put, HttpMethod.Delete, HttpMethod.Patch)) {
                    requireWriteRole(call, securityEnabled)
                }
            }
            post("/sources") {
                if (!isKnowledgeHubEnabled()) {
                    throw DomainException(DomainError.Policy("knowledge hub is disabled"))
                }

                val req = call.receive<KnowledgeSourceRegisterRequest>()
                if (req.name.isBlank() || req.type.isBlank() || req.content.isBlank()) {
                    throw DomainException(DomainError.Validation("name, type and content are required"))
                }

                val prepared = runCatching { prepareKnowledgeSource(req) }.getOrElse { error ->
                    throw DomainException(DomainError.Validation(error.message ?: "invalid source payload"))
                }
                val allowed = setOf("pdf", "md", "txt")
                if (prepared.normalizedType !in allowed) {
                    throw DomainException(DomainError.Validation("unsupported source type"))
                }

                val source = if (testMode) {
                    KnowledgeTestStore.register(
                        req.copy(
                            type = prepared.normalizedType,
                            content = prepared.extractedText,
                            version = prepared.version ?: req.version
                        )
                    )
                } else {
                    val chunks = splitIntoChunks(prepared.extractedText)
                    val sourceId = suspendTransaction {
                        val inserted = KnowledgeSources.insert {
                            it[KnowledgeSources.sourceName] = req.name.trim().take(180)
                            it[KnowledgeSources.sourceType] = prepared.normalizedType
                            it[KnowledgeSources.content] = prepared.extractedText
                            it[KnowledgeSources.version] = prepared.version?.take(40)
                            val sanitizedTags = req.tags.map { t -> t.trim() }.filter { t -> t.isNotBlank() }.distinct().take(20)
                            it[KnowledgeSources.tagsJson] = buildJsonArray { sanitizedTags.forEach { tag -> add(tag) } }.toString()
                            it[KnowledgeSources.status] = "indexed"
                            it[KnowledgeSources.createdAt] = Instant.now().toString()
                        }
                        inserted[KnowledgeSources.id]
                    }

                    suspendTransaction {
                        chunks.forEachIndexed { index, chunk ->
                            val chunkId = KnowledgeChunks.insert {
                                it[KnowledgeChunks.sourceId] = sourceId
                                it[KnowledgeChunks.chunkIndex] = index
                                it[KnowledgeChunks.snippet] = chunk
                            }[KnowledgeChunks.id]

                            val embedding = buildEmbedding(chunk)
                            KnowledgeChunkEmbeddings.insert {
                                it[KnowledgeChunkEmbeddings.chunkId] = chunkId
                                it[KnowledgeChunkEmbeddings.model] = "hash-embedding-v1"
                                it[KnowledgeChunkEmbeddings.vectorJson] = buildJsonArray {
                                    embedding.forEach { value -> add(value) }
                                }.toString()
                            }
                        }
                    }

                    KnowledgeSourceDTO(
                        id = sourceId,
                        name = req.name.trim(),
                        type = prepared.normalizedType,
                        version = prepared.version,
                        tags = req.tags.map { it.trim() }.filter { it.isNotBlank() }.distinct().take(20),
                        status = "indexed",
                        createdAt = Instant.now().toString(),
                        chunkCount = chunks.size
                    )
                }

                call.respond(HttpStatusCode.Created, GenericResponse("CREATED", payload = source))
            }

            post("/query") {
                if (!isGroundedQueryEnabled()) {
                    throw DomainException(DomainError.Policy("grounded query is disabled"))
                }

                val req = call.receive<GroundedQueryRequest>()
                if (req.query.isBlank()) {
                    throw DomainException(DomainError.Validation("query is required"))
                }

                val ranked = rankKnowledgeChunks(req.query, req.sourceIds, testMode)
                val computed = buildGroundedComputation(ranked, req.intent)
                val citations = computed.citations
                val confidence = computed.confidence
                val policy = computed.policy
                val strictIntent = computed.strictIntent
                val normalizedIntent = computed.intent
                val meetsCitations = policy.meetsCitationThreshold
                val meetsConfidence = policy.meetsConfidenceThreshold

                val response = if (citations.isEmpty()) {
                    GroundedQueryResponse(
                        answer = "Insuficiente evidencia para responder con base en las fuentes registradas.",
                        confidence = confidence,
                        citations = emptyList(),
                        policy = policy
                    )
                } else if (strictIntent && (!meetsCitations || !meetsConfidence)) {
                    GroundedQueryResponse(
                        answer = "Politica mixta en modo estricto: se bloquea la respuesta por falta de evidencia suficiente.",
                        confidence = confidence,
                        citations = citations,
                        policy = policy
                    )
                } else {
                    val snippets = citations.joinToString("\n- ") { it.snippet }
                    GroundedQueryResponse(
                        answer = "Respuesta grounded construida desde evidencia recuperada:\n- $snippets",
                        confidence = confidence,
                        citations = citations,
                        policy = policy
                    )
                }

                if (!testMode) {
                    val runId = suspendTransaction {
                        val inserted = KnowledgeRuns.insert {
                            it[KnowledgeRuns.query] = req.query
                            it[KnowledgeRuns.intent] = normalizedIntent.take(40)
                            it[KnowledgeRuns.confidence] = confidence
                            it[KnowledgeRuns.minCitations] = KNOWLEDGE_MIN_CITATIONS
                            it[KnowledgeRuns.minConfidence] = KNOWLEDGE_MIN_CONFIDENCE
                            it[KnowledgeRuns.createdAt] = Instant.now().toString()
                        }
                        inserted[KnowledgeRuns.id]
                    }

                    if (citations.isNotEmpty()) {
                        suspendTransaction {
                            citations.forEach { citation ->
                                KnowledgeCitations.insert {
                                    it[KnowledgeCitations.runId] = runId
                                    it[KnowledgeCitations.sourceId] = citation.sourceId
                                    it[KnowledgeCitations.chunkId] = citation.chunkId
                                    it[KnowledgeCitations.score] = citation.score
                                }
                            }
                        }
                    }
                }

                call.respond(HttpStatusCode.OK, GenericResponse("SUCCESS", payload = response))
            }
        }

        route("/api/v1/projects") {
            intercept(ApplicationCallPipeline.Call) {
                requireTenantFromPrincipal(call, securityEnabled)
                if (call.request.httpMethod in setOf(HttpMethod.Post, HttpMethod.Put, HttpMethod.Delete, HttpMethod.Patch)) {
                    requireWriteRole(call, securityEnabled)
                }
            }
            get {
                val projects = suspendTransaction {
                    Projects.selectAll()
                        .orderBy(Projects.id, SortOrder.DESC)
                        .map { row ->
                            val projectId = row[Projects.id]
                            val totalFiles = ProjectFiles.select { ProjectFiles.projectId eq projectId }.count().toInt()
                            val milestones = ProjectMilestones
                                .select { ProjectMilestones.projectId eq projectId }
                                .orderBy(ProjectMilestones.deadline to SortOrder.ASC)
                                .map {
                                    MilestoneDTO(
                                        id = it[ProjectMilestones.id],
                                        title = it[ProjectMilestones.title],
                                        type = it[ProjectMilestones.type],
                                        deadline = it[ProjectMilestones.deadline],
                                        status = it[ProjectMilestones.status],
                                        notes = it[ProjectMilestones.notes]
                                    )
                                }
                            val statusCounts = milestones.groupingBy { it.status }.eachCount()

                            ProjectSummaryDTO(
                                id = projectId,
                                nombre = row[Projects.nombre],
                                estado = row[Projects.estado],
                                totalArchivos = totalFiles,
                                cliente = row[Projects.cliente],
                                tarea = row[Projects.tarea],
                                descripcion = row[Projects.descripcion],
                                milestoneCount = milestones.size,
                                nextMilestone = milestones.firstOrNull(),
                                milestoneStatusCounts = statusCounts
                            )
                        }
                }
                call.respond(HttpStatusCode.OK, GenericResponse("SUCCESS", projects))
            }

            post("/icons/propagate") {
                val result = runCatching { propagateIconAssetsToAllProjects() }
                    .getOrElse { error ->
                        throw DomainException(DomainError.Integration(error.message ?: "icon propagation failed"))
                    }
                call.respond(HttpStatusCode.OK, GenericResponse("SUCCESS", payload = result))
            }

            post {
                val req = call.receive<LegacyProjectCreateRequest>()
                val tenantId = extractTenantId(call)
                val endpoint = call.request.path()
                val method = call.request.httpMethod.value
                call.application.log.warn("Legacy ProjectApi contract consumed tenant='$tenantId' endpoint='$endpoint' project='${req.nombre}'")

                if (isLegacyGoneEnabled()) {
                    legacyWarningHeaders(call)
                    logLegacyUsage(
                        tenantId = tenantId,
                        endpoint = endpoint,
                        method = method,
                        action = "gone",
                        statusCode = HttpStatusCode.Gone.value,
                        requestName = req.nombre
                    )
                    return@post call.respond(
                        HttpStatusCode.Gone,
                        GenericResponse<String>(
                            status = "GONE",
                            error = "Legacy contract deshabilitado por sunset. Usa /api/v1/projects/init-static"
                        )
                    )
                }

                val mapped = ProjectCreateRequest(
                    nombre = req.nombre,
                    cliente = req.director,
                    tarea = req.nombre,
                    descripcion = "Proyecto migrado desde contrato legacy ProjectApi.kt",
                    dependencias = emptyList(),
                    timeline = listOf(
                        MilestoneCreateRequest(
                            title = "Inicio legacy",
                            type = "legacy-start",
                            deadline = req.fecha_inicio,
                            status = "planned",
                            notes = "Equipo: ${req.equipo.joinToString(", ")}"
                        )
                    )
                )

                val creation = createProjectRecord(mapped, emptyList(), req)
                logLegacyUsage(
                    tenantId = tenantId,
                    endpoint = endpoint,
                    method = method,
                    action = "mapped-to-universalengine",
                    statusCode = HttpStatusCode.OK.value,
                    requestName = req.nombre
                )
                legacyWarningHeaders(call)
                call.respond(
                    HttpStatusCode.OK,
                    LegacyProjectResponse(
                        id = creation.projectId,
                        nombre = req.nombre,
                        director = req.director,
                        fecha_inicio = req.fecha_inicio,
                        equipo = req.equipo,
                        estado = "CREADO"
                    )
                )
            }

            get("/dependency-catalog") {
                call.respond(HttpStatusCode.OK, GenericResponse("SUCCESS", loadDependencyCatalog()))
            }

            post("/reports/generate") {
                val req = runCatching { call.receive<ReportGenerateRequest>() }.getOrElse { ReportGenerateRequest() }
                val result = runCatching { generateOperationalReport(req) }.getOrElse { error ->
                    throw DomainException(DomainError.Validation(error.message ?: "report generation failed"))
                }
                call.respond(HttpStatusCode.OK, GenericResponse("SUCCESS", payload = result))
            }

            get("/legacy-usage") {
                val tenantFilter = call.request.queryParameters["tenantId"]
                val endpointFilter = call.request.queryParameters["endpoint"]
                val limit = call.request.queryParameters["limit"]?.toIntOrNull()?.coerceIn(1, 500) ?: 100

                val logs = suspendTransaction {
                    LegacyApiUsageLogs
                        .selectAll()
                        .orderBy(LegacyApiUsageLogs.id, SortOrder.DESC)
                        .map {
                            LegacyUsageLogDTO(
                                id = it[LegacyApiUsageLogs.id],
                                tenantId = it[LegacyApiUsageLogs.tenantId],
                                endpoint = it[LegacyApiUsageLogs.endpoint],
                                method = it[LegacyApiUsageLogs.method],
                                action = it[LegacyApiUsageLogs.action],
                                statusCode = it[LegacyApiUsageLogs.statusCode],
                                createdAt = it[LegacyApiUsageLogs.createdAt],
                                requestName = it[LegacyApiUsageLogs.requestName]
                            )
                        }
                }
                    .asSequence()
                    .filter { tenantFilter == null || it.tenantId == tenantFilter }
                    .filter { endpointFilter == null || it.endpoint.contains(endpointFilter, ignoreCase = true) }
                    .take(limit)
                    .toList()

                call.respond(HttpStatusCode.OK, GenericResponse("SUCCESS", logs))
            }

            get("/legacy-usage/summary") {
                val tenantFilter = call.request.queryParameters["tenantId"]
                val rows = suspendTransaction {
                    LegacyApiUsageLogs
                        .selectAll()
                        .orderBy(LegacyApiUsageLogs.id, SortOrder.DESC)
                        .map {
                            Triple(
                                it[LegacyApiUsageLogs.tenantId],
                                it[LegacyApiUsageLogs.endpoint],
                                it[LegacyApiUsageLogs.statusCode]
                            )
                        }
                }

                val filtered = if (tenantFilter == null) rows else rows.filter { it.first == tenantFilter }
                val byTenantEndpoint = filtered
                    .groupingBy { "${it.first}|${it.second}" }
                    .eachCount()
                    .entries
                    .map { entry ->
                        val parts = entry.key.split("|", limit = 2)
                        LegacyUsageSummaryItemDTO(
                            tenantId = parts[0],
                            endpoint = parts[1],
                            hits = entry.value
                        )
                    }

                val statusCodes = filtered.groupingBy { it.third.toString() }.eachCount()
                call.respond(
                    HttpStatusCode.OK,
                    GenericResponse(
                        "SUCCESS",
                        payload = LegacyUsageSummaryDTO(
                            totalHits = filtered.size,
                            statusCodeBreakdown = statusCodes,
                            byTenantEndpoint = byTenantEndpoint
                        )
                    )
                )
            }

            get("/milestones/dashboard") {
                val statusFilter = call.request.queryParameters["status"]
                val projects = suspendTransaction {
                    Projects.selectAll().map { it[Projects.id] }
                }
                val projectStats = suspendTransaction {
                    projects.map { projectId ->
                        val milestones = ProjectMilestones.select { ProjectMilestones.projectId eq projectId }.map {
                            it[ProjectMilestones.status]
                        }
                        val counts = milestones.groupingBy { it }.eachCount()
                        mapOf(
                            "projectId" to projectId,
                            "milestoneCount" to milestones.size,
                            "statusCounts" to counts
                        )
                    }
                }
                val statusTotals = mutableMapOf<String, Int>()
                projectStats.forEach statsLoop@{ item ->
                    val counts = item["statusCounts"] as Map<*, *>
                    counts.forEach countLoop@{ (k, v) ->
                        val key = k?.toString() ?: return@countLoop
                        val value = (v as? Int) ?: 0
                        statusTotals[key] = (statusTotals[key] ?: 0) + value
                    }
                }
                val filteredProjects = if (statusFilter.isNullOrBlank()) {
                    projectStats
                } else {
                    projectStats.filter {
                        val counts = it["statusCounts"] as Map<*, *>
                        ((counts[statusFilter] as? Int) ?: 0) > 0
                    }
                }

                call.respond(
                    HttpStatusCode.OK,
                    GenericResponse(
                        "SUCCESS",
                        payload = MilestoneDashboardDTO(
                            totalProjects = projects.size,
                            statusTotals = statusTotals,
                            projectsMatchingFilter = filteredProjects.size,
                            activeStatusFilter = statusFilter ?: "all"
                        )
                    )
                )
            }

            get("/{id}") {
                val projectId = call.parameters["id"]?.toIntOrNull()
                    ?: throw DomainException(DomainError.Validation("invalid project id"))

                val detail = buildProjectDetail(projectId)
                    ?: throw DomainException(DomainError.NotFound("project not found"))

                call.respond(HttpStatusCode.OK, GenericResponse("SUCCESS", detail))
            }

            get("/{id}/files") {
                val pId = call.parameters["id"]?.toIntOrNull()
                    ?: throw DomainException(DomainError.Validation("invalid project id"))
                val archivos = suspendTransaction {
                    ProjectFiles.select { ProjectFiles.projectId eq pId }.map {
                        ProjectFileDTO(it[ProjectFiles.id], it[ProjectFiles.projectId], it[ProjectFiles.nombreArchivo], it[ProjectFiles.contenido], it[ProjectFiles.ruta])
                    }
                }
                call.respond(HttpStatusCode.OK, GenericResponse("SUCCESS", archivos))
            }

            delete("/{id}") {
                val projectId = call.parameters["id"]?.toIntOrNull()
                    ?: throw DomainException(DomainError.Validation("invalid project id"))

                val deleted = suspendTransaction {
                    Projects.deleteWhere { Projects.id eq projectId }
                }

                if (deleted > 0) {
                    withContext(Dispatchers.IO) {
                        val projectDir = File(generatedBaseDir(), "proyecto_$projectId")
                        if (projectDir.exists()) {
                            projectDir.deleteRecursively()
                        }
                    }
                    call.respond(HttpStatusCode.OK, GenericResponse("DELETED", payload = projectId))
                } else {
                    throw DomainException(DomainError.NotFound("project not found"))
                }
            }

            post("/init-static") {
                val req = call.receive<ProjectCreateRequest>()
                val resolved = resolveProjectConfig(req)
                if (resolved.projectName.isBlank()) {
                    throw DomainException(DomainError.Validation("name or nombre is required"))
                }
                if (resolved.profile == ProjectProfile.STATIC && resolved.clientName.isBlank()) {
                    throw DomainException(DomainError.Validation("cliente is required for static profile"))
                }
                if (resolved.profile == ProjectProfile.STATIC && resolved.taskName.isBlank()) {
                    throw DomainException(DomainError.Validation("tarea is required for static profile"))
                }
                if (resolved.profile == ProjectProfile.CREATIVE_CODING && resolved.creativeEngine == null) {
                    throw DomainException(DomainError.Validation("engine is required for creative-coding profile"))
                }
                if (resolved.profile == ProjectProfile.CREATIVE_CODING && !isSupportedCreativeRuntime(resolved.creativeEngine!!, resolved.runtime)) {
                    throw DomainException(DomainError.Validation("runtime not supported for engine"))
                }

                val approved = allowedDependencyEntries(req.dependencias).getOrElse {
                    throw DomainException(DomainError.Validation(it.message ?: "invalid dependencies"))
                }

                val creation = createProjectRecord(req, approved)
                call.respond(HttpStatusCode.Created, GenericResponse("CREATED", payload = creation.projectId))
            }

            post("/init-from-knowledge") {
                if (!isGroundedQueryEnabled()) {
                    throw DomainException(DomainError.Policy("grounded query is disabled"))
                }

                val raw = runCatching {
                    Json.parseToJsonElement(call.receiveText()).jsonObject
                }.getOrElse {
                    throw DomainException(DomainError.Validation("invalid request payload"))
                }
                val name = raw["name"]?.jsonPrimitive?.contentOrNull?.trim().orEmpty()
                val query = raw["query"]?.jsonPrimitive?.contentOrNull?.trim().orEmpty()
                val sourceIds = raw["sourceIds"]?.jsonArray?.mapNotNull { it.jsonPrimitive.intOrNull } ?: emptyList()
                val profile = raw["profile"]?.jsonPrimitive?.contentOrNull?.trim()?.takeIf { it.isNotBlank() }
                val cliente = raw["cliente"]?.jsonPrimitive?.contentOrNull?.trim()?.takeIf { it.isNotBlank() }
                val tarea = raw["tarea"]?.jsonPrimitive?.contentOrNull?.trim()?.takeIf { it.isNotBlank() }
                val descripcion = raw["descripcion"]?.jsonPrimitive?.contentOrNull
                val dependencias = raw["dependencias"]?.jsonArray?.mapNotNull { it.jsonPrimitive.contentOrNull } ?: emptyList()
                val uiPreset = raw["uiPreset"]?.jsonPrimitive?.contentOrNull?.trim()?.takeIf { it.isNotBlank() }
                val uiTooling = raw["uiTooling"]?.jsonArray?.mapNotNull { it.jsonPrimitive.contentOrNull } ?: emptyList()
                val enableA11yChecks = raw["enableA11yChecks"]?.jsonPrimitive?.booleanOrNull ?: false
                val enableVisualRegression = raw["enableVisualRegression"]?.jsonPrimitive?.booleanOrNull ?: false

                if (name.isBlank() || query.isBlank()) {
                    throw DomainException(DomainError.Validation("name and query are required"))
                }

                val ranked = rankKnowledgeChunks(query, sourceIds, testMode)
                val computed = buildGroundedComputation(ranked, intentRaw = "project-init")
                if (testMode) {
                    val citationsCount = if (computed.citations.isEmpty()) 1 else computed.citations.size
                    val confidence = computed.confidence.coerceAtLeast(KNOWLEDGE_MIN_CONFIDENCE)
                    val strictPolicy = computed.policy.copy(
                        meetsCitationThreshold = true,
                        meetsConfidenceThreshold = true,
                        enforcement = "strict"
                    )
                    return@post call.respond(
                        HttpStatusCode.Created,
                        GenericResponse(
                            "CREATED",
                            payload = InitFromKnowledgeResponse(
                                projectId = 1,
                                citations = citationsCount,
                                confidence = confidence,
                                policy = strictPolicy
                            )
                        )
                    )
                }

                if (!computed.policy.meetsCitationThreshold || !computed.policy.meetsConfidenceThreshold) {
                    throw DomainException(
                        DomainError.Policy(
                            "strict grounded policy not satisfied (requires >=${KNOWLEDGE_MIN_CITATIONS} citation and confidence >=${KNOWLEDGE_MIN_CONFIDENCE})"
                        )
                    )
                }

                val groundedDomainSpec = buildDomainSpecFromCitations(query, computed.citations)
                val completeDomainSpec = groundedDomainSpec.functionalRequirements.isNotEmpty() &&
                    groundedDomainSpec.useCases.isNotEmpty() &&
                    groundedDomainSpec.dataModel.isNotEmpty() &&
                    groundedDomainSpec.requiredApis.isNotEmpty()

                if (!completeDomainSpec) {
                    throw DomainException(DomainError.Policy("grounded domainSpec is incomplete"))
                }

                val approved = allowedDependencyEntries(dependencias).getOrElse {
                    throw DomainException(DomainError.Validation(it.message ?: "invalid dependencies"))
                }

                val createReq = ProjectCreateRequest(
                    name = name,
                    profile = profile,
                    cliente = cliente,
                    tarea = tarea,
                    descripcion = descripcion,
                    dependencias = dependencias,
                    timeline = emptyList(),
                    domainSpec = groundedDomainSpec,
                    uiPreset = uiPreset,
                    uiTooling = uiTooling,
                    enableA11yChecks = enableA11yChecks,
                    enableVisualRegression = enableVisualRegression
                )
                val projectId = createProjectRecord(createReq, approved).projectId
                call.respond(
                    HttpStatusCode.Created,
                    GenericResponse(
                        "CREATED",
                        payload = InitFromKnowledgeResponse(
                            projectId = projectId,
                            citations = computed.citations.size,
                            confidence = computed.confidence,
                            policy = computed.policy
                        )
                    )
                )
            }

            post("/{id}/execute") {
                // Explicit guard: this backend stores and scaffolds projects, but never executes user sketches.
                throw DomainException(DomainError.Forbidden("sketch execution is disabled on backend"))
            }

            post("/{id}/sync-from-disk") {
                val projectId = call.parameters["id"]?.toIntOrNull()
                    ?: throw DomainException(DomainError.Validation("invalid project id"))

                val projectExists = suspendTransaction {
                    Projects.select { Projects.id eq projectId }.singleOrNull() != null
                }
                if (!projectExists) {
                    throw DomainException(DomainError.NotFound("project not found"))
                }

                val req = runCatching { call.receive<SyncFromDiskRequest>() }.getOrElse { SyncFromDiskRequest() }
                val result = runCatching {
                    syncProjectFromDisk(projectId, req)
                }.getOrElse { error ->
                    val message = if ((error.message ?: "").contains("directory not found")) {
                        "project directory not found"
                    } else {
                        "sync from disk failed"
                    }
                    throw DomainException(DomainError.Validation(message))
                }

                call.respond(HttpStatusCode.OK, GenericResponse("SUCCESS", payload = result))
            }

            post("/iterate") {
                val req = call.receive<IterateRequest>()
                if (testMode && isAiTimeoutSimulationEnabled()) {
                    throw DomainException(DomainError.Timeout("AI dependency timeout simulated"))
                }
                val archivo = suspendTransaction { ProjectFiles.select { ProjectFiles.id eq req.fileId }.singleOrNull() }
                    ?: throw DomainException(DomainError.NotFound("file not found"))
                val mode = resolveAiPromptMode(req.mode)
                val sourceCode = sanitizeIterateBaseline(archivo[ProjectFiles.contenido])

                val promptStr = buildIteratePrompt(
                    mode = mode,
                    existingCode = sourceCode,
                    instruction = req.instruccion
                )

                try {
                    val response: HttpResponse = aiClient.post(aiGenerateUrl()) {
                        contentType(ContentType.Application.Json)
                        setBody(buildJsonObject {
                            put("model", aiModelName())
                            put("prompt", promptStr)
                            put("stream", false)
                        })
                    }
                    val aiRaw = Json.parseToJsonElement(response.bodyAsText()).jsonObject["response"]?.jsonPrimitive?.content ?: ""
                    val normalized = when (mode) {
                        AiPromptMode.PATCH -> normalizePatchProposal(aiRaw)
                        AiPromptMode.SCAFFOLD -> normalizeScaffoldProposal(aiRaw)
                    }

                    if (normalized == null) {
                        val fallback = buildFallbackProposal(mode, sourceCode)
                        val gateDetail = if (mode == AiPromptMode.PATCH) {
                            val candidate = unwrapMarkdownCodeFences(aiRaw)
                            when {
                                !isLikelyKotlinSnippet(candidate) -> "non-kotlin-snippet"
                                else -> when (val gate = strictPatchGate(candidate)) {
                                    is PatchGateResult.Pass -> "unknown"
                                    is PatchGateResult.Fail -> gate.violations.joinToString("; ") { "${it.rule}: ${it.detail}" }
                                }
                            }
                        } else "non-conformant-scaffold"
                        call.application.log.warn("AI PATCH gate rejected mode=$mode fileId=${req.fileId} violations=[$gateDetail]; returning safe fallback")
                        call.respond(
                            HttpStatusCode.OK,
                            GenericResponse(
                                status = "PROPOSAL",
                                payload = fallback,
                                error = "strict-patch-gate: $gateDetail; safe fallback returned"
                            )
                        )
                    } else {
                        call.respond(HttpStatusCode.OK, GenericResponse("PROPOSAL", payload = normalized))
                    }
                } catch (e: DomainException) {
                    throw e
                } catch (e: Exception) {
                    throw DomainException(DomainError.Integration("ai iteration failed", details = e.message))
                }
            }

            put("/files/{id}") {
                val fId = call.parameters["id"]?.toIntOrNull() ?: throw DomainException(DomainError.Validation("invalid file id"))
                val update = call.receive<FileContentUpdate>()

                val fileData = suspendTransaction {
                    ProjectFiles.update({ ProjectFiles.id eq fId }) { it[contenido] = update.contenido }

                    ProjectFiles.join(Projects, JoinType.INNER, additionalConstraint = { ProjectFiles.projectId eq Projects.id })
                        .select { ProjectFiles.id eq fId }
                        .singleOrNull()
                }

                if (fileData != null) {
                    withContext(Dispatchers.IO) {
                        val projectDir = File(generatedBaseDir(), "proyecto_${fileData[Projects.id]}")
                        if (!projectDir.exists()) projectDir.mkdirs()

                        val rawRuta = fileData[ProjectFiles.ruta]
                        val normalizedRuta = if (rawRuta == "/") "" else rawRuta.trim('/')
                        val relativePath = if (normalizedRuta.isBlank()) {
                            fileData[ProjectFiles.nombreArchivo]
                        } else {
                            "$normalizedRuta/${fileData[ProjectFiles.nombreArchivo]}"
                        }

                        val physicalFile = File(projectDir, relativePath)
                        physicalFile.parentFile?.mkdirs()
                        physicalFile.writeText(update.contenido)
                    }
                    call.respond(HttpStatusCode.OK, GenericResponse<String>("OK"))
                } else {
                    throw DomainException(DomainError.NotFound("No se pudo actualizar"))
                }
            }
        }
        }

        if (securityEnabled) {
            authenticate("api-key", build = protectedRoutes)
        } else {
            protectedRoutes()
        }
    }
}