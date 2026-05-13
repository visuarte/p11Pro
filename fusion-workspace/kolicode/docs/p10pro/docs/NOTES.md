# Notes

## Decisiones vigentes

- `config/project-context.json` es la fuente estructurada del proyecto.
- `README.md` resume el estado humano actual.
- `docs/index.html` y `docs/inicio/codedesign_technical_docs_v2.html` son vistas derivadas.
- La base ejecutable minima usa `Vite + TypeScript + npm + CSS`.
- `creative/processing/` es una superficie separada del runtime web.

## Regla operativa

Ningun archivo debe describir como vigente una capacidad que no exista en disco o no pueda ejecutarse hoy.

## Riesgos evitados con esta alineacion

- Inflar el alcance real del proyecto.
- Mezclar template universal con contrato activo.
- Tomar decisiones tecnicas sobre modulos que aun no existen.
