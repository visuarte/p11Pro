# proyectos_generados

Directorio de trabajo histórico del Hub de `UniversalEngine`.

## Regla vigente

Las carpetas vivas del Hub siguen usando esta convención:

```text
proyectos_generados/proyecto_<id>
```

Mientras el motor continúe resolviendo rutas por ese patrón, **no se deben mover** esas carpetas fuera de esta raíz.

## Limpieza segura

Para reducir ruido sin romper el runtime:

```text
proyectos_generados/
├── _archive/        # snapshots/copias retiradas
├── _candidates/     # candidatos a plantilla o evaluación
├── _legacy_import/  # material importado no normalizado
└── proyecto_<id>/   # proyectos vivos del Hub
```

## Qué va en cada zona

### `proyecto_<id>/`
- copia viva que el Hub puede abrir/sincronizar
- no mover sin antes desacoplar la resolución por ruta fija

### `_archive/`
- snapshots no activos
- copias retiradas del flujo diario
- material consultable pero fuera del camino operativo

### `_candidates/`
- candidatos a plantilla o base reutilizable
- evaluaciones de saneamiento
- documentación mínima de por qué un proyecto se está evaluando

### `_legacy_import/`
- contenido importado que no sigue todavía la convención normal

## Decisión actual sobre `proyecto_18`

`proyecto_18` está **en evaluación como posible base reutilizable**, pero su copia viva no debe moverse de `proyecto_18/` hasta que exista una convención nueva o una capa de resolución por metadatos.

## Siguiente paso recomendado

1. inventariar qué `proyecto_<id>` siguen siendo consultables
2. decidir qué candidatos merecen promoción a plantilla
3. mover solo copias o snapshots a `_archive/`, nunca la copia viva por defecto
