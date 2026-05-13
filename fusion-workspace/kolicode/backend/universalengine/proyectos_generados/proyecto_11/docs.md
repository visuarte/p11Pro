# Documentación Técnica de Implementación

## Entorno de Desarrollo: Srech Drive Developer Style
**Nombre del proyecto:** CodeDesing

### Nota de Implementación
Este desarrollo pertenece a la implementación actual sin nombre específico, gestionada bajo las directivas de privacidad establecidas.

---

## FASE 0: Definición y Arquitectura Base
**Objetivo:** Establecimiento del entorno de desarrollo y especificaciones tecnológicas.
**Componentes Principales:**
- Definición del modelo de IA residente para el procesamiento de lógica.
- Estructuración inicial de la base de datos.
- Diseño conceptual de la arquitectura del software bajo los protocolos de entorno Srech Drive.

## FASE 1: Lógica de Sistema y Agentes
**Objetivo:** Creación del núcleo operativo, flujos de información y backend.
**Componentes Principales:**
- Diseño y despliegue de la API REST para comunicación entre cliente y servidor.
- Integración de agentes Pilot encargados de la asistencia, validación y coordinación de procesos internos.
- Establecimiento de los protocolos de conexión externa e integraciones de hardware (como soporte de lectura NFC).

## FASE 2: Interfaz Principal y Entorno 2D
**Objetivo:** Construcción de la capa principal de interacción del usuario (Frontend).
**Componentes Principales:**
- Desarrollo del sistema sobre Vue.js para garantizar una experiencia fluida.
- Creación del Panel de Control 2D, organizando menús, herramientas y capas de trabajo.
- Conexión reactiva de la interfaz con los agentes Pilot y la base de datos.

## FASE 3: Motor 3D y Herramientas Generativas (Cerrada)
**Objetivo:** Incorporación del entorno de diseño espacial y utilidades de arte generativo.
**Componentes Principales:**
- Núcleo de Visualización 3D (Three.js): Renderizado en tiempo real para el modelado, posicionamiento y animación de elementos físicos, como fachadas y letras corpóreas reales.
- Herramienta Dosis-Respuesta (Python): Algoritmo adaptado (utilizando NumPy/SciPy) que procesa curvas matemáticas para transformarlas en parámetros de diseño de formas orgánicas.

**Prompt para el Motor Generativo (Dosis-Respuesta):**
Uso: Para generar nuevas variantes de diseño basadas en el algoritmo matemático.
Prompt: [SRECH-DRIVE-PROMPT] > Agent: Core-Python | Library: NumPy/SciPy. Implementa una nueva iteración del algoritmo Dosis-Respuesta. Parámetros: Curva sigmoidea, Tensión: 0.85, Ruido Perlin: 0.12. El output debe ser una lista de coordenadas vectoriales compatibles con py5 para el Canvas 2D. Asegura que los puntos sean escalables para una futura extrusión 3D.

## FASE 4: Pruebas, Seguridad y Sanación (Actual)
**Objetivo:** Validación integral del programa, auditoría y parcheo de errores.
**Componentes Principales:**
FASE 4: Pruebas, Seguridad y Sanación (Actual)
**Objetivo:** Validación integral del programa, auditoría y parcheo de errores.
**Componentes Principales:**
- Testing: Pruebas de estrés en la API REST implementadas, validación de la base de datos y comprobación de respuestas de los agentes Pilot mediante endpoints y scripts documentados.
- Seguridad: Auditoría de protección de la información del usuario y flujos de datos, con prompts y filtros de saneamiento activos en la API REST.
- Sanación: Detección, aislamiento y corrección de bugs mediante scripts y comandos de sanación, con integración de logs y procedimientos de healing.

**Estado:**
- Pruebas y validaciones básicas implementadas y documentadas.
- Prompts y comandos de sanación funcionales.
- Pendiente: ampliar cobertura de tests automatizados, mejorar reporting de seguridad y documentar ejemplos de logs/resultados de sanación.

---

## ANEXO: Inventario de Paneles y Etiquetas
### #Panel_Herramientas
- **Tags:** #UI #Python #Generativo
- **Descripción:** Interfaz lateral para la gestión de recursos y utilidades algorítmicas.
- **Funciones Clave:** Generador de curvas matemáticas (Dosis-Respuesta) para la manipulación artística y creación paramétrica.


