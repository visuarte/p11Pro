
plugins {
    kotlin("jvm") version "1.8.22"
    application
    kotlin("plugin.serialization") version "1.8.22"
}

repositories {
    mavenCentral()
}

val ktorVersion = "2.3.4"

dependencies {
    implementation(kotlin("stdlib"))
    implementation("io.ktor:ktor-server-core:$ktorVersion")
    implementation("io.ktor:ktor-server-netty:$ktorVersion")
    implementation("io.ktor:ktor-server-content-negotiation:$ktorVersion")
    implementation("io.ktor:ktor-server-cors:$ktorVersion")
    implementation("io.ktor:ktor-server-call-logging:$ktorVersion")
    implementation("io.ktor:ktor-server-status-pages:$ktorVersion")
    implementation("io.ktor:ktor-serialization-kotlinx-json:$ktorVersion")
    implementation("io.ktor:ktor-server-auth:$ktorVersion")
    implementation("io.ktor:ktor-server-auth-jwt:$ktorVersion")
    implementation("com.auth0:java-jwt:4.4.0")
    implementation("ch.qos.logback:logback-classic:1.4.11")

    testImplementation("org.junit.jupiter:junit-jupiter:5.10.0")
}

application {
    // Main class generated for top-level main() in KtorApiServer.kt
    mainClass.set("com.imprenta.api.KtorApiServerKt")
}

tasks.test {
    useJUnitPlatform()
}

