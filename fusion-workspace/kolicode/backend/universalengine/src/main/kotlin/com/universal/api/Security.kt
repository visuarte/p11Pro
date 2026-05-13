package com.universal.api

import io.ktor.server.application.Application
import io.ktor.server.application.ApplicationCall
import io.ktor.server.application.log
import io.ktor.server.auth.principal
import io.ktor.server.auth.UserIdPrincipal

private const val SECURITY_ENFORCED_ENV = "SECURITY_ENFORCED"
private const val SECURITY_API_KEY_ENV = "SECURITY_API_KEY"

private fun parseBooleanFlag(raw: String?, defaultValue: Boolean): Boolean {
    val value = raw?.trim()?.lowercase() ?: return defaultValue
    return when (value) {
        "1", "true", "yes", "on" -> true
        "0", "false", "no", "off" -> false
        else -> defaultValue
    }
}

fun isSecurityEnforced(testMode: Boolean): Boolean {
    val raw = System.getProperty("security.enforced") ?: System.getenv(SECURITY_ENFORCED_ENV)
    return parseBooleanFlag(raw, defaultValue = !testMode)
}

fun resolveSecurityApiKey(): String? =
    System.getProperty("security.api.key")
        ?: System.getenv(SECURITY_API_KEY_ENV)

fun requireDbEnvInProd() {
    val appEnv = (System.getProperty("app.env") ?: System.getenv("APP_ENV") ?: "dev").trim().lowercase()
    if (appEnv != "prod") return

    val missing = buildList {
        if (System.getenv("DB_URL").isNullOrBlank() && System.getenv("JDBC_DATABASE_URL").isNullOrBlank()) add("DB_URL|JDBC_DATABASE_URL")
        if (System.getenv("DB_USER").isNullOrBlank()) add("DB_USER")
        if (System.getenv("DB_PASS").isNullOrBlank() && System.getenv("DB_PASSWORD").isNullOrBlank()) add("DB_PASS|DB_PASSWORD")
    }
    if (missing.isNotEmpty()) {
        throw IllegalStateException("Missing required DB env vars for production: ${missing.joinToString(", ")}")
    }
}

fun requireWriteRole(call: ApplicationCall, securityEnabled: Boolean) {
    if (!securityEnabled) return
    val principal = call.principal<UserIdPrincipal>()
        ?: throw DomainException(DomainError.Forbidden("missing security principal"))
    if (principal.name != "api-key") {
        throw DomainException(DomainError.Forbidden("missing security principal"))
    }
    val role = call.request.headers["X-Role"]?.trim()?.lowercase().orEmpty().ifBlank { "viewer" }
    if (role !in setOf("admin", "editor")) {
        throw DomainException(DomainError.Forbidden("insufficient role"))
    }
}

fun requireReadRole(call: ApplicationCall, securityEnabled: Boolean) {
    if (!securityEnabled) return
    val principal = call.principal<UserIdPrincipal>()
        ?: throw DomainException(DomainError.Forbidden("missing security principal"))
    if (principal.name != "api-key") {
        throw DomainException(DomainError.Forbidden("missing security principal"))
    }
    val role = call.request.headers["X-Role"]?.trim()?.lowercase().orEmpty().ifBlank { "viewer" }
    if (role !in setOf("admin", "editor", "viewer")) {
        throw DomainException(DomainError.Forbidden("insufficient role"))
    }
}

fun requireTenantFromPrincipal(call: ApplicationCall, securityEnabled: Boolean): String {
    if (!securityEnabled) return resolveTenantIdFromRequest(call)
    val principal = call.principal<UserIdPrincipal>()
        ?: throw DomainException(DomainError.Forbidden("missing security principal"))
    if (principal.name != "api-key") {
        throw DomainException(DomainError.Forbidden("missing security principal"))
    }
    return call.request.headers["X-Tenant-Id"]?.trim()?.takeIf { it.isNotBlank() }
        ?: throw DomainException(DomainError.Validation("X-Tenant-Id header is required"))
}

fun corsAllowedOrigins(): List<String> {
    val raw = System.getProperty("cors.allowed.origins")
        ?: System.getenv("CORS_ALLOWED_ORIGINS")
        ?: "http://localhost:3000,http://localhost:3001,http://localhost:5173"

    return raw.split(',')
        .map { it.trim() }
        .filter { it.isNotBlank() }
        .distinct()
}

fun installSecurityOrFail(application: Application, securityEnabled: Boolean) {
    if (!securityEnabled) return
    val key = resolveSecurityApiKey()?.trim().orEmpty()
    if (key.isBlank()) {
        throw IllegalStateException("SECURITY_API_KEY must be configured when SECURITY_ENFORCED is enabled")
    }
    application.log.info("Security enforcement enabled (header API key auth)")
}
