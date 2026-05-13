# Frontend - Electron Main Process

**Capa:** Capa 1 (Frontend)  
**Tecnología:** Electron Main Process + Node.js  
**Puerto:** N/A (proceso principal de Electron)

---

## Propósito

Este directorio contiene el **proceso principal (main process)** de Electron, responsable de:

- Gestión de ventanas de la aplicación
- Manejo del ciclo de vida de la aplicación
- Comunicación IPC (Inter-Process Communication) con el renderer
- Acceso a APIs nativas del sistema operativo
- Gestión de menús, shortcuts y tray icons

---

## Estructura

```
main/
├── index.ts           # Entry point del main process
├── window.ts          # Window management
├── ipc-handlers.ts    # IPC handlers
├── menu.ts            # Application menu
└── preload.ts         # Preload script reference
```

---

## Responsabilidades

### 1. Window Management
- Crear y gestionar BrowserWindow instances
- Configurar propiedades de ventana
- Implementar deep linking

### 2. IPC Communication
- Registrar handlers para eventos desde renderer
- Enviar eventos al renderer process
- Validar requests IPC

### 3. Native Integration
- File system access
- Native dialogs
- System notifications
- Auto-updater integration

---

## Comunicación

```
Renderer Process (React)
    ↕ IPC
Main Process (Node.js)
    ↕ Native APIs
Operating System
```

---

## Referencias

- [Electron Main Process Docs](https://www.electronjs.org/docs/latest/tutorial/process-model#the-main-process)
- [IPC Communication](https://www.electronjs.org/docs/latest/tutorial/ipc)
- Task 2.2 en FASE1-PLAN.md

---

**Estado:** 🚧 Pendiente implementación (Task 2.2)  
**Última actualización:** 2026-05-13

