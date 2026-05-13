
plugins {
    kotlin("jvm") version "2.1.10"
    kotlin("plugin.serialization") version "2.1.10"
    application
}

repositories { mavenCentral() }

val ktorVersion = "2.3.10"

dependencies {
    implementation("io.ktor:ktor-server-core-jvm:$ktorVersion")
    implementation("io.ktor:ktor-server-netty-jvm:$ktorVersion")
    implementation("io.ktor:ktor-server-content-negotiation-jvm:$ktorVersion")
    implementation("io.ktor:ktor-serialization-kotlinx-json-jvm:$ktorVersion")
    implementation("io.ktor:ktor-server-websockets-jvm:$ktorVersion")
    implementation("io.ktor:ktor-server-call-logging-jvm:$ktorVersion")
    // Provide an SLF4J implementation so runtime exceptions are logged (useful in containers)
    implementation("ch.qos.logback:logback-classic:1.4.11")

    // Exposed y PostgreSQL
    implementation("org.jetbrains.exposed:exposed-core:0.50.1")
    implementation("org.jetbrains.exposed:exposed-dao:0.50.1")
    implementation("org.jetbrains.exposed:exposed-jdbc:0.50.1")
    implementation("org.jetbrains.exposed:exposed-java-time:0.50.1")
    implementation("org.postgresql:postgresql:42.7.4")
}


application {
    mainClass.set("com.generated.ciberpunk.ApplicationKt")
}


kotlin {
    // Ajustado a 21 para que coincida con el JDK presente en la imagen de build (gradle:9-jdk21)
    jvmToolchain(21)
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