### #Panel_Visualización_3D
- **Tags:** #ThreeJS #WebGL #DiseñoReal #Fachadas #LetrasCorpóreas
- **Descripción:** Viewport interactivo fundamental para la evaluación y manipulación de volúmenes en un espacio tridimensional.
- **Estado:** Implementado como componente Visualizacion3DPanel.vue en el frontend e integrado en App.vue. Renderiza un canvas 3D con Three.js y muestra un cubo animado de ejemplo.
- **Funciones Clave:** Previsualización precisa de instalaciones físicas y ajuste de coordenadas tridimensionales.

---

## Resumen de pendientes

- Conectar el panel 3D con datos reales del sistema (por ejemplo, importar geometrías generadas o parámetros desde el backend o el canvas 2D).
- Añadir interacción avanzada (selección, transformación de objetos, integración con herramientas del panel de control).
- Mejorar la interoperabilidad entre el panel 2D y el 3D para flujos de trabajo híbridos.
- Documentar ejemplos de integración de datos y eventos entre paneles.

### #Panel_Control_2D
- **Tags:** #VueJS #Gestión #UX #Layout
- **Descripción:** Capa maestra de la aplicación que sirve como puente entre el usuario y las capacidades generativas y 3D.
- **Funciones Clave:** Coordinación del ecosistema del software, ofreciendo herramientas de navegación estables y organización del lienzo de trabajo.

---

## Protocolo de Sanación y Gestión de Legacy
**Tags:** #Legacy #Sanación #Debugging #VersionControl #SrechDrive

### A. Módulo de Sanación (Healing)
- Sanación de Geometría: Script automático que detecta "vértices huérfanos" en los modelos 3D de las letras corpóreas generadas por Three.js y los recalcula para evitar errores de renderizado.
- Integridad de la API: Filtro de saneamiento para la API REST que valida que los datos de entrada (inputs del usuario en el motor Dosis-Respuesta) no causen desbordamientos de memoria en los cálculos de NumPy.
- Consistencia de Base de Datos: Verificación de punteros para asegurar que cada archivo de diseño esté correctamente vinculado a su identificador NFC único.

**Prompt de Auditoría de Seguridad (API REST):**
Uso: Para testear la robustez del túnel de datos antes de una sesión de diseño intensiva.
Prompt: [SRECH-DRIVE-PROMPT] > Agent: Pilot-Audit | Target: API_REST_Endpoint. Realiza un test de estrés de 100 peticiones concurrentes enviando paquetes de datos de configuración de Canvas. Verifica que el Srech_Sanitizer bloquee cualquier inyección de código y que la persistencia en la DB se mantenga íntegra. Devuelve el log de latencia media.

### B. Gestión de Legacy (Legado)
- Compatibilidad Hacia Atrás (Backward Compatibility): Los esquemas de datos de la Fase 1 y 2 deben mantenerse legibles. Si se cambia la lógica de una curva en la Fase 3, el sistema debe ofrecer una "capa de traducción" para que los diseños antiguos no se deformen.
- Versionado de Modelos IA: Aunque actualicemos el motor, el sistema mantendrá una referencia al modelo Deepseek-coder-1.3B-kexer-Q8_0.gguf para asegurar que los agentes Pilot respondan con la misma lógica con la que se crearon los proyectos originales.
- Depuración de Código Obsoleto: Identificación de funciones de Vue.js o Three.js que hayan quedado en desuso. En lugar de borrarlas (lo que podría romper proyectos antiguos), se mueven a un contenedor de Legacy_Core para su ejecución aislada.

**Procedimiento de Implementación en Srech Drive:**
Para ejecutar una sesión de "Sanación", el desarrollador debe invocar el agente Pilot con el siguiente comando de entorno:

```
run healing --project "Codedesign" --target "all-panels" --mode "silent"
```

---

## HERRAMIENTAS Y CANVAS DE TRABAJO

### 1. Arquitectura del Canvas (Lienzo de Trabajo)
- **Canvas 2D (Capa Base y UI):** Vue.js + Integración py5. Gestiona cuadrícula, guías, capas y maquetación general.
- **Viewport 3D (Capa Espacial):** Three.js / WebGL. Modelado de fachadas, extrusión y posicionamiento de letras corpóreas, análisis de iluminación y perspectiva.

### 2. Panel de Herramientas (Toolbox)
- **Herramientas Generativas (Core Python):** Motor Dosis-Respuesta (NumPy/SciPy), manipulación de curvas, nodos de control dinámico.
- **Herramientas de Interfaz (Core Vue.js):** Gestor de capas y activos, selectores de propiedades.

