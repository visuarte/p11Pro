# 📡 EJEMPLOS DE API - IMPRENTA ERP

Colección de ejemplos de requests HTTP para probar todos los endpoints del sistema.

---

## 🔧 CONFIGURACIÓN

Base URL: `http://localhost:8080`
Content-Type: `application/json`

---

## 1️⃣ PRODUCTOS

### 1.1 Listar Todos los Productos

```http
GET /api/v1/products HTTP/1.1
Host: localhost:8080
```

**Query Parameters:**
- `calculationMode` (opcional): `AREA`, `SHEET`, `UNIT`
- `category` (opcional): slug de categoría

**Ejemplo con filtro:**
```http
GET /api/v1/products?calculationMode=AREA HTTP/1.1
Host: localhost:8080
```

**Respuesta:**
```json
[
  {
    "id": 1,
    "sku": "LONA-OJALES",
    "name": "Lona con Ojales",
    "description": "Lona para exterior con refuerzo perimetral y ojales",
    "calculationMode": "AREA",
    "minQuantity": 1,
    "maxQuantity": null
  },
  {
    "id": 2,
    "sku": "TARJETA-85X55",
    "name": "Tarjeta de Visita 85x55mm",
    "description": "Tarjeta de visita estándar en papel 350gr",
    "calculationMode": "SHEET",
    "minQuantity": 100,
    "maxQuantity": 10000
  }
]
```

---

### 1.2 Obtener Producto por ID

```http
GET /api/v1/products/1 HTTP/1.1
Host: localhost:8080
```

**Respuesta:**
```json
{
  "id": 1,
  "sku": "LONA-OJALES",
  "name": "Lona con Ojales",
  "description": "Lona para exterior",
  "calculationMode": "AREA",
  "minQuantity": 1,
  "maxQuantity": null
}
```

---

### 1.3 Obtener Configuración de Producto

```http
GET /api/v1/products/1/configuration HTTP/1.1
Host: localhost:8080
```

**Respuesta para AREA:**
```json
{
  "productId": 1,
  "calculationMode": "AREA",
  "config": {
    "materialType": "CANVAS",
    "pricePerSqm": 8.50,
    "wasteFactor": 1.05,
    "minWidthCm": 50,
    "maxWidthCm": 1000,
    "minHeightCm": 50,
    "maxHeightCm": 1000,
    "inkCostPerSqm": 2.00,
    "hasEyelets": true,
    "eyeletSpacingCm": 50,
    "costPerEyelet": 0.15
  }
}
```

---

## 2️⃣ PRICING - CÁLCULO DE PRECIOS

### 2.1 Calcular Precio Individual

#### Ejemplo: Lona 3m × 2m (AREA)

```http
POST /api/v1/pricing/calculate HTTP/1.1
Host: localhost:8080
Content-Type: application/json

{
  "productId": 1,
  "quantity": 1,
  "widthCm": "300",
  "heightCm": "200"
}
```

**Respuesta:**
```json
{
  "productId": 1,
  "productName": "Lona con Ojales",
  "quantity": 1,
  "unitPrice": "73.52",
  "totalPrice": "73.52",
  "breakdown": {
    "baseCost": "53.55",
    "additionalCosts": {
      "Tinta": "12.60",
      "Ojales (20 uds)": "3.00"
    },
    "subtotal": "69.15",
    "discount": "0.00",
    "finalCost": "69.15",
    "margin": "20.75",
    "sellingPrice": "73.52",
    "details": "Área: 6.00 m² (300cm x 200cm) | Desperdicio: 105% | Material: CANVAS"
  }
}
```

---

#### Ejemplo: 500 Tarjetas de Visita (SHEET)

```http
POST /api/v1/pricing/calculate HTTP/1.1
Host: localhost:8080
Content-Type: application/json

{
  "productId": 2,
  "quantity": 500
}
```

