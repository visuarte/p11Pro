
plugins {
    kotlin("jvm") version "2.1.10"
    kotlin("plugin.serialization") version "2.1.10"
    application
    id("org.flywaydb.flyway") version "10.20.1"
    id("project-report")
}

repositories { mavenCentral() }

val ktorVersion = "2.3.10"
val flywayVersion = "10.20.1"
val junitVersion = "5.10.2"

dependencies {
    implementation("io.ktor:ktor-server-core-jvm:$ktorVersion")
    implementation("io.ktor:ktor-server-call-id-jvm:$ktorVersion")
    implementation("io.ktor:ktor-server-test-host-jvm:$ktorVersion")
    implementation("io.ktor:ktor-server-netty-jvm:$ktorVersion")
    implementation("io.ktor:ktor-server-content-negotiation-jvm:$ktorVersion")
    implementation("io.ktor:ktor-serialization-kotlinx-json-jvm:$ktorVersion")
    implementation("io.ktor:ktor-server-websockets-jvm:$ktorVersion")
    implementation("io.ktor:ktor-server-call-logging-jvm:$ktorVersion")
    // Provide an SLF4J implementation so runtime exceptions are logged (useful in containers)
    implementation("ch.qos.logback:logback-classic:1.4.11")
    implementation("net.logstash.logback:logstash-logback-encoder:7.4")

    // Exposed y PostgreSQL
    implementation("org.jetbrains.exposed:exposed-core:0.50.1")
    implementation("org.jetbrains.exposed:exposed-dao:0.50.1")
    implementation("org.jetbrains.exposed:exposed-jdbc:0.50.1")
    implementation("org.jetbrains.exposed:exposed-java-time:0.50.1")
    implementation("org.postgresql:postgresql:42.7.4")
    implementation("org.flywaydb:flyway-core:$flywayVersion")
    implementation("org.flywaydb:flyway-database-postgresql:$flywayVersion")

    testImplementation("org.jetbrains.kotlin:kotlin-test-junit5")
    testImplementation("org.junit.jupiter:junit-jupiter:$junitVersion")
}


application {
    mainClass.set("com.generated.ciberpunk.ApplicationKt")
}


kotlin {
    // Ajustado a 21 para que coincida con el JDK presente en la imagen de build (gradle:9-jdk21)
    jvmToolchain(21)
}

val cleanAppleDouble by tasks.registering(Delete::class) {
    delete(fileTree(projectDir) { include("**/._*") })
    delete(fileTree(layout.buildDirectory) { include("**/._*") })
}

tasks.test {
    dependsOn(cleanAppleDouble)
    useJUnitPlatform()
}

tasks.named("compileKotlin") {
    dependsOn(cleanAppleDouble)
}

tasks.named("processResources") {
    dependsOn(cleanAppleDouble)
}

tasks.named("build") {
    dependsOn(cleanAppleDouble)
}

// Small fat-jar task to produce an executable jar for container images
tasks.register<org.gradle.jvm.tasks.Jar>("fatJar") {
    archiveBaseName.set(project.name)
    archiveVersion.set("")
    archiveClassifier.set("")
    manifest {
        attributes["Main-Class"] = "com.generated.ciberpunk.ApplicationKt"
    }
    from(sourceSets.main.get().output)
    dependsOn(configurations.runtimeClasspath)
    from({
        configurations.runtimeClasspath.get().filter { it.name.endsWith(".jar") }.map { zipTree(it) }
    })
    duplicatesStrategy = DuplicatesStrategy.EXCLUDE
}

// provide alias so CI scripts that expect shadowJar work
tasks.register("shadowJar") { dependsOn(tasks.named("fatJar")) }

fun gradleConfig(name: String, defaultValue: String): String {
    return providers.gradleProperty(name)
        .orElse(System.getenv(name) ?: defaultValue)
        .get()
}

flyway {
    val dbHost = System.getenv("DB_HOST") ?: "localhost"
    val dbPort = System.getenv("DB_PORT") ?: "5432"
    val dbName = System.getenv("DB_NAME") ?: "ciberpunk"
    url = providers.gradleProperty("JDBC_DATABASE_URL")
        .orElse(System.getenv("JDBC_DATABASE_URL") ?: "jdbc:postgresql://$dbHost:$dbPort/$dbName")
        .get()
    user = gradleConfig("DB_USER", "postgres")
    password = gradleConfig("DB_PASSWORD", "postgres")
    locations = arrayOf("filesystem:src/main/resources/db/migration")
    baselineOnMigrate = true
    cleanDisabled = true
}
