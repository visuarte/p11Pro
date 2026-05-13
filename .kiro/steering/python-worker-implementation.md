---
inclusion: fileMatch
fileMatchPattern: "**/python-worker/**"
---

# Python Workers - GPU Processing Implementation

## Overview

Python Workers handle GPU-intensive operations:
- **AI Engine**: DeepSeek/GPT integration
- **Pose Detection**: MediaPipe for facial/body landmarks
- **Color Processing**: Little CMS for professional color management
- **Vector Rendering**: Blend2D for high-quality vector graphics

## Project Structure

```
python-worker/
├── ai_engine.py           # AI model integration
├── pose_detector.py       # MediaPipe landmarks
├── color_processor.py     # Little CMS wrapper
├── vector_renderer.py     # Blend2D wrapper
├── ipc_server.py          # IPC with Node.js
├── utils/
│   ├── image_utils.py
│   ├── color_utils.py
│   └── vector_utils.py
├── tests/
│   ├── test_ai_engine.py
│   ├── test_pose_detector.py
│   ├── test_color_processor.py
│   └── test_vector_renderer.py
└── requirements.txt
```

## AI Engine Implementation

```python
# ai_engine.py
import asyncio
from typing import Dict, Any, Optional
from transformers import AutoTokenizer, AutoModelForCausalLM
import torch

class AIEngine:
    def __init__(self, model_name: str = "deepseek-ai/deepseek-coder-6.7b-instruct"):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModelForCausalLM.from_pretrained(
            model_name,
            torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
            device_map="auto"
        )
        
    async def generate_code(
        self,
        prompt: str,
        language: str,
        max_length: int = 512,
        temperature: float = 0.7
    ) -> Dict[str, Any]:
        """Generate code from natural language prompt"""
        
        formatted_prompt = f"""
        Generate {language} code for the following requirement:
        
        {prompt}
        
        Provide clean, production-ready code with comments.
        """
        
        inputs = self.tokenizer(formatted_prompt, return_tensors="pt").to(self.device)
        
        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_length=max_length,
                temperature=temperature,
                do_sample=True,
                top_p=0.95,
                num_return_sequences=1
            )
        
        generated_text = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        return {
            "code": self._extract_code(generated_text),
            "explanation": self._extract_explanation(generated_text),
            "language": language
        }
    
    def _extract_code(self, text: str) -> str:
        """Extract code block from generated text"""
        # Implementation to extract code between ```
        pass
    
    def _extract_explanation(self, text: str) -> str:
        """Extract explanation from generated text"""
        # Implementation to extract explanation
        pass
```

## Pose Detection with MediaPipe

```python
# pose_detector.py
import cv2
import mediapipe as mp
import numpy as np
from typing import List, Dict, Tuple, Optional