### 3. Integraciones Adicionales y Flujo de Datos
- **Agentes Pilot:** Asistentes del canvas para correcciones geométricas, optimización de malla 3D y autoguardado.
- **Lectura NFC:** Integración hardware para volcar datos externos al canvas.
- **API REST:** Sincronización en tiempo real de cambios en el canvas con el servidor.

**Prompt de Sincronización NFC (Hardware Integration):**
Uso: Para volcar perfiles físicos al entorno de software.
Prompt: [SRECH-DRIVE-PROMPT] > Agent: Pilot-Design | Hardware: NFC_Module. Escucha el puerto de entrada para el tag ID-092. Una vez detectado, aplica el "Preset_Materiales_Aluminio" y ajusta la escala del Viewport 3D a 1:10. Notifica en el Panel de Control 2D cuando la sincronización sea exitosa.

---

## 8. Guía de Despliegue y Mantenimiento (Final)
**Tags:** #Deployment #CI-CD #Maintenance #DevOps

### Instalación del Entorno
- **Dependencias Python:** Instalar numpy, scipy y las librerías de py5 para el motor generativo.
- **Entorno Web:** Levantar el servidor de desarrollo para Vue.js y asegurar que el bundle de Three.js esté correctamente enlazado en el index.html.
- **Modelo de IA:** Colocar el archivo Deepseek-coder-1.3B-kexer-Q8_0.gguf en la ruta de modelos locales del sistema para que el agente Pilot pueda cargar la lógica.

### Flujo de Actualizaciones (Mantenimiento)
- Actualización de Librerías: Revisión mensual de versiones de Three.js para asegurar compatibilidad con nuevos navegadores.
- Refactorización de Curvas: Optimización periódica de los scripts "Dosis-Respuesta" para reducir el tiempo de cálculo en proyectos de gran escala.
- Limpieza de Base de Datos: Script de mantenimiento para purgar archivos temporales de renderizado no guardados en el Canvas.

### Glosario de Términos del Proyecto
- **Codedesign:** Nombre del ecosistema de diseño híbrido 2D/3D.
- **Letras Corpóreas:** Elementos físicos modelados en 3D que representan el producto final tangible.
- **Srech Drive:** Protocolo y entorno de almacenamiento donde reside toda esta documentación.

### Checklist Final de Documentación Completada
- [x] Fase 0 a 4: Cronología y objetivos.
- [x] Canvas e Interfaz: Lógica de funcionamiento.
- [x] Herramientas: Detalle técnico de motores generativos.
- [x] Infraestructura: Base de datos, NFC y Seguridad.
- [x] Agentes: Roles de los asistentes Pilot.
- [x] Despliegue: Instrucciones de puesta en marcha.

---

## Catálogo Detallado de Herramientas

### INVENTARIO MAESTRO: PANEL DE HERRAMIENTAS (TOOLBOX)
**Contexto:** Codedesign - Interfaz de Usuario
**Ecosistema:** Srech Drive Developer
**Estado:** Documentación Final de Herramientas

#### 1. Herramientas de Generación Matemática (Core Python)
- Generador Dosis-Respuesta: Curvas orgánicas basadas en modelos matemáticos de laboratorio.
- Lógica de Curvas (Script-to-Shape): Consola rápida para trazados vectoriales inmediatos.
- Interpolador de Nodos: Suaviza o quiebra puntos de unión entre curvas.

#### 2. Herramientas de Diseño y Volumen (3D/Three.js)
- Extrusor de Corpóreos: Asigna profundidad a trazados 2D.
- Simulador de Materiales: Aplica texturas reales a objetos 3D.
- Ajustador de Fachada: Proyección y escalado de diseños sobre imágenes de fondo.
- Gizmo de Transformación: Control visual para mover, rotar o escalar objetos en 3D.

#### 3. Herramientas de Control e Interfaz (Vue.js)
- Selector Inteligente: Distingue entre objetos 2D y mallas 3D.
- Gestor de Capas Dinámico: Oculta, bloquea o agrupa elementos por fases.
- Inspector de Propiedades: Panel lateral con datos exactos de los elementos seleccionados.

#### 4. Herramientas de Conectividad y Asistencia
- Sincronizador NFC: Vincula tags físicos con configuraciones o proyectos.
- Consola Pilot: Diagnóstico y sugerencias de la IA.
- Historial de "Sanación": Registro de errores detectados y corregidos automáticamente.

**Etiquetas de Referencia (Tags):**
#Toolbox #DosisRespuesta #ThreeJS #VueJS #Corpóreos #Generativo #SrechDrive

---

