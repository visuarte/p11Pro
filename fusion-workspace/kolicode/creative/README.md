# Creative - Design Studio (GPU Workers)

**Capa:** Capa 3 (Processing Layer)  
**Tecnología:** Python + GPU Libraries  
**Puerto:** 8081 (gRPC)

---

## Propósito

**Design Studio** es el servicio de procesamiento gráfico que maneja:

- Renderizado de vectores con Blend2D
- Gestión de color con Little CMS
- Procesamiento de imágenes
- Detección de pose con MediaPipe
- Workers GPU paralelos

---

## Estructura

```
creative/
├── gpu_workers/          # GPU worker pool
│   ├── pool.py          # Worker pool management
│   ├── tasks.py         # Task definitions
│   └── queue.py         # Task queue
│
├── color_mgmt/           # Color management
│   ├── converter.py     # Color space conversion
│   ├── icc.py           # ICC profile handling
│   ├── spot.py          # Spot colors
│   └── halftone.py      # Halftone angles
│
├── vector/               # Vector rendering
│   ├── blend2d.py       # Blend2D integration
│   └── renderer.py      # Vector renderer
│
├── pose/                 # Pose detection
│   └── mediapipe.py     # MediaPipe integration
│
├── server.py             # gRPC server
├── requirements.txt      # Python dependencies
└── README.md            # Esta guía
```

---

## Responsabilidades

### 1. Vector Rendering
- Renderizar paths SVG
- Blend2D para anti-aliasing
- Export a múltiples formatos

### 2. Color Management
- Conversión RGB ↔ CMYK ↔ LAB
- ICC profile application
- Spot color preservation
- Halftone angle calculation

### 3. GPU Processing
- Parallel task execution
- Worker pool management
- Load balancing
- Error recovery

### 4. Pose Detection
- MediaPipe integration
- Body pose estimation
- Hand tracking
- Face landmarks

---

## Color Spaces Soportados

### Input
- **RGB** (sRGB, Adobe RGB, ProPhoto RGB)
- **CMYK** (ISO Coated v2, US Web Coated SWOP)
- **LAB** (CIE L*a*b*)
- **HSV/HSL**

### Output
- **RGB** (sRGB, Display P3, Rec. 2020)
- **CMYK** (FOGRA39, SWOP, Japan Color)
- **Grayscale** (Dot Gain 15%, 20%)

### Color Accuracy
- **ΔE < 3** (Just Noticeable Difference)
- **ΔE < 1** para color crítico
- ICC Profile v4 support

---

## Stack Tecnológico

### Core
```python
Python 3.10+
FastAPI          # gRPC server
asyncio          # Async I/O
```

### Graphics
```python
blend2d          # Vector rendering
pillow           # Image processing
opencv-python    # Computer vision
numpy            # Numerical processing
```

### Color Management
```python
littlecms        # Color management
colour-science   # Color conversions
```

### GPU/ML
```python
mediapipe        # Pose detection
torch            # PyTorch (optional)
tensorflow       # TensorFlow (optional)
```

---

## gRPC Service Definition

```protobuf
syntax = "proto3";

package design_studio;

service DesignStudio {
  // Render vector graphics
  rpc RenderVector(VectorRequest) returns (VectorResponse);
  
  // Convert color spaces
  rpc ConvertColor(ColorRequest) returns (ColorResponse);
  
  // Process image
  rpc ProcessImage(ImageRequest) returns (ImageResponse);
  
  // Detect pose
  rpc DetectPose(PoseRequest) returns (PoseResponse);
}

message VectorRequest {
  bytes svg_data = 1;
  int32 width = 2;
  int32 height = 3;
  string format = 4;  // png, jpg, webp
}

message ColorRequest {
  repeated float input_color = 1;  // [R, G, B] or [C, M, Y, K]
  string from_space = 2;           // 'srgb', 'cmyk', 'lab'
  string to_space = 3;
  string icc_profile = 4;
}
```

---

## GPU Worker Pool

### Configuration

```python
# config.py
WORKER_COUNT = 4           # Number of GPU workers
MAX_QUEUE_SIZE = 100      # Max tasks in queue
TASK_TIMEOUT = 30         # Seconds
RETRY_COUNT = 3           # Retries on failure
```

### Usage

```python
from gpu_workers import WorkerPool

pool = WorkerPool(worker_count=4)

# Submit task
result = await pool.submit_task({
    'type': 'render',
    'data': svg_data,
    'options': render_options
})

# Wait for completion
status = await pool.wait_for(result.task_id)
```

---

## Color Conversion Examples

### RGB to CMYK

```python
from color_mgmt import ColorConverter

converter = ColorConverter()

# sRGB to CMYK (FOGRA39)
cmyk = converter.convert(
    color=[255, 128, 0],    # RGB
    from_space='srgb',
    to_space='cmyk',
    profile='FOGRA39'
)
# Result: [0, 50, 100, 0] (CMYK percentages)
```

### LAB to RGB

```python
rgb = converter.convert(
    color=[50, 25, -25],   # L*a*b*
    from_space='lab',
    to_space='srgb'
)
# Result: [102, 128, 178] (RGB 0-255)
```

---

## Performance Targets

| Operation | Target | Notes |
|-----------|--------|-------|
| Color conversion | <50ms | Single color |
| Vector render (1080p) | <500ms | Complex SVG |
| Pose detection | <100ms | Single frame |
| Batch processing | <2s | 10 images |

---

## Environment Variables

```bash
# GPU Configuration
GPU_DEVICES=0,1,2,3        # GPU device IDs
WORKER_COUNT=4             # Number of workers

# Color Management
ICC_PROFILES_PATH=/iccprofiles
DEFAULT_RGB_PROFILE=sRGB
DEFAULT_CMYK_PROFILE=FOGRA39

# Performance
MAX_IMAGE_SIZE=8192        # Max dimension
CACHE_SIZE=100             # Cache entries
```

---

## Development

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt

# Start server
python server.py

# Run tests
pytest tests/
```

---

## Testing

```python
# tests/test_color.py
def test_rgb_to_cmyk():
    converter = ColorConverter()
    cmyk = converter.convert(
        color=[255, 0, 0],  # Pure red
        from_space='srgb',
        to_space='cmyk'
    )
    assert cmyk == [0, 100, 100, 0]  # C=0, M=100, Y=100, K=0
```

---

## Referencias

- [Blend2D Documentation](https://blend2d.com/)
- [Little CMS](https://www.littlecms.com/)
- [MediaPipe](https://google.github.io/mediapipe/)
- [Color Science for Python](https://www.colour-science.org/)
- Task 27 en tasks.md

---

**Estado:** 🔧 Base service scaffold implementado; pipelines avanzados pendientes  
**Prioridad:** ALTA  
**Última actualización:** 2026-05-15