class PoseDetector:
    def __init__(self):
        self.mp_pose = mp.solutions.pose
        self.mp_face_mesh = mp.solutions.face_mesh
        self.pose = self.mp_pose.Pose(
            static_image_mode=False,
            model_complexity=2,
            enable_segmentation=True,
            min_detection_confidence=0.5
        )
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            static_image_mode=False,
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5
        )
    
    def detect_body_landmarks(self, image: np.ndarray) -> Optional[Dict[str, Any]]:
        """Detect body pose landmarks"""
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = self.pose.process(image_rgb)
        
        if not results.pose_landmarks:
            return None
        
        landmarks = []
        for landmark in results.pose_landmarks.landmark:
            landmarks.append({
                "x": landmark.x,
                "y": landmark.y,
                "z": landmark.z,
                "visibility": landmark.visibility
            })
        
        return {
            "landmarks": landmarks,
            "world_landmarks": self._extract_world_landmarks(results)
        }
    
    def detect_face_landmarks(self, image: np.ndarray) -> Optional[Dict[str, Any]]:
        """Detect facial landmarks"""
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = self.face_mesh.process(image_rgb)
        
        if not results.multi_face_landmarks:
            return None
        
        face_landmarks = results.multi_face_landmarks[0]
        landmarks = []
        
        for landmark in face_landmarks.landmark:
            landmarks.append({
                "x": landmark.x,
                "y": landmark.y,
                "z": landmark.z
            })
        
        return {
            "landmarks": landmarks,
            "total_points": len(landmarks)
        }
    
    def transform_pose(
        self,
        image: np.ndarray,
        source_landmarks: List[Dict],
        target_landmarks: List[Dict]
    ) -> np.ndarray:
        """Apply pose transformation to image"""
        # Calculate transformation matrix
        src_points = np.array([[lm["x"], lm["y"]] for lm in source_landmarks])
        dst_points = np.array([[lm["x"], lm["y"]] for lm in target_landmarks])
        
        # Apply thin plate spline transformation
        transformed = self._apply_tps_transform(image, src_points, dst_points)
        
        return transformed
    
    def _apply_tps_transform(
        self,
        image: np.ndarray,
        src_points: np.ndarray,
        dst_points: np.ndarray
    ) -> np.ndarray:
        """Apply Thin Plate Spline transformation"""
        # Implementation of TPS transformation
        pass
    
    def _extract_world_landmarks(self, results) -> List[Dict]:
        """Extract 3D world coordinates"""
        if not results.pose_world_landmarks:
            return []
        
        return [
            {
                "x": lm.x,
                "y": lm.y,
                "z": lm.z,
                "visibility": lm.visibility
            }
            for lm in results.pose_world_landmarks.landmark
        ]
```

## Color Processing with Little CMS

```python
# color_processor.py
from PIL import Image, ImageCms
import numpy as np
from typing import Tuple, Optional

class ColorProcessor:
    def __init__(self):
        # Load ICC profiles
        self.srgb_profile = ImageCms.createProfile("sRGB")
        self.cmyk_profile = ImageCms.getOpenProfile("ISOcoated_v2_300_eci.icc")
        self.lab_profile = ImageCms.createProfile("LAB")
    
    def rgb_to_cmyk(
        self,
        image: Image.Image,
        profile_path: Optional[str] = None
    ) -> Image.Image:
        """Convert RGB image to CMYK color space"""
        if profile_path:
            cmyk_profile = ImageCms.getOpenProfile(profile_path)
        else:
            cmyk_profile = self.cmyk_profile
        
        # Create transformation
        transform = ImageCms.buildTransform(
            self.srgb_profile,
            cmyk_profile,
            "RGB",
            "CMYK",
            renderingIntent=ImageCms.Intent.PERCEPTUAL
        )
        
        # Apply transformation
        cmyk_image = ImageCms.applyTransform(image, transform)
        
        return cmyk_image
    
    def rgb_to_lab(self, image: Image.Image) -> np.ndarray:
        """Convert RGB to LAB color space"""
        transform = ImageCms.buildTransform(
            self.srgb_profile,
            self.lab_profile,
            "RGB",
            "LAB"
        )
        
        lab_image = ImageCms.applyTransform(image, transform)
        return np.array(lab_image)
    
    def adjust_color_temperature(
        self,
        image: Image.Image,
        temperature: float
    ) -> Image.Image:
        """Adjust color temperature (-100 to 100)"""
        # Convert to LAB
        lab = self.rgb_to_lab(image)
        
        # Adjust a and b channels
        lab[:, :, 1] += temperature * 0.5  # a channel
        lab[:, :, 2] += temperature * 0.3  # b channel
        
        # Convert back to RGB
        lab_image = Image.fromarray(lab.astype('uint8'), mode='LAB')
        transform = ImageCms.buildTransform(
            self.lab_profile,
            self.srgb_profile,
            "LAB",
            "RGB"
        )
        
        return ImageCms.applyTransform(lab_image, transform)
    
    def match_color_profile(
        self,
        image: Image.Image,
        target_profile_path: str
    ) -> Image.Image:
        """Match image to target color profile"""
        target_profile = ImageCms.getOpenProfile(target_profile_path)
        
        transform = ImageCms.buildTransform(
            self.srgb_profile,
            target_profile,
            "RGB",
            "RGB",
            renderingIntent=ImageCms.Intent.RELATIVE_COLORIMETRIC
        )
        
        return ImageCms.applyTransform(image, transform)
