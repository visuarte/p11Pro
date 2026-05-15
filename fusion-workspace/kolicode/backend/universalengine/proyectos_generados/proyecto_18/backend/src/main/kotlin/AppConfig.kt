package com.generated.ciberpunk

data class AppConfig(
    val dbHost: String,
    val dbPort: String,
    val dbName: String,
    val dbUser: String,
    val dbPassword: String,
    val jdbcUrl: String,
    val skipDbInit: Boolean,
    val port: Int,
    val useThreeJs: Boolean,
    val enableTailwindDirectives: Boolean,
    val kotguaicliPath: String,
    val kotguaicliAuthToken: String?
)

private fun readConfig(name: String, defaultValue: String? = null): String? {
    val propertyValue = System.getProperty(name)?.takeIf { it.isNotBlank() }
    val envValue = System.getenv(name)?.takeIf { it.isNotBlank() }
    return propertyValue ?: envValue ?: defaultValue
}

fun loadAppConfig(): AppConfig {
    val dbHost = readConfig("DB_HOST", "localhost")!!
    val dbPort = readConfig("DB_PORT", "5432")!!
    val dbName = readConfig("DB_NAME", "ciberpunk")!!
    val dbUser = readConfig("DB_USER", "postgres")!!
    val dbPassword = readConfig("DB_PASSWORD", "postgres")!!
    val jdbcUrl = readConfig("JDBC_DATABASE_URL", "jdbc:postgresql://$dbHost:$dbPort/$dbName")!!
    val port = readConfig("PORT", "8040")!!.toIntOrNull() ?: 8040

    return AppConfig(
        dbHost = dbHost,
        dbPort = dbPort,
        dbName = dbName,
        dbUser = dbUser,
        dbPassword = dbPassword,
        jdbcUrl = jdbcUrl,
        skipDbInit = readConfig("SKIP_DB_INIT", "0") == "1",
        port = port,
        useThreeJs = readConfig("USE_THREE_JS", "true")!!.toBoolean(),
        enableTailwindDirectives = readConfig("ENABLE_TAILWIND_DIRECTIVES", "false")!!.toBoolean(),
        kotguaicliPath = readConfig("KOTGUAICLI_PATH", "../kotguaicli")!!,
        kotguaicliAuthToken = readConfig("KOTGUAICLI_AUTH_TOKEN")
    )
}