**Respuesta:**
```json
{
  "productId": 2,
  "productName": "Tarjeta de Visita 85x55mm",
  "quantity": 500,
  "unitPrice": "0.02",
  "totalPrice": "10.00",
  "breakdown": {
    "baseCost": "7.25",
    "additionalCosts": {
      "Arranque/Setup": "5.00",
      "Material (29 pliegos)": "2.90",
      "Impresión (clicks)": "1.45"
    },
    "subtotal": "7.25",
    "discount": "0.00",
    "finalCost": "7.25",
    "margin": "2.75",
    "sellingPrice": "0.02",
    "details": "Cantidad: 500 uds | Cabidas: 21/pliego | Pliegos totales: 29 (24 + 5 merma)"
  }
}
```

---

#### Ejemplo: 10 Roll-ups (UNIT con descuento)

```http
POST /api/v1/pricing/calculate HTTP/1.1
Host: localhost:8080
Content-Type: application/json

{
  "productId": 3,
  "quantity": 10
}
```

**Respuesta:**
```json
{
  "productId": 3,
  "productName": "Roll-up 85x200cm",
  "quantity": 10,
  "unitPrice": "44.10",
  "totalPrice": "441.00",
  "breakdown": {
    "baseCost": "35.00",
    "additionalCosts": {},
    "subtotal": "315.00",
    "discount": "35.00",
    "finalCost": "315.00",
    "margin": "126.00",
    "sellingPrice": "44.10",
    "details": "Precio unitario: 31.50€ | 10% descuento por volumen"
  }
}
```

---

### 2.2 Cálculo en Lote (Batch)

```http
POST /api/v1/pricing/batch HTTP/1.1
Host: localhost:8080
Content-Type: application/json

[
  {
    "productId": 1,
    "quantity": 1,
    "widthCm": "300",
    "heightCm": "200"
  },
  {
    "productId": 2,
    "quantity": 500
  },
  {
    "productId": 3,
    "quantity": 5
  }
]
```

**Respuesta:**
```json
[
  {
    "productId": 1,
    "productName": "Lona con Ojales",
    "quantity": 1,
    "unitPrice": "73.52",
    "totalPrice": "73.52",
    "breakdown": { ... }
  },
  {
    "productId": 2,
    "productName": "Tarjeta de Visita",
    "quantity": 500,
    "unitPrice": "0.02",
    "totalPrice": "10.00",
    "breakdown": { ... }
  },
  {
    "productId": 3,
    "productName": "Roll-up",
    "quantity": 5,
    "unitPrice": "46.55",
    "totalPrice": "232.75",
    "breakdown": { ... }
  }
]
```

---

### 2.3 Simular Escalado de Precios

```http
POST /api/v1/pricing/simulate HTTP/1.1
Host: localhost:8080
Content-Type: application/json

{
  "productId": 2
}
```

**Respuesta:**
```json
{
  "productId": 2,
  "simulations": [
    {
      "quantity": 1,
      "unitPrice": "6.50",
      "totalPrice": "6.50"
    },
    {
      "quantity": 10,
      "unitPrice": "0.85",
      "totalPrice": "8.50"
    },
    {
      "quantity": 25,
      "unitPrice": "0.46",
      "totalPrice": "11.50"
    },
    {
      "quantity": 50,
      "unitPrice": "0.26",
      "totalPrice": "13.00"
    },
    {
      "quantity": 100,
      "unitPrice": "0.085",
      "totalPrice": "8.50"
    },
    {
      "quantity": 250,
      "unitPrice": "0.048",
      "totalPrice": "12.00"
    },
    {
      "quantity": 500,
      "unitPrice": "0.020",
      "totalPrice": "10.00"
    },
    {
      "quantity": 1000,
      "unitPrice": "0.017",
      "totalPrice": "17.00"
    }
  ]
}
```

---

## 3️⃣ PRESUPUESTOS (QUOTES)

### 3.1 Crear Presupuesto