```

## Vector Rendering with Blend2D

```python
# vector_renderer.py
import blend2d as b2d
import numpy as np
from typing import List, Tuple, Dict, Any

class VectorRenderer:
    def __init__(self, width: int = 1920, height: int = 1080):
        self.width = width
        self.height = height
        self.image = b2d.BLImage(width, height, b2d.BL_FORMAT_PRGB32)
        self.context = b2d.BLContext(self.image)
    
    def render_path(
        self,
        points: List[Tuple[float, float]],
        stroke_color: Tuple[int, int, int, int] = (0, 0, 0, 255),
        fill_color: Optional[Tuple[int, int, int, int]] = None,
        stroke_width: float = 2.0
    ) -> np.ndarray:
        """Render vector path"""
        path = b2d.BLPath()
        
        # Move to first point
        path.moveTo(points[0][0], points[0][1])
        
        # Add lines to subsequent points
        for x, y in points[1:]:
            path.lineTo(x, y)
        
        # Close path if fill color is specified
        if fill_color:
            path.close()
            self.context.setFillStyle(b2d.BLRgba32(*fill_color))
            self.context.fillPath(path)
        
        # Stroke path
        self.context.setStrokeStyle(b2d.BLRgba32(*stroke_color))
        self.context.setStrokeWidth(stroke_width)
        self.context.strokePath(path)
        
        return self._image_to_numpy()
    
    def render_bezier_curve(
        self,
        start: Tuple[float, float],
        control1: Tuple[float, float],
        control2: Tuple[float, float],
        end: Tuple[float, float],
        stroke_color: Tuple[int, int, int, int] = (0, 0, 0, 255),
        stroke_width: float = 2.0
    ) -> np.ndarray:
        """Render cubic Bezier curve"""
        path = b2d.BLPath()
        path.moveTo(start[0], start[1])
        path.cubicTo(
            control1[0], control1[1],
            control2[0], control2[1],
            end[0], end[1]
        )
        
        self.context.setStrokeStyle(b2d.BLRgba32(*stroke_color))
        self.context.setStrokeWidth(stroke_width)
        self.context.strokePath(path)
        
        return self._image_to_numpy()
    
    def render_text(
        self,
        text: str,
        position: Tuple[float, float],
        font_size: float = 24.0,
        color: Tuple[int, int, int, int] = (0, 0, 0, 255)
    ) -> np.ndarray:
        """Render text"""
        font = b2d.BLFont()
        font.createFromFile("path/to/font.ttf", font_size)
        
        self.context.setFillStyle(b2d.BLRgba32(*color))
        self.context.fillText(b2d.BLPoint(position[0], position[1]), font, text)
        
        return self._image_to_numpy()
    
    def clear(self):
        """Clear the canvas"""
        self.context.clearAll()
    
    def _image_to_numpy(self) -> np.ndarray:
        """Convert Blend2D image to numpy array"""
        data = self.image.getData()
        return np.frombuffer(data, dtype=np.uint8).reshape(
            (self.height, self.width, 4)
        )
```

## IPC Server for Node.js Communication

```python
# ipc_server.py
import asyncio
import json
from typing import Dict, Any, Callable
import websockets

