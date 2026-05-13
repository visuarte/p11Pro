        # visuarteprintshop

        Backend ultraligero generado automaticamente.

        ## Configuracion base
        - Cliente: visuarte
        - Tarea: Imprenta ERP ONLINE
        - Descripcion: Imprenta ERP ONLINE

        ## Timeline
        - Sin hitos definidos

        ## DomainSpec
        ### Requisitos funcionales
        - Son las acciones específicas que el sistema debe permitir realizar.
- RF1 - Configuración de Productos Complejos: Permitir la selección de papel (tipo/gramaje), tintas (4/0, 4/4, 1/0), acabados y tamaños personalizados.
- RF2 - Cotizador en Tiempo Real: Cálculo automático de precios basado en escalas de cantidad y mermas técnicas.
- RF3 - Gestión de Archivos (Pre-flight): Subida de PDFs con validación automática de márgenes y perfiles de color (CMYK).
- RF4 - Gestión de Órdenes de Trabajo (OT): Seguimiento del estado de producción (En Diseño, En Prensa, Acabados, Envío).
- RF5 - Control de Inventario: Descuento automático de pliegos de papel y litros de tinta por cada orden aprobada.

        ### Casos de uso
        - Cliente	Calcular Presupuesto	El usuario selecciona opciones y obtiene un precio instantáneo.
- Diseñador	Validar Arte Final	Revisa el archivo subido y lo aprueba o rechaza para impresión.
- Operario	Actualizar Estado OT	Marca el inicio de la impresión o el paso a guillotina/acabados.
- Administrador	Gestionar Tarifas	Actualiza el coste del papel por kilo o el coste de "clic" de impresión.

        ### Modelo de datos
        - En un ERP de imprenta, la relación Producto -> Papel -> Acabado es clave.
- Order: id, clienteId, fecha, total, estado.
- JobItem: id, orderId, tipoProducto (Flyer, Libro), cantidad, especificacionesJson.
- Material: id, nombre, tipo (Soportes, Tintas, Planchas), stockActual, costeUnidad.
- PricingGrid: materialId, rangoCantidad, precioVenta.

        ### APIs necesarias
        - Para un ERP moderno, usarás una arquitectura RESTful o GraphQL.
- Módulo de Cotización (Public/Private)
- POST /api/v1/quote/calculate: Recibe las especificaciones y devuelve el precio desglosado.
- GET /api/v1/materials/available: Lista los papeles y acabados en stock.
- Módulo de Producción (Internal)
- GET /api/v1/production/queue: Lista de trabajos pendientes por puesto (ej. solo los de "Prensa").
- PATCH /api/v1/production/job/{id}/status: Cambia el estado de la orden de trabajo.
- Módulo de Archivos
- POST /api/v1/files/upload: Sube el arte final asociado a un JobItem.
- GET /api/v1/files/{id}/check: Devuelve el reporte de errores técnicos del PDF.

        ## UI implementation guidance
        - UI Preset: enterprise-dashboard
        - UI Tooling: design-tokens,ui-kit,a11y-checks,visual-regression

        ## Capacidades base
        - Ktor 2.x + Kotlin
        - Contrato HTTP JSON estandar
        - Endpoints `/health` y `/ready`
        - Manejo de errores y logging
        - Dockerfile listo para despliegue
        - CI de ejemplo para build y test

        ## Ejecucion local
        ./gradlew run