```http
POST /api/v1/quotes HTTP/1.1
Host: localhost:8080
Content-Type: application/json

{
  "customerId": 123,
  "lines": [
    {
      "productId": 1,
      "quantity": 2,
      "widthCm": "300",
      "heightCm": "200",
      "options": {}
    },
    {
      "productId": 2,
      "quantity": 500,
      "options": {}
    },
    {
      "productId": 3,
      "quantity": 5,
      "options": {}
    }
  ],
  "validDays": 30
}
```

**Respuesta:**
```json
{
  "id": 1,
  "quoteNumber": "Q-2024-001",
  "customerId": 123,
  "status": "DRAFT",
  "lines": [
    {
      "id": 1,
      "productId": 1,
      "productName": "Lona con Ojales",
      "quantity": 2,
      "widthCm": 300,
      "heightCm": 200,
      "unitPrice": "73.52",
      "lineTotal": "147.04",
      "costBreakdown": { ... }
    },
    {
      "id": 2,
      "productId": 2,
      "productName": "Tarjeta de Visita",
      "quantity": 500,
      "unitPrice": "0.02",
      "lineTotal": "10.00",
      "costBreakdown": { ... }
    },
    {
      "id": 3,
      "productId": 3,
      "productName": "Roll-up",
      "quantity": 5,
      "unitPrice": "46.55",
      "lineTotal": "232.75",
      "costBreakdown": { ... }
    }
  ],
  "subtotal": "389.79",
  "taxAmount": "81.86",
  "total": "471.65",
  "validUntil": "2024-02-15T00:00:00Z",
  "createdAt": "2024-01-16T10:30:00Z"
}
```

---

### 3.2 Obtener Presupuesto

```http
GET /api/v1/quotes/1 HTTP/1.1
Host: localhost:8080
```

---

### 3.3 Descargar PDF del Presupuesto

```http
GET /api/v1/quotes/1/pdf HTTP/1.1
Host: localhost:8080
Accept: application/pdf
```

**Headers de Respuesta:**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="presupuesto-Q-2024-001.pdf"
```

---

## 4️⃣ ADMINISTRACIÓN (requiere autenticación)

### 4.1 Crear Producto

```http
POST /api/v1/admin/products HTTP/1.1
Host: localhost:8080
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "sku": "VINILO-CORTE",
  "name": "Vinilo de Corte",
  "description": "Vinilo autoadhesivo para rotulación",
  "calculationMode": "AREA",
  "configuration": {
    "materialType": "VINYL",
    "pricePerSqm": 5.00,
    "wasteFactor": 1.10,
    "minWidthCm": 10,
    "maxWidthCm": 150,
    "minHeightCm": 10,
    "maxHeightCm": 500,
    "inkCostPerSqm": 0.00,
    "straightCutCostPerMeter": 0.50
  }
}
```

**Respuesta:**
```json
{
  "id": 4,
  "sku": "VINILO-CORTE",
  "name": "Vinilo de Corte",
  "description": "Vinilo autoadhesivo para rotulación",
  "calculationMode": "AREA",
  "status": "ACTIVE",
  "createdAt": "2024-01-16T10:30:00Z"
}
```

---

### 4.2 Actualizar Producto

```http
PUT /api/v1/admin/products/4 HTTP/1.1
Host: localhost:8080
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "name": "Vinilo de Corte Premium",
  "description": "Vinilo autoadhesivo de alta calidad",
  "configuration": {
    "pricePerSqm": 6.50
  }
}
```

---

### 4.3 Eliminar Producto

```http
DELETE /api/v1/admin/products/4 HTTP/1.1
Host: localhost:8080
Authorization: Bearer YOUR_JWT_TOKEN
```

**Respuesta:**
```
HTTP/1.1 204 No Content
```

---

## 5️⃣ CASOS DE USO COMPLETOS

### Caso 1: Cliente pide cotización por WhatsApp

**Cliente dice:**
> "Hola, necesito una lona de 4 metros de ancho por 2 de alto con ojales para colgar. ¿Cuánto me cuesta?"

**Request:**
```http
POST /api/v1/pricing/calculate HTTP/1.1
Host: localhost:8080
Content-Type: application/json