class IPCServer:
    def __init__(self, host: str = "localhost", port: int = 8765):
        self.host = host
        self.port = port
        self.handlers: Dict[str, Callable] = {}
        
        # Initialize workers
        self.ai_engine = AIEngine()
        self.pose_detector = PoseDetector()
        self.color_processor = ColorProcessor()
        self.vector_renderer = VectorRenderer()
        
        # Register handlers
        self._register_handlers()
    
    def _register_handlers(self):
        """Register message handlers"""
        self.handlers["generate_code"] = self._handle_generate_code
        self.handlers["detect_pose"] = self._handle_detect_pose
        self.handlers["process_color"] = self._handle_process_color
        self.handlers["render_vector"] = self._handle_render_vector
    
    async def _handle_generate_code(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle code generation request"""
        result = await self.ai_engine.generate_code(
            prompt=data["prompt"],
            language=data["language"]
        )
        return {"status": "success", "data": result}
    
    async def _handle_detect_pose(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle pose detection request"""
        # Decode base64 image
        image = self._decode_image(data["image"])
        
        if data["type"] == "body":
            result = self.pose_detector.detect_body_landmarks(image)
        else:
            result = self.pose_detector.detect_face_landmarks(image)
        
        return {"status": "success", "data": result}
    
    async def _handle_process_color(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle color processing request"""
        image = self._decode_image(data["image"])
        
        if data["operation"] == "rgb_to_cmyk":
            result = self.color_processor.rgb_to_cmyk(image)
        elif data["operation"] == "adjust_temperature":
            result = self.color_processor.adjust_color_temperature(
                image,
                data["temperature"]
            )
        
        return {"status": "success", "data": self._encode_image(result)}
    
    async def _handle_render_vector(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle vector rendering request"""
        if data["type"] == "path":
            result = self.vector_renderer.render_path(
                points=data["points"],
                stroke_color=data.get("stroke_color"),
                fill_color=data.get("fill_color")
            )
        elif data["type"] == "bezier":
            result = self.vector_renderer.render_bezier_curve(
                start=data["start"],
                control1=data["control1"],
                control2=data["control2"],
                end=data["end"]
            )
        
        return {"status": "success", "data": self._encode_image(result)}
    
    async def handle_message(self, websocket, path):
        """Handle incoming WebSocket messages"""
        async for message in websocket:
            try:
                data = json.loads(message)
                action = data.get("action")
                
                if action in self.handlers:
                    result = await self.handlers[action](data)
                else:
                    result = {"status": "error", "message": f"Unknown action: {action}"}
                
                await websocket.send(json.dumps(result))
            except Exception as e:
                error_response = {"status": "error", "message": str(e)}
                await websocket.send(json.dumps(error_response))
    
    async def start(self):
        """Start the IPC server"""
        async with websockets.serve(self.handle_message, self.host, self.port):
            print(f"Python Worker IPC Server running on ws://{self.host}:{self.port}")
            await asyncio.Future()  # Run forever
    
    def _decode_image(self, base64_str: str):
        """Decode base64 image"""
        # Implementation
        pass
    
    def _encode_image(self, image):
        """Encode image to base64"""
        # Implementation
        pass

if __name__ == "__main__":
    server = IPCServer()
    asyncio.run(server.start())
```

## Requirements

```txt
# requirements.txt
torch>=2.0.0
transformers>=4.30.0
mediapipe>=0.9.0
opencv-python>=4.7.0
Pillow>=10.0.0
numpy>=1.24.0
websockets>=11.0.0
blend2d>=0.10.0
```

## Testing

```python
# tests/test_pose_detector.py
import pytest
import numpy as np
from pose_detector import PoseDetector

def test_detect_body_landmarks():
    detector = PoseDetector()
    
    # Create test image
    image = np.zeros((480, 640, 3), dtype=np.uint8)
    
    result = detector.detect_body_landmarks(image)
    
    assert result is not None or result is None  # May not detect in blank image
    
def test_detect_face_landmarks():
    detector = PoseDetector()
    
    # Load test image with face
    image = cv2.imread("test_face.jpg")
    
    result = detector.detect_face_landmarks(image)
    
    if result:
        assert "landmarks" in result
        assert len(result["landmarks"]) > 0
```

## References

- Python Workers: `python-worker/`
- MediaPipe: https://google.github.io/mediapipe/
- Little CMS: https://www.littlecms.com/
- Blend2D: https://blend2d.com/