## Plan de Acción: Inicio de Trabajo de Campo
1. **Preparación del Entorno:**
   - Verificar modelo Deepseek-coder-1.3B-kexer-Q8_0.gguf en la ruta local.
   - Activar entorno virtual con numpy, scipy y py5.
   - Levantar entorno de desarrollo de Vue.js y Three.js.
2. **Protocolo de Inicialización:**
   - Test de API REST.
   - Validación de Agentes Pilot.
3. **Ejecución de Pruebas de "Sanación":**
   - Prompt de "Sanación" de Geometría para el Agente Pilot.

```
run healing --project "Codedesign" --target "all-panels" --mode "active" --verbose
```

---

## Estructura de Proyecto Multimódulo (Kotlin/Gradle)

Codedesign/
├── build.gradle.kts       <-- Configuración global
├── settings.gradle.kts    <-- Definición de módulos
├── core-engine/           <-- Lógica principal (Kotlin)
│   └── build.gradle.kts
├── ai-pilot/              <-- Integración con Deepseek/IA (Kotlin/Java)
│   └── build.gradle.kts
├── math-bridge/           <-- Motor Dosis-Respuesta (Python/JNI)
│   └── build.gradle.kts
└── web-interface/         <-- Frontend en Vue.js (Vite)
    └── build.gradle.kts

**Configuración de settings.gradle.kts:**
```kotlin
rootProject.name = "Codedesign"

include("core-engine")
include("ai-pilot")
include("math-bridge")
include("web-interface")
```

**Configuración de build.gradle.kts Raíz:**
```kotlin
plugins {
    kotlin("jvm") version "1.9.0" apply false
}

allprojects {
    group = "com.codedesign"
    version = "1.0-SNAPSHOT"

    repositories {
        mavenCentral()
    }
}
```

**Ejemplo de un Submódulo (core-engine/build.gradle.kts):**
```kotlin
plugins {
    kotlin("jvm")
}

dependencies {
    implementation(project(":ai-pilot"))
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")
}
```

**Módulo Especial: web-interface/build.gradle.kts:**
```kotlin
tasks.register<Exec>("npmBuild") {
    workingDir = file(".")
    commandLine("pnpm", "build")
}
```

---

## Beneficio para la Sanación
Al tenerlo separado por módulos, si hay un error en el math-bridge (Python), puedes testearlo y "sanarlo" de forma aislada sin tener que recompilar toda la interfaz web o el motor de IA. Es mucho más limpio y profesional.

---

**Fin de la documentación técnica.**

## Endpoints REST implementados

### POST /users/create
Crea un usuario nuevo.
- Parámetros: user_id (str), name (str), email (str, opcional)
- Respuesta: usuario creado o error si ya existe.

### POST /projects/create
Crea un proyecto nuevo.
- Parámetros: project_id (str), name (str), owner_id (str), description (str, opcional)
- Respuesta: proyecto creado o error si ya existe.

### POST /canvas/config
Valida y almacena configuración de canvas para un usuario.
- Parámetros: user_id (str), config (dict)
- Respuesta: validación avanzada vía agente Pilot.

### POST /sync/config
Sincroniza configuración de usuario y proyecto.
- Parámetros: user_id (str), project_id (str), config (dict)
- Respuesta: confirmación de sincronización.

---

Todos los endpoints devuelven mensajes claros y datos relevantes para integración frontend/backend.

---

## Acceso y Ejemplo de Logs Estructurados

Todos los eventos críticos del backend (validaciones, creación de usuarios/proyectos, generación de curvas, errores) quedan registrados en el archivo:

- Ruta: `backend/logs/codedesign.log`

**Ejemplo de log generado:**
```
2026-04-09 10:15:23,456 INFO Validación exitosa de configuración: {'canvas_width': 800, 'canvas_height': 600, 'background': [255, 255, 255]}
2026-04-09 10:15:24,123 WARNING Validación fallida: falta clave canvas_width en config={'canvas_height': 600, 'background': [255,255,255]}
2026-04-09 10:15:25,789 INFO Usuario creado: user123, name=Juan
2026-04-09 10:15:26,001 INFO Proyecto creado: proj001, owner=user123
2026-04-09 10:15:27,321 INFO Curva sigmoidea generada correctamente
2026-04-09 10:15:28,654 INFO Curva generada con ruido Perlin (offset=0.0, scale=1.0)
```

**Consulta de logs desde el frontend:**
- Endpoint: `GET /logs/recent?lines=30`
- Devuelve las últimas líneas del log para auditoría y depuración.

> Nota: El endpoint de logs es solo para desarrollo/auditoría. En producción debe protegerse o deshabilitarse.
