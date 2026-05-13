// Build root que aplica políticas comunes a todos los subproyectos.
// Aquí centralizamos la política de resolución para forzar la versión de Kotlin
// y evitar que dependencias transitivas traigan artefactos de la rama 2.x que
// rompen la compilación Kotlin/JS.

allprojects {
    repositories {
        mavenCentral()
        mavenLocal()
        google()
        gradlePluginPortal()
    }
}

subprojects {
    // Forzar versión de artefactos Kotlin para todos los subproyectos
    configurations.all {
        resolutionStrategy.eachDependency {
            if (requested.group == "org.jetbrains.kotlin") {
                // Forzamos una versión mínima compatible con JDK modernos
                useVersion("2.1.10")
                because("Actualizar a Kotlin 2.1.10 para compatibilidad con JDK recientes")
            }
        }
    }
}

