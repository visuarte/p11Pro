# ThunderKoli

Servicio base de seguridad para KoliCode.

## Rol

- autenticacion e identidad;
- vault y manejo de secretos;
- auditoria de acciones criticas;
- integraciones base con agentes y proveedores externos.

## Stack

- Node.js + Express
- almacenamiento JSON legacy en esta fase
- puerto por defecto: `3001`

## Scripts

```bash
npm run build   # valida sintaxis de server.js y src/server.js
npm run dev     # arranque con watch
npm start       # arranque normal
npm test        # tests existentes
```

## Entrypoint

- `server.js`

## Estado

Scaffold base listo para Fase 1 Task 2.5. La migracion a contratos formales, almacenamiento productivo y gRPC queda para fases posteriores.
