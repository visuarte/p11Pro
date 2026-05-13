# Frontend - Preload Scripts

**Capa:** Capa 1 (Frontend - Bridge entre Main y Renderer)  
**Tecnología:** Node.js + Electron Context Bridge  
**Security:** Context Isolation enabled

---

## Propósito

Los **preload scripts** actúan como un puente seguro entre el main process y el renderer process:

- Exponer APIs controladas al renderer
- Implementar context isolation
- Validar y sanitizar comunicación IPC
- Proporcionar acceso seguro a features nativas

---

## Estructura

```
preload/
├── index.ts           # Main preload script
├── ipc-bridge.ts      # IPC communication bridge
├── api-exposer.ts     # APIs exposed to renderer
└── security.ts        # Security validations
```

---

## Responsabilidades

### 1. Context Bridge
- Exponer APIs seguras con `contextBridge.exposeInMainWorld()`
- Validar inputs desde renderer
- Sanitizar outputs del main process

### 2. IPC Bridge
- Envolver `ipcRenderer.invoke()` con type safety
- Implementar retry logic
- Error handling

### 3. Security
- Content Security Policy enforcement
- Input validation
- XSS prevention

---

## Ejemplo de Uso

```typescript
// preload/index.ts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  // Safe IPC communication
  invoke: (channel: string, ...args: any[]) => {
    const validChannels = ['get-user', 'save-project'];
    if (!validChannels.includes(channel)) {
      throw new Error(`Invalid IPC channel: ${channel}`);
    }
    return ipcRenderer.invoke(channel, ...args);
  },
  
  // File operations
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  saveFile: (data: any) => ipcRenderer.invoke('dialog:saveFile', data)
});
```

---

## Security Best Practices

1. ✅ **Context Isolation:** Siempre habilitado
2. ✅ **Node Integration:** Deshabilitado en renderer
3. ✅ **Whitelist Channels:** Solo permitir canales específicos
4. ✅ **Validate Inputs:** Validar todos los datos desde renderer
5. ✅ **No Direct Access:** Nunca exponer módulos completos

---

## Referencias

- [Electron Context Isolation](https://www.electronjs.org/docs/latest/tutorial/context-isolation)
- [Preload Scripts](https://www.electronjs.org/docs/latest/tutorial/tutorial-preload)
- [Security Best Practices](https://www.electronjs.org/docs/latest/tutorial/security)

---

**Estado:** 🚧 Pendiente implementación (Task 2.2)  
**Última actualización:** 2026-05-13

