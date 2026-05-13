pluginManagement {
    repositories {
        gradlePluginPortal()
        mavenCentral()
        google()
    }
    resolutionStrategy {
        eachPlugin {
            if (requested.id.id.startsWith("org.jetbrains.kotlin")) {
                // Actualizado para soportar JDK modernos; requerimiento: Kotlin >= 2.1.10
                useVersion("2.1.10")
            }
        }
    }
}

rootProject.name = "proyecto_18"

// Include subprojects so containerized Gradle builds can run tasks like :backend:fatJar
include("backend")
include("kotguaicli")

