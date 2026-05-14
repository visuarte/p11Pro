# Frontend - Renderer Process (React App)

**Capa:** Capa 1 (Frontend)  
**Tecnología:** React 18 + TypeScript + Vite  
**Puerto:** 5173 (dev), N/A (producción - dentro de Electron)

---

## Propósito

Este directorio contiene la **aplicación React** que se ejecuta en el renderer process de Electron:

- Interfaz de usuario (UI/UX)
- Canvas editor
- Gestión de estado (Zustand/Redux)
- Comunicación con Bridge vía IPC
- Design System components

---

## Estructura

```
renderer/
├── App.tsx                 # Root React component
├── RendererShellHost.tsx   # Host del shell actual dentro del árbol React
├── components/
│   ├── ElectronPingDemo.tsx
│   └── RendererDiagnostics.tsx
├── electronBridge.ts       # Wrapper tipado del preload bridge
├── index.ts                # Re-export del bridge para imports estables
└── types/
    └── electron.d.ts       # Tipos globales del renderer
```

---

## Responsabilidades

### 1. UI/UX

- Renderizar interfaz de usuario
- Manejar interacciones del usuario
- Animaciones y transiciones

### 2. Canvas Editor

- Editor de diseño visual
- Herramientas de dibujo
- Layers, transformaciones

### 3. State Management

- Estado de la aplicación
- Cache local
- Sincronización con backend

### 4. Communication

- IPC con main process
- HTTP calls al Bridge
- WebSocket para real-time updates

---

## Comunicación

```
Renderer (React)
    ↕ IPC
Main Process
    ↕ HTTP/WebSocket
Bridge (API Gateway)
```

---

## Stack Actual

- **React:** 19.x
- **TypeScript:** 5.6.3
- **Vite:** 5.4.21
- **ReactDOM:** 19.x
- **Zustand:** Configurado
- **ESLint + Prettier:** Configurado

---

## Referencias

- [Electron Renderer Process](https://www.electronjs.org/docs/latest/tutorial/process-model#the-renderer-process)
- [React 18 Docs](https://react.dev/)
- Task 2.3 en FASE1-PLAN.md

---

## Estado actual

- ✅ React renderer montado con `createRoot()` desde `src/main.ts`
- ✅ Integración con Electron via preload bridge (`window.electron`, `window.api`, `window.ipcRenderer`)
- ✅ Context isolation preservado; el renderer no usa APIs nativas directas
- ✅ IPC base operativo para ping, logging, open file y settings
- ✅ Estado local con Zustand conectado al handler `update-settings`

**Estado:** ✅ Implementado (Task 2.3)  
**Última actualización:** 2026-05-15
