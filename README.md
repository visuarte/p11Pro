# p11Pro

Diseño asistido por código

Resumen del stack (actual):

- Node.js >= 24 (se comprobó Node v24.12.0 en entorno de desarrollo)
- npm >= 11
- Frontend: Vite (upgrade a v8), React, TypeScript
- Electron (dev dependency en frontend)

Comandos útiles:

```bash
# desde la raíz del repo
cd fusion-workspace/kolicode/frontend
npm ci            # instalación reproducible desde package-lock.json
npm run build      # construir frontend (tsc + vite)
```

Notas:
- El repositorio contiene scripts de validación de lockfile en `fusion-workspace/scripts/validate-lockfile.sh`.
- Durante la auditoría se actualizó `vite` a la serie 8.x por motivos de seguridad y es recomendable revisar la rama `auditoria/upgrade-vite-8` antes de mergear.

Más información en los PRs `auditoria/upgrade-vite-8` y `auditoria/apply-stash-on-upgrade`.
