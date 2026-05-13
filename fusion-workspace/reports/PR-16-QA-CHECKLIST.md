PR #16 — QA checklist

Objetivo: validar cambios introducidos por `npm audit fix --force` (actualización de Vite a 8.x) antes de merge.

Matriz de pruebas mínima

1) Build
- [ ] `npm ci` en CI (si falla, probar `npm install`) — comprobar que `npm run build` termina sin errores.
- [ ] `npm run build` localmente en Node 20 y Node 24 (si es posible).
- [ ] Verificar que `dist/` contiene `index.html` y assets esperados.

2) Smoke tests en `dist/`
- [ ] Servir `dist/` con precompresión (.br/.gz) y comprobar `Content-Encoding` al solicitar `Accept-Encoding: br,gzip`.
- [ ] Comprobar checksum SHA256 de `dist/index.html` (comparar con build anterior si procede).

3) Dev-mode
- [ ] `npm run dev` (si aplica) arranca sin errores en entorno de desarrollo.
- [ ] Revisar que hot-reload / dev server funciona con los plugins usados.

4) Test automatizados
- [ ] Ejecutar la suite de tests unitarios (si existe): `npm test` / `pnpm test`.
- [ ] Ejecutar E2E / integración que cubran las rutas críticas (login, carga de assets principales).

5) Revisión de compatibilidad y entorno
- [ ] Revisar `package.json` y `package-lock.json` para engines/peers que exijan Node >=20/>=22.
- [ ] Asegurar que runners CI y entornos de staging usan Node >=20 (si alguna dependencia lo exige).

6) Revisión de cambios en configuración
- [ ] Revisar `vite.config.*` y plugins; actualizar documentación si se modificó configuración de build.
- [ ] Verificar que los polyfills o configuraciones específicas para Electron (si aplica) continúan funcionando.

7) Seguridad y vulnerabilidades
- [ ] Ejecutar `npm audit` post-merge candidate y validar que vulnerabilidades quedan resueltas.

Notas/Acciones recomendadas
- Si se detectan problemas por el salto a Vite 8.x, considerar revertir este PR y aplicar un fix selectivo (actualizar solo `esbuild` o aplicar `overrides`) en un PR alternativo.

