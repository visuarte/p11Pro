plugins {
    kotlin("jvm") version "1.9.24"
    kotlin("plugin.serialization") version "1.9.24"
    application
}

group = "com.universal"
version = "1.0.0"
application { mainClass.set("com.universal.api.UniversalEngineKt") }

repositories { mavenCentral() }

val ktor_version = "2.3.12"
val exposed_version = "0.41.1"

dependencies {
        // --- OpenAPI/Swagger ---
        implementation("io.ktor:ktor-server-openapi:$ktor_version")
        implementation("io.ktor:ktor-server-swagger:$ktor_version")
    // --- KTOR SERVER (Core y Plugins) ---
    implementation("io.ktor:ktor-server-core-jvm:$ktor_version")
    implementation("io.ktor:ktor-server-netty-jvm:$ktor_version")
    implementation("io.ktor:ktor-server-content-negotiation-jvm:$ktor_version")
    implementation("io.ktor:ktor-serialization-kotlinx-json-jvm:$ktor_version")
    implementation("io.ktor:ktor-server-html-builder-jvm:$ktor_version")
    implementation("io.ktor:ktor-server-cors-jvm:$ktor_version")
    implementation("io.ktor:ktor-server-status-pages-jvm:$ktor_version")
    implementation("io.ktor:ktor-server-call-logging-jvm:$ktor_version")
    implementation("io.ktor:ktor-server-call-id-jvm:$ktor_version")
    implementation("io.ktor:ktor-server-auth-jvm:$ktor_version")

    // --- KTOR CLIENT (Para conectar con Ollama/IA) ---
    implementation("io.ktor:ktor-client-core:$ktor_version")
    implementation("io.ktor:ktor-client-cio:$ktor_version")
    implementation("io.ktor:ktor-client-content-negotiation:$ktor_version")
    implementation("io.ktor:ktor-serialization-kotlinx-json:$ktor_version")

    // --- BASE DE DATOS (Postgres + Exposed) ---
    implementation("org.postgresql:postgresql:42.5.4")
    implementation("com.zaxxer:HikariCP:4.0.3")
    implementation("org.jetbrains.exposed:exposed-core:$exposed_version")
    implementation("org.jetbrains.exposed:exposed-jdbc:$exposed_version")
    implementation("org.jetbrains.exposed:exposed-dao:$exposed_version")

    // --- DOCUMENT INGESTION (PDF VALIDATION + TEXT EXTRACTION) ---
    implementation("org.apache.pdfbox:pdfbox:2.0.30")

    // --- LOGS Y UTILIDADES ---
    implementation("ch.qos.logback:logback-classic:1.4.14")

    // --- TESTING (Kotest + MockK) ---
    testImplementation("io.kotest:kotest-runner-junit5:5.8.0")
    testImplementation("io.kotest:kotest-assertions-core:5.8.0")
    testImplementation("io.mockk:mockk:1.13.8")
    testImplementation("io.ktor:ktor-server-tests-jvm:$ktor_version")
}

// Configuración de ejecución para Kotest
tasks.withType<Test> {
    useJUnitPlatform()
    testLogging {
        events("passed", "skipped", "failed")
    }
}

kotlin {
    jvmToolchain(17)
}