{
  "productId": 1,
  "quantity": 1,
  "widthCm": "400",
  "heightCm": "200"
}
```

**Respuesta al cliente:**
> "La lona de 4m × 2m con ojales te costaría **97.36€** (IVA incluido). El precio incluye:
> - Material (8 m²)
> - Impresión a todo color
> - Ojales cada 50cm (24 ojales)
> - Presupuesto válido 30 días"

---

### Caso 2: Cliente pide tarjetas de visita

**Cliente dice:**
> "Quiero 200 tarjetas de visita. ¿Cuánto cuestan?"

**Request:**
```http
POST /api/v1/pricing/calculate HTTP/1.1
Host: localhost:8080
Content-Type: application/json

{
  "productId": 2,
  "quantity": 200
}
```

**Pero el cliente pregunta:**
> "¿Y si pido 500 o 1000?"

**Usar simulador:**
```http
POST /api/v1/pricing/simulate HTTP/1.1
Host: localhost:8080
Content-Type: application/json

{
  "productId": 2
}
```

**Respuesta al cliente:**
```
Tarjetas de Visita - Precios:
- 100 tarjetas:  8.50€  (0.085€/ud)
- 200 tarjetas:  9.50€  (0.048€/ud) ← Tu pedido
- 500 tarjetas: 10.00€  (0.020€/ud) ⭐ Recomendado
- 1000 tarjetas: 17.00€ (0.017€/ud)

Te recomiendo pedir 500 porque el coste por tarjeta es mucho menor.
```

---

### Caso 3: Pedido completo con presupuesto

**Cliente dice:**
> "Necesito:
> - 1 lona 3×2m
> - 500 tarjetas
> - 3 roll-ups"

**Request:**
```http
POST /api/v1/quotes HTTP/1.1
Host: localhost:8080
Content-Type: application/json

{
  "customerId": 456,
  "lines": [
    {
      "productId": 1,
      "quantity": 1,
      "widthCm": "300",
      "heightCm": "200"
    },
    {
      "productId": 2,
      "quantity": 500
    },
    {
      "productId": 3,
      "quantity": 3
    }
  ],
  "validDays": 30
}
```

**Enviar PDF:**
```http
GET /api/v1/quotes/1/pdf HTTP/1.1
```

---

## 6️⃣ ERRORES COMUNES

### Error 400: Validación fallida

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Dimensiones fuera del rango permitido",
  "timestamp": 1705404600000
}
```

### Error 404: Producto no encontrado

```json
{
  "error": "NOT_FOUND",
  "message": "Product not found: 999",
  "timestamp": 1705404600000
}
```

### Error 429: Rate limit excedido

```json
{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests. Please try again later.",
  "retryAfter": 60,
  "timestamp": 1705404600000
}
```

### Error 500: Error interno

```json
{
  "error": "INTERNAL_ERROR",
  "message": "An error occurred processing your request",
  "timestamp": 1705404600000
}
```

---

## 📝 NOTAS IMPORTANTES

1. **Autenticación**: Los endpoints de administración requieren JWT token
2. **Rate Limiting**: 
   - Rutas públicas: 100 req/min
   - API autenticada: 1000 req/min
3. **Validaciones**:
   - Cantidad mínima: 1
   - Dimensiones deben estar dentro del rango configurado
   - Batch máximo: 100 items
4. **Precisión**: Todos los precios se redondean a 2 decimales
5. **Moneda**: Todos los precios en EUR (€)

---

## 🔨 HERRAMIENTAS RECOMENDADAS

### Postman

Importa esta colección:
```json
{
  "info": {
    "name": "Imprenta ERP API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/"
  },
  "item": [...]
}
```

### cURL

Todos los ejemplos están listos para usar con cURL.

### HTTPie

```bash
http POST localhost:8080/api/v1/pricing/calculate \
  productId:=1 \
  quantity:=1 \
  widthCm=300 \
  heightCm=200
```

---

**¡Listo para empezar a cotizar! 🚀**
