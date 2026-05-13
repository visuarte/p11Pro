# MANIFIESTO DE INGENIERÍA Y BUENAS PRÁCTICAS (ESTÁNDAR 2026)
**Clasificación:** Normativa Core del Proyecto  
**Audiencia:** Desarrolladores, Arquitectos y Agentes IA  
**Versión:** 1.0  
**Fecha:** 2026-04-21

---

## 1. Arquitectura y Patrones de Diseño
El software operará bajo un modelo de **Monolito Modular** con fuerte separación de responsabilidades, ideal para el rendimiento exigido (visionado limpio) y la interacción C++/Python.

* **Arquitectura Hexagonal (Ports & Adapters):** El núcleo de procesamiento (Core C++ / Motor IA en Python) estará aislado de la UI (Qt). El `AsyncBridge` actuará como el adaptador principal, garantizando contratos de eventos asíncronos y desacoplados.
* **Tipado Estricto:** Obligatorio el uso de tipos fuertes en C++17+ y `Pydantic`/Type Hints en los módulos de Python.

## 2. Integración y Entrega Continua (CI/CD)
La agilidad no comprometerá la estabilidad. Todo código generado, humano o IA, pasará por pipelines automatizados antes de fusionarse.

* **Validación en Pull Requests (PR):** Ejecución automática de tests unitarios, linters (Flake8, Clang-Tidy) y cobertura de código. No se permite el merge con pipelines en rojo.
* **Lockfiles Inmutables:** Uso estricto de `requirements.txt` (o `Poetry`) en Python y gestión de paquetes controlada en C++ (vía CMake/Conan) para garantizar builds reproducibles.
* **Contenedores Multi-stage:** El empaquetado final usará Docker multi-stage para separar los entornos pesados de compilación (C++ compilers, Qt dev headers) de los *runtimes* ligeros de producción.

## 3. Seguridad y Zero Trust
La seguridad es crítica, especialmente al interactuar con modelos de IA externos y gestionar datos visuales sensibles.

* **Gestión de Secretos:** Prohibido *hardcodear* API Keys (Codex, GPT-5) o credenciales. Se inyectarán en tiempo de ejecución vía variables de entorno gestionadas por herramientas tipo Vault o GitHub Secrets.
* **Escaneo de Vulnerabilidades (SCA/SAST):** Análisis estático en cada PR para detectar fallos en dependencias de IA, visión (dlib) o gestión de color (Little CMS).

## 4. Observabilidad SRE y Trazabilidad Activa
Integración total con la *Política de Trazabilidad Activa* del proyecto.

* **Logs Estructurados:** Formato JSON unificado. Todo error en el Bridge C++/Python, desbordamiento en Blend2D o latencia en Little CMS debe registrarse con su `TRACE-ID` y nivel de severidad `[INFO|WARN|ERROR]`.
* **Métricas (SLIs/SLOs):** Monitoreo estricto de la latencia inter-procesos. El renderizado y las transformaciones asíncronas no deben superar el umbral de milisegundos definido para mantener el "visionado limpio".

## 5. Calidad y Testing Automatizado (TDD)
* **Tests Unitarios y de Contrato:** Pruebas exhaustivas sobre el `AsyncBridge` y la serialización de datos. Si el puente falla, el proyecto falla.
* **Revisión de Pares / IA:** Todo commit generado por la IA deberá ser auditado bajo los estándares de este manifiesto antes de su integración.

## 6. Frontend y Accesibilidad (UI Qt)
* La interfaz desarrollada en Qt debe ser responsiva y accesible, cumpliendo con los contrastes de color estándar y permitiendo la navegación fluida, garantizando compatibilidad cruzada (Windows, macOS, Linux).

---

## 7. Empaquetado y Distribución Local (Desktop)
Definir estrategia de empaquetado cross-platform (ej. CPack, AppImage para Linux, instaladores MSIX para Windows, DMG para macOS) asegurando que el entorno de Python y el binario de C++ se distribuyan de forma unificada y segura sin obligar al usuario a instalar dependencias a mano.

## 8. Degradación Elegante (Graceful Degradation) y Hardware
Implementar "Degradación Elegante" y fallback a CPU. Si el motor de visión (DeepFace/dlib) detecta falta de recursos de hardware (GPU/VRAM), el sistema no debe fallar (crash), sino alertar al usuario y pasar a un modo de procesamiento por CPU o deshabilitar funciones pesadas en tiempo real para proteger el visionado limpio.

## 9. Cumplimiento de Licencias Open Source (Compliance)
Auditoría continua de licencias: Todo módulo de terceros debe tener su licencia documentada. Asegurar el cumplimiento de licencias restrictivas (como la LGPL de Qt) mediante enlace dinámico (dynamic linking) para proteger la propiedad intelectual del código propietario.

---

## Referencias Cruzadas
- [VERSIONS.md](../fusion-workspace/VERSIONS.md)
- [AGENTS.md](../fusion-workspace/AGENTS.md)
- [README.md](../fusion-workspace/README.md)
- [PRE_IMPLEMENTACION_QA_2026-04-21.md](../fusion-workspace/reports/PRE_IMPLEMENTACION_QA_2026-04-21.md)

---

Este manifiesto es de cumplimiento obligatorio para todo desarrollo, integración o despliegue en el proyecto. Cualquier excepción debe ser documentada y aprobada por el responsable de arquitectura.

---

