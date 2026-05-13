# 🖨️ ERP para Imprenta Online

Sistema ERP completo para gestión de imprenta con motor de pricing inteligente que soporta tres estrategias de cálculo: **Gran Formato** (por área), **Pequeño Formato** (por pliego) y **Merchandising** (unitario).

---

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Arquitectura](#-arquitectura)
- [Motor de Pricing](#-motor-de-pricing)
- [Instalación](#-instalación)
- [Uso](#-uso)
- [API Endpoints](#-api-endpoints)
- [Seguridad](#-seguridad)
- [Testing](#-testing)
- [Deployment](#-deployment)

---

## ✨ Características

### 🎯 Motor de Pricing Inteligente

El sistema implementa **tres estrategias de pricing** que se seleccionan automáticamente según el tipo de producto:

#### 1️⃣ **AREA** - Gran Formato
Para productos como lonas, vinilos, dibond, PVC, forex, metacrilato.

**Características:**
- Cálculo por metro cuadrado (m²)
- Factor de desperdicio configurable
- Costes por área: tinta, laminado
- Costes por perímetro: dobladillo, ojales, corte
- Precio lineal: 1 lona = X€, 10 lonas = 10X€

**Fórmula:**
```
Coste = (Ancho × Alto) × PrecioMaterial/m² × FactorDesperdicio 
        + CostesAdicionales(área + perímetro)
```

#### 2️⃣ **SHEET** - Pequeño Formato
Para tarjetas, flyers, dípticos, cartelería, pegatinas.

**Características:**
- Cálculo por pliego con imposición automática
- Costes fijos de arranque (setup)
- Economía de escala: 100 tarjetas ≠ 1000/10
- Merma incluida en cálculo
- Aprovechamiento óptimo del pliego

**Fórmula:**
```
PliegosNecesarios = ceil(Cantidad / CabidasPorPliego)
PliegosTotales = PliegosNecesarios + PliegosMerma
Coste = CosteSetup + (CostesMateriales + CosteClick) × PliegosTotales
PrecioUnitario = Coste / Cantidad
```

#### 3️⃣ **UNIT** - Merchandising
Para productos unitarios como roll-ups, tazas, bolígrafos, displays.

**Características:**
- Precio fijo por unidad
- Descuentos por volumen configurables
- Markup/margen personalizable
- Precios especiales por rangos

---

## 🏗️ Arquitectura

### Stack Tecnológico

- **Backend**: Kotlin + Ktor
- **Base de Datos**: PostgreSQL
- **API**: REST JSON
- **Testing**: JUnit 5
- **Containerización**: Docker

### Estructura del Proyecto

```
imprenta-erp/
│
├── schema.sql                    # Schema de base de datos
├── PricingEngine.kt              # Motor de cálculo de precios
├── KtorApiServer.kt              # API REST
├── PricingEngineTest.kt          # Tests unitarios
├── .env.example                  # Variables de entorno
├── AUDITORIA_SEGURIDAD.md        # Documento de seguridad
├── Dockerfile                    # Configuración Docker
└── README.md                     # Este archivo
```

### Modelo de Datos

```
┌─────────────┐
│  products   │ (Catálogo base)
├─────────────┤
│ id          │
│ sku         │
│ name        │
│ calculation_mode ← AREA | SHEET | UNIT
└─────────────┘
       │
       ├────────┬────────────┬────────────
       │        │            │
       ▼        ▼            ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ area_config  │ │ sheet_config │ │ unit_config  │
└──────────────┘ └──────────────┘ └──────────────┘
```

---

## 💰 Motor de Pricing

### Ejemplo 1: Lona con Ojales (AREA)

**Entrada:**
```kotlin
Product: Lona con Ojales
Dimensiones: 300cm × 200cm (3m × 2m)
Material: Canvas a 8.50€/m²
Extras: Ojales cada 50cm a 0.15€/ojal
```

**Cálculo:**
```
Área = 3m × 2m = 6 m²
Área con desperdicio (5%) = 6 × 1.05 = 6.3 m²
Coste material = 6.3 × 8.50€ = 53.55€

Perímetro = (3 + 2) × 2 = 10m = 1000cm
Ojales = 1000 / 50 = 20 ojales
Coste ojales = 20 × 0.15€ = 3.00€

Coste total = 53.55€ + 3.00€ = 56.55€
Margen 30% = 16.97€
Precio venta = 73.52€
```

### Ejemplo 2: Tarjetas de Visita (SHEET)

**Entrada:**
```kotlin
Product: Tarjeta 85×55mm
Cantidad: 100 unidades
Pliego: SRA3 (320×450mm)
Cabidas: 21 tarjetas/pliego
```

**Cálculo 100 tarjetas:**
```
Pliegos necesarios = ceil(100/21) = 5
Pliegos totales = 5 + 5 (merma) = 10

Coste setup = 5.00€ (fijo)
Coste material = 10 × 0.10€ = 1.00€
Coste clicks = 10 × 0.05€ = 0.50€
Total = 6.50€

Precio unitario = 6.50€ / 100 = 0.065€
Margen = 0.065€ × 30% = 0.0195€
PVP unitario = 0.0845€ ≈ 0.08€
Total = 8.00€
```

**Cálculo 1000 tarjetas:**
```
Pliegos necesarios = ceil(1000/21) = 48
Pliegos totales = 48 + 5 = 53

Coste setup = 5.00€ (fijo - NO se multiplica)
Coste material = 53 × 0.10€ = 5.30€
Coste clicks = 53 × 0.05€ = 2.65€
Total = 12.95€

Precio unitario = 12.95€ / 1000 = 0.01295€
PVP unitario ≈ 0.017€
Total ≈ 17.00€

→ 1000 tarjetas NO cuestan 10× más que 100
→ Economía de escala aplicada correctamente
```

### Ejemplo 3: Roll-up (UNIT)

**Entrada:**
```kotlin
Product: Roll-up 85×200cm
Cantidad: 10 unidades
Coste unitario: 35.00€
Descuentos: 0% (1-4), 5% (5-9), 10% (10+)
```

**Cálculo:**
```
Rango aplicable: 10+ unidades → 10% descuento
Coste con descuento = 35€ - (35€ × 10%) = 31.50€
Margen 40% = 12.60€
Precio unitario = 44.10€
Total 10 unidades = 441.00€
```

---

## 🚀 Instalación

### Requisitos Previos

- Java 17+
- PostgreSQL 13+
- Docker (opcional)
- Gradle 7+

### Setup Local

1. **Clonar repositorio**
```bash
git clone https://github.com/tu-usuario/imprenta-erp.git
cd imprenta-erp
```

2. **Configurar variables de entorno**
```bash
cp .env.example .env
# Editar .env con tus credenciales
```

3. **Crear base de datos**
```bash
createdb imprenta_erp
psql imprenta_erp < schema.sql
```

4. **Ejecutar aplicación**
```bash
./gradlew run
```

### Setup con Docker

```bash
docker build -t imprenta-erp .
docker run -p 8080:8080 \
  -e DATABASE_URL=postgresql://... \
  -e JWT_SECRET=your-secret \
  imprenta-erp
```

---

## 📖 Uso

### Calcular Precio de Lona

```bash
curl -X POST http://localhost:8080/api/v1/pricing/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 1,
    "quantity": 1,
    "widthCm": "300",
    "heightCm": "200"
  }'
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
    "margin": "20.75",
    "sellingPrice": "73.52",
    "details": "Área: 6.00 m² (300cm x 200cm)"
  }
}
```

### Simular Escalado de Precios

```bash
curl -X POST http://localhost:8080/api/v1/pricing/simulate \
  -H "Content-Type: application/json" \
  -d '{"productId": 2}'
```

Obtiene precios para cantidades: 1, 10, 25, 50, 100, 250, 500, 1000

---

## 🔌 API Endpoints

### Productos

```
GET    /api/v1/products                      # Listar productos
GET    /api/v1/products/{id}                 # Obtener producto
GET    /api/v1/products/{id}/configuration   # Config de pricing
```

### Pricing

```
POST   /api/v1/pricing/calculate     # Calcular precio
POST   /api/v1/pricing/batch         # Cálculo en lote
POST   /api/v1/pricing/simulate      # Simular escalado
```

### Presupuestos

```
POST   /api/v1/quotes                # Crear presupuesto
GET    /api/v1/quotes/{id}           # Obtener presupuesto
GET    /api/v1/quotes/{id}/pdf       # Descargar PDF
```

### Administración

```
POST   /api/v1/admin/products        # Crear producto
PUT    /api/v1/admin/products/{id}   # Actualizar producto
DELETE /api/v1/admin/products/{id}   # Eliminar producto
```

---

## 🔒 Seguridad

### Implementado

✅ **Autenticación JWT**
✅ **Rate Limiting**
✅ **Input Validation**
✅ **SQL Injection Protection** (Prepared Statements)
✅ **CORS Restrictivo**
✅ **Security Headers** (CSP, X-Frame-Options, etc.)
✅ **HTTPS Forzado** (en producción)
✅ **Gestión de Secretos** (Variables de entorno)

### Checklist de Producción

- [ ] Rotar todas las credenciales
- [ ] Configurar Vault/Secrets Manager
- [ ] Activar logs de auditoría
- [ ] Configurar backups automáticos
- [ ] Implementar monitorización (Sentry, DataDog)
- [ ] Realizar pruebas de penetración
- [ ] Revisar compliance GDPR
- [ ] Configurar WAF (Web Application Firewall)

Ver [AUDITORIA_SEGURIDAD.md](./AUDITORIA_SEGURIDAD.md) para más detalles.

---

## 🧪 Testing

### Ejecutar Tests

```bash
./gradlew test
```

### Cobertura de Tests

- ✅ Cálculo por área (gran formato)
- ✅ Cálculo por pliego (pequeño formato)
- ✅ Cálculo unitario (merchandising)
- ✅ Descuentos por volumen
- ✅ Validaciones de entrada
- ✅ Edge cases
- ✅ Economía de escala

### Tests Incluidos

```kotlin
// Gran Formato
testBasicCanvas()              // Lona básica
testCanvasWithEyelets()        // Lona con ojales
testCanvasWithAllExtras()      // Todos los extras
testDimensionValidation()      // Validaciones

// Pequeño Formato
testBusinessCards100()         // 100 tarjetas
testBusinessCards1000()        // Economía de escala
testFlyerCabidas()            // Cálculo de cabidas

// Merchandising
testRollupBasicPrice()         // Precio base
testRollupVolumeDiscount()     // Descuentos por volumen

// Integración
testPriceScaling()            // Comparación de precios
```

---

## 🚢 Deployment

### Variables de Entorno Críticas

```bash
# Base de datos
DATABASE_URL=postgresql://user:pass@host:5432/db
DATABASE_USER=imprenta_user
DATABASE_PASSWORD=strong_password_here

# Seguridad
JWT_SECRET=long_random_secret_min_256_bits
JWT_ISSUER=imprenta-erp-api

# Aplicación
PORT=8080
ENVIRONMENT=production
```

### Docker Compose

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "8080:8080"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - db
  
  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=imprenta_erp
      - POSTGRES_USER=imprenta_user
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### Deploy a Producción

```bash
# Build
docker build -t imprenta-erp:latest .

# Tag
docker tag imprenta-erp:latest registry.example.com/imprenta-erp:latest

# Push
docker push registry.example.com/imprenta-erp:latest

# Deploy (Kubernetes, Docker Swarm, etc.)
kubectl apply -f k8s/deployment.yaml
```

---

## 📊 Ejemplo de Uso Completo

### Caso Real: Cotización para Cliente

**Cliente solicita:**
- 1 lona 3×2m con ojales
- 500 tarjetas de visita
- 5 roll-ups

**Request:**
```bash
curl -X POST http://localhost:8080/api/v1/quotes \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": 123,
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
        "quantity": 5
      }
    ],
    "validDays": 30
  }'
```

**Response:**
```json
{
  "quoteId": 1,
  "quoteNumber": "Q-2024-001",
  "customerId": 123,
  "lines": [
    {
      "product": "Lona con Ojales 3×2m",
      "quantity": 1,
      "unitPrice": "73.52",
      "lineTotal": "73.52"
    },
    {
      "product": "Tarjetas de Visita",
      "quantity": 500,
      "unitPrice": "0.02",
      "lineTotal": "10.00"
    },
    {
      "product": "Roll-up 85×200cm",
      "quantity": 5,
      "unitPrice": "46.55",
      "lineTotal": "232.75"
    }
  ],
  "subtotal": "316.27",
  "tax": "66.42",
  "total": "382.69",
  "validUntil": "2024-02-15T00:00:00Z"
}
```

---

## 🤝 Contribuir

1. Fork el proyecto
2. Crea tu rama de feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

---

## 📞 Soporte

- 📧 Email: soporte@imprenta-erp.com
- 🐛 Issues: [GitHub Issues](https://github.com/tu-usuario/imprenta-erp/issues)
- 📖 Documentación: [Wiki](https://github.com/tu-usuario/imprenta-erp/wiki)

---

## 🎯 Roadmap

### Versión 1.1
- [ ] Integración con pasarelas de pago (Stripe, PayPal)
- [ ] Generación de PDFs de presupuestos
- [ ] Panel de administración web
- [ ] API pública para integraciones

### Versión 1.2
- [ ] Sistema de inventario
- [ ] Gestión de proveedores
- [ ] Workflow de aprobaciones
- [ ] Reportes avanzados

### Versión 2.0
- [ ] App móvil nativa
- [ ] Sistema de tracking de pedidos
- [ ] Integración con ERP externo (SAP, Odoo)
- [ ] Marketplace de productos

---

## 🙏 Agradecimientos

- Equipo de desarrollo
- Comunidad de código abierto
- Clientes beta testers

---

**Hecho con ❤️ por el equipo de Imprenta ERP**
