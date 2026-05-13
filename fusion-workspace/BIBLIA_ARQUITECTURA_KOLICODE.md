# 📜 BIBLIA DE ARQUITECTURA Y SEGURIDAD – KOLICODE (2026)

Este documento recopila los planes quirúrgicos y checklists de blindaje para cada capa crítica del sistema KoliCode. Debe ser leído y aplicado por cualquier agente, desarrollador o revisor antes de modificar el core del repositorio.

---

## 1. Blindaje del State Store (Frontend)
- **SSOT:** El Core C++ es la única fuente de verdad. El State Store del Frontend es solo caché visual.
- **Versionado de Estado:** Cada mutación lleva un revision_id. El Store ignora updates antiguos.
- **Optimistic Update + Rollback:** La UI actualiza instantáneamente, pero revierte si el Core rechaza la mutación.
- **Middleware de Trazabilidad:** Inyectar TRACE-ID en cada mutación y loguear estado previo/nuevo.
- **Aislamiento de Fallos:** Capturar promesas rechazadas y ejecutar rollback.
- **Limpieza de Suscripciones:** Desuscribir componentes desmontados para evitar memory leaks.

---

## 2. Blindaje del Request Router (Bridge)
- **Validación Fail Fast:** Validar contratos con Zod/Pydantic en la puerta. Rechazar payloads inválidos.
- **Correlation ID:** Generar UUID único por petición y exigir que todas las respuestas lo incluyan.
- **Watchdog de Timeouts:** Temporizador por petición. Si expira, liberar memoria y avisar rollback.
- **Dead Letter Queue:** Log estructurado de peticiones fallidas para debugging y reproducibilidad.
- **Mapa de Promesas:** Map<string, { resolve, reject, timer }> para gestionar IPC y evitar leaks.
- **Logs de Error:** Imprimir [ERROR] [RequestRouter] [TRACE-ID] en cada fallo o timeout.

---

## 3. Blindaje del Data Transformer
- **Contratos Binarios:** Usar FlatBuffers/Protobuf para datos críticos. Definir esquemas inmutables.
- **Middlewares de Validación:** Validar con Zod/Joi antes de enviar por IPC.
- **Truncamiento y Clamp:** Limitar valores de color y tamaño de arrays antes de pasar a C++.
- **Boundary Checks:** Validar tamaño real vs. declarado antes de pasar binarios.
- **Precisión Numérica:** Forzar cast y clamp de floats/ints según lo que espera el Core.

---

## 4. Blindaje ThunderKoli (Seguridad y Auditoría)
- **Cifrado de Modelos:** Modelos IA y perfiles ICC cifrados en disco (AES-256), descifrados solo en RAM.
- **Gestión de Claves:** Clave derivada de hardware o ofuscada en binario, nunca hardcodeada en JS.
- **Firmas HMAC:** Cada payload IPC firmado con token efímero de sesión.
- **Hash Chaining en Logs:** Cada entrada de log incluye hash del anterior (mini-blockchain local).
- **Ofuscación y Compilación:** Prohibido distribuir .py; compilar con Nuitka/Cython. Strip de símbolos en C++ Release.

---

## 5. Blindaje de la Capa de Datos (Persistencia)
- **Modo WAL:** Activar PRAGMA journal_mode = WAL en SQLite para concurrencia y recuperación tras crash.
- **Transacciones Atómicas:** Usar clase DbTransaction que ejecuta BEGIN/COMMIT/ROLLBACK automáticamente.
- **Event Sourcing:** Guardar solo deltas (append-only) para reconstrucción y rollback.
- **Migraciones Blue/Green:** Migrar sobre copia, validar integridad y swap atómico.
- **Backup Preventivo:** Copiar proyecto.koli a .backup antes de migrar.

---

## 6. Blindaje del Auth Manager
- **Vault Nativo:** Nunca guardar tokens en localStorage. Usar keytar/safeStorage/Keychain/Secret Service.
- **Store sin Tokens:** El State Store solo sabe isAuthenticated, nunca accessToken.
- **Cifrado Local y Biometría:** Desbloquear DB local solo con PIN o biometría.
- **Zero-Knowledge:** Derivar clave con Argon2id, nunca guardar la contraseña.
- **Rotación de Refresh Tokens:** Invalida el anterior tras cada uso. Detecta y revoca si hay reutilización.

---

> **Este documento es de cumplimiento obligatorio. Cualquier PR que no respete estos principios será rechazado automáticamente por el agente o el revisor humano.**

