
import logging
logger = logging.getLogger("codedesign")
from fastapi import APIRouter
from typing import List

router = APIRouter()


@router.get("/generative/curve", response_model=List[List[float]])
def get_curve():
    import numpy as np
    x = np.linspace(0, 1, 100)
    y = 1 / (1 + np.exp(-10 * (x - 0.5)))
    points = [[float(xi), float(yi)] for xi, yi in zip(x, y)]
    logger.info("Curva sigmoidea generada correctamente")
    return points

# Nuevo endpoint: curva basada en ruido Perlin
@router.get("/generative/noise_curve", response_model=List[List[float]])
def get_noise_curve(offset: float = 0.0, scale: float = 1.0):
    """
    Devuelve una curva 1D generada con ruido Perlin, útil para animación generativa.
    offset: desplaza el ruido (para animar, variar en el tiempo)
    scale: escala la amplitud del ruido
    """
    import numpy as np
    try:
        import sys
        import os
        venv_path = os.path.join(os.path.dirname(__file__), '../venv/bin/activate_this.py')
        if os.path.exists(venv_path):
            with open(venv_path) as f:
                exec(f.read(), {'__file__': venv_path})
        from noise import pnoise1
    except ImportError:
        # Si noise no está instalado, usar ruido aleatorio simple
        def pnoise1(x):
            return np.sin(x)
        logger.warning("No se pudo importar 'noise', usando función seno como fallback")
    x = np.linspace(0, 1, 100)
    y = [0.5 + 0.4 * scale * pnoise1(10 * xi + offset) for xi in x]
    points = [[float(xi), float(yi)] for xi, yi in zip(x, y)]
    logger.info(f"Curva generada con ruido Perlin (offset={offset}, scale={scale})")
    return points
