package com.generated.ciberpunk

import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicLong

object AppMetrics {
    private val startedAtMs = System.currentTimeMillis()
    private val totalRequests = AtomicLong(0)
    private val requestDurationTotalMs = AtomicLong(0)
    private val requestDurationMaxMs = AtomicLong(0)
    private val statusCounts = ConcurrentHashMap<String, AtomicLong>()
    private val methodCounts = ConcurrentHashMap<String, AtomicLong>()
    private val pathCounts = ConcurrentHashMap<String, AtomicLong>()
    private val checklistCreates = AtomicLong(0)
    private val kotguaicliActions = ConcurrentHashMap<String, AtomicLong>()

    fun recordRequest(method: String, path: String, statusCode: Int, durationMs: Long) {
        totalRequests.incrementAndGet()
        requestDurationTotalMs.addAndGet(durationMs)
        updateMax(requestDurationMaxMs, durationMs)
        statusCounts.computeIfAbsent(statusCode.toString()) { AtomicLong(0) }.incrementAndGet()
        methodCounts.computeIfAbsent(method) { AtomicLong(0) }.incrementAndGet()
        pathCounts.computeIfAbsent(normalizePath(path)) { AtomicLong(0) }.incrementAndGet()
    }

    fun recordChecklistCreated() {
        checklistCreates.incrementAndGet()
    }

    fun recordKotguaicliAction(action: String) {
        kotguaicliActions.computeIfAbsent(action) { AtomicLong(0) }.incrementAndGet()
    }

    fun renderPrometheus(): String {
        val uptimeSeconds = (System.currentTimeMillis() - startedAtMs) / 1000.0

        return buildString {
            appendLine("# HELP proyecto18_uptime_seconds Uptime of the application in seconds.")
            appendLine("# TYPE proyecto18_uptime_seconds gauge")
            appendLine("proyecto18_uptime_seconds $uptimeSeconds")

            appendLine("# HELP proyecto18_http_requests_total Total HTTP requests handled by the application.")
            appendLine("# TYPE proyecto18_http_requests_total counter")
            appendLine("proyecto18_http_requests_total ${totalRequests.get()}")

            appendLine("# HELP proyecto18_http_request_duration_ms_total Total HTTP request duration in milliseconds.")
            appendLine("# TYPE proyecto18_http_request_duration_ms_total counter")
            appendLine("proyecto18_http_request_duration_ms_total ${requestDurationTotalMs.get()}")

            appendLine("# HELP proyecto18_http_request_duration_ms_max Maximum HTTP request duration in milliseconds.")
            appendLine("# TYPE proyecto18_http_request_duration_ms_max gauge")
            appendLine("proyecto18_http_request_duration_ms_max ${requestDurationMaxMs.get()}")

            appendLine("# HELP proyecto18_http_requests_by_status_total Requests grouped by HTTP status code.")
            appendLine("# TYPE proyecto18_http_requests_by_status_total counter")
            statusCounts.toSortedMap().forEach { (status, count) ->
                appendLine("proyecto18_http_requests_by_status_total{status=\"$status\"} ${count.get()}")
            }

            appendLine("# HELP proyecto18_http_requests_by_method_total Requests grouped by HTTP method.")
            appendLine("# TYPE proyecto18_http_requests_by_method_total counter")
            methodCounts.toSortedMap().forEach { (method, count) ->
                appendLine("proyecto18_http_requests_by_method_total{method=\"$method\"} ${count.get()}")
            }

            appendLine("# HELP proyecto18_http_requests_by_path_total Requests grouped by normalized path.")
            appendLine("# TYPE proyecto18_http_requests_by_path_total counter")
            pathCounts.toSortedMap().forEach { (path, count) ->
                appendLine("proyecto18_http_requests_by_path_total{path=\"$path\"} ${count.get()}")
            }

            appendLine("# HELP proyecto18_checklist_creates_total Checklist records created.")
            appendLine("# TYPE proyecto18_checklist_creates_total counter")
            appendLine("proyecto18_checklist_creates_total ${checklistCreates.get()}")

            appendLine("# HELP proyecto18_kotguaicli_actions_total kotguaicli route actions invoked.")
            appendLine("# TYPE proyecto18_kotguaicli_actions_total counter")
            kotguaicliActions.toSortedMap().forEach { (action, count) ->
                appendLine("proyecto18_kotguaicli_actions_total{action=\"$action\"} ${count.get()}")
            }
        }
    }

    private fun normalizePath(path: String): String {
        return path.replace(Regex("/\\d+"), "/:id")
    }

    private fun updateMax(target: AtomicLong, candidate: Long) {
        while (true) {
            val current = target.get()
            if (candidate <= current) return
            if (target.compareAndSet(current, candidate)) return
        }
    }
}
