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

## Estructura Propuesta

```
renderer/
├── components/      # React components
│   ├── canvas/     # Canvas editor components
│   ├── ui/         # UI components (buttons, inputs, etc.)
│   └── layout/     # Layout components
├── pages/          # Page-level components
├── hooks/          # Custom React hooks
├── store/          # State management (Zustand)
├── api/            # API client (HTTP + WebSocket)
├── styles/         # Global styles, themes
├── utils/          # Utility functions
└── App.tsx         # Root component
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

- **React:** 18.x
- **TypeScript:** 5.6.3
- **Vite:** 8.0.12
- **Tailwind CSS:** Configurado
- **ESLint + Prettier:** Configurado

---

## Referencias

- [Electron Renderer Process](https://www.electronjs.org/docs/latest/tutorial/process-model#the-renderer-process)
- [React 18 Docs](https://react.dev/)
- Task 2.3 en FASE1-PLAN.md

---

**Estado:** 🔧 Parcialmente implementado  
**Última actualización:** 2026-05-13

