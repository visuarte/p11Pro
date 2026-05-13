# Integration Contracts - KoliCode

## Introducción

Este documento especifica los contratos de integración entre módulos de KoliCode, incluyendo schemas JSON, latencias máximas, manejo de timeouts y matrices de compatibilidad.

---

## Contratos de Datos entre Módulos

### 1. Frontend → Bridge (API Gateway)

#### Request Schema
```json
{
  "endpoint": "/api/v1/thunderkoli/agent/interact",
  "method": "POST",
  "headers": {
    "Authorization": "Bearer <token>",
    "Content-Type": "application/json"
  },
  "body": {
    "prompt": "string (max 5000 chars)",
    "userId": "string (uuid)"
  }
}
```

#### Latencias
- **Target:** < 200ms (p95)
- **Timeout:** 30s
- **Retry:** 3 intentos con backoff exponencial

---

### 2. Bridge → ThunderKoli (Engine)

#### Latencias
- **Target:** < 10s (p95)
- **Timeout:** 30s

---

### 3. P10pro → Design Studio

#### Export Request Schema (FR-EXPORT-001)
```json
{
  "endpoint": "/api/v1/design-studio/export",
  "method": "POST",
  "headers": {
    "Authorization": "Bearer <token>",
    "Content-Type": "application/json"
  },
  "body": {
    "assetId": "string (uuid)",
    "format": "PNG | SVG | PDF",
    "resolution": {
      "dpi": 300,
      "width": "number (pixels)",
      "height": "number (pixels)"
    },
    "colorProfile": {
      "type": "ICC",
      "profile": "sRGB | AdobeRGB | CMYK",
      "intent": "perceptual | relative | saturation | absolute"
    },
    "compression": {
      "enabled": true,
      "quality": 95,
      "maxSize": 5242880
    }
  }
}
```

#### Response Schema
```json
{
  "success": true,
  "assetId": "string (uuid)",
  "downloadUrl": "string (signed URL)",
  "metadata": {
    "format": "PNG",
    "dpi": 300,
    "fileSize": 4567890,
    "colorProfile": "sRGB IEC61966-2.1",
    "signature": "string (ThunderKoli digital signature)",
    "timestamp": "ISO 8601"
  }
}
```

#### Pipeline Flow (Multi-Layer Architecture)
1. **P10pro** generates export specs (format, resolution, ICC profile)
2. **Bridge** validates request and routes to Design_Studio
3. **Design_Studio** renders with Blend2D at specified DPI + applies ICC profile
4. **ThunderKoli** adds digital signature for authenticity
5. **Response** delivers signed asset <5MB with metadata

#### Latencias
- **Target:** < 2s (p95)
- **Timeout:** 10s
- **Retry:** 2 intentos (export operations are expensive)

---

## Matriz de Compatibilidad

### Espacios de Color

| Módulo | RGB | CMYK | LAB |
|--------|-----|------|-----|
| **P10pro** | ✅ | ⚠️ | ❌ |
| **Design Studio** | ✅ | ✅ | ✅ |

**Leyenda:** ✅ Completo, ⚠️ Parcial, ❌ No soportado

---

### Formatos de Importación

| Formato | P10pro | Notas |
|---------|--------|-------|
| **Figma JSON** | ✅ 95% | Auto-layout parcial |
| **Sketch JSON** | ⚠️ 70% | Algunos efectos no soportados |
| **SVG** | ✅ | Completo |

**Elementos Figma NO Soportados:**
- Plugins de terceros
- Animaciones complejas
- Variables de Figma

---

## Contratos de Performance

### Latencias Máximas (p95)

| Operación | Target | Timeout |
|-----------|--------|---------|
| **Login** | 500ms | 10s |
| **Canvas Render** | 100ms | 5s |
| **AI Generation** | 10s | 30s |
| **Export PNG** | 2s | 60s |
| **Vault Encrypt** | 50ms | 5s |

---

**Última actualización:** 2026-04-21  
**Versión:** 1.0.0
