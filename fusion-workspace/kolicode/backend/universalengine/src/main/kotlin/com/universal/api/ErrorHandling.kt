package com.universal.api

import io.ktor.http.HttpStatusCode
import io.ktor.server.application.ApplicationCall
import io.ktor.server.response.respond

fun domainHttpStatus(category: ErrorCategory): HttpStatusCode = when (category) {
    ErrorCategory.VALIDATION -> HttpStatusCode.BadRequest
    ErrorCategory.POLICY -> HttpStatusCode.UnprocessableEntity
    ErrorCategory.FORBIDDEN -> HttpStatusCode.Forbidden
    ErrorCategory.NOT_FOUND -> HttpStatusCode.NotFound
    ErrorCategory.TIMEOUT -> HttpStatusCode.GatewayTimeout
    ErrorCategory.INTEGRATION -> HttpStatusCode.BadGateway
    ErrorCategory.INTERNAL -> HttpStatusCode.InternalServerError
}

fun resolveTenantIdFromRequest(call: ApplicationCall): String =
    call.request.headers["X-Tenant-Id"]
        ?: call.request.queryParameters["tenantId"]
        ?: "unknown"

fun resolveRequestIdFromRequest(call: ApplicationCall): String =
    call.request.headers["X-Request-Id"] ?: "unknown"

fun buildApiError(
    call: ApplicationCall,
    error: DomainError,
    requestId: String = resolveRequestIdFromRequest(call),
    tenantId: String = resolveTenantIdFromRequest(call)
): ApiError =
    ApiError(
        code = error.code,
        category = error.category.name,
        message = error.message,
        requestId = requestId,
        tenantId = tenantId,
        details = error.details
    )

suspend fun respondDomainError(
    call: ApplicationCall,
    error: DomainError,
    requestId: String = resolveRequestIdFromRequest(call),
    tenantId: String = resolveTenantIdFromRequest(call)
) {
    call.respond(
        domainHttpStatus(error.category),
        GenericResponse<String>(
            status = "ERROR",
            error = error.message,
            apiError = buildApiError(call, error, requestId = requestId, tenantId = tenantId)
        )
    )
}

