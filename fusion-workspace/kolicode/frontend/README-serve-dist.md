README: serve-dist-compress
=========================

Propósito
--------
Pequeño README para explicar cómo usar el servidor de pruebas que precomprime y sirve el contenido de `dist/` con soporte para gzip y Brotli. Está pensado solo para pruebas locales y QA, no como servidor de producción.

Archivos
-------
- `serve-dist-compress.cjs` — servidor Node (CommonJS) que precomprime (`.gz`, `.br`) y sirve archivos estáticos desde `dist/`.
- `serve-dist-compress.js` — versión ESM (no utilizada si `package.json` contiene `"type": "module"`).

Requisitos
---------
- Node.js >= 14 (se recomienda Node 18+; Node 24 en tu entorno soporta Brotli nativamente).
- `dist/` generado por `npm run build` en la carpeta `fusion-workspace/kolicode/frontend`.

Uso rápido
---------
Desde la carpeta `fusion-workspace/kolicode/frontend`:

```bash
# Ejecutar la versión CommonJS (recomendada si package.json tiene "type": "module")
node serve-dist-compress.cjs 5000

# Alternativamente, si no usas package.json con "type": "module", puedes usar la versión .js:
# node serve-dist-compress.js 5000
```

También puedes usar el script npm incorporado (recomendado) desde la misma carpeta:

```bash
npm run serve:dist
```

Servidor con compresión "en caliente" (on-the-fly)
-----------------------------------------------
Para pruebas rápidas puedes usar la variante que aplica compresión on-the-fly (sin generar archivos `.br`/`.gz`):

```bash
npm run serve:dist:live
# o
node serve-dist-on-the-fly.cjs 5000
```

Trade-offs
---------
- Precompresión (`npm run serve:dist`)
  - Pros: refleja mejor el comportamiento de producción (CDN), bajo uso de CPU en tiempo de petición y latencia consistente.
  - Contras: requiere espacio adicional para los archivos `.br`/`.gz` y regenerarlos cuando actualizas `dist/`.

- Compresión on-the-fly (`npm run serve:dist:live`)
  - Pros: no requiere precomprimir, útil para pruebas rápidas y evitar pasos adicionales al iterar localmente.
  - Contras: mayor uso de CPU por petición y variabilidad en latencia; no refleja exactamente cómo un CDN servirá contenidos en producción.

Recomendación: conservar ambas utilidades. Usa `serve:dist` para QA que necesite reproducir producción y `serve:dist:live` para pruebas locales rápidas.

El servidor precomprimirá los archivos en `dist/` (crea `.gz` y `.br` junto a cada fichero) y los servirá cuando el cliente solicite `Accept-Encoding: br` o `gzip`.

Pruebas con curl
---------------
```bash
# Cabeceras básicas
curl -I http://localhost:5000/

# Cabeceras solicitando encoding (gzip/brotli)
curl -sSI -H 'Accept-Encoding: br,gzip' http://localhost:5000/ | sed -n '1,120p'

# Verificar index.html directo
curl -Is http://localhost:5000/index.html | sed -n '1,120p'
```

Notas
----
- El script precomprime al arrancar. Si actualizas `dist/`, reinicia el servidor para regenerar los `.br`/`.gz`.
- Esta herramienta es para pruebas locales y QA. En producción usa un servidor web (nginx/Caddy/Cloud CDN) configurado para servir archivos comprimidos correctamente.
- Si prefieres compresión on-the-fly en lugar de precompresión, abriré otra variante que comprime en caliente.

Contribuir / PR
--------------
Este archivo fue añadido en la rama `chore/frontend/serve-dist-compress`. Si quieres cambios en el texto o formatos, indícalo y lo actualizo en la rama antes de mergear.

