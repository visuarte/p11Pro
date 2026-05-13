"""
config.py – Gestor Centralizado de Variables de Entorno para KoliCode (2026)

Este módulo implementa el patrón Single Source of Truth para la configuración de entorno en Python.
Valida en el arranque que todas las variables obligatorias existen y expone una API segura para el resto de módulos.
"""
import os
from typing import Any

REQUIRED_VARS = [
    "KOLICODE_API_KEY",
    "KOLICODE_GATEWAY_URL",
    "KOLICODE_WORKER_TIMEOUT",
    # Añade aquí todas las variables obligatorias del sistema
]

class ConfigError(Exception):
    pass

class Config:
    _instance = None
    _vars = {}

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._vars = cls._load_and_validate()
        return cls._instance

    @classmethod
    def _load_and_validate(cls) -> dict:
        missing = [var for var in REQUIRED_VARS if var not in os.environ]
        if missing:
            raise ConfigError(f"Faltan variables de entorno obligatorias: {', '.join(missing)}")
        return {var: os.environ[var] for var in REQUIRED_VARS}

    def get(self, key: str) -> Any:
        if key not in self._vars:
            raise ConfigError(f"Variable de entorno no registrada: {key}")
        return self._vars[key]

# Uso recomendado en cualquier módulo Python:
# from config import Config
# cfg = Config()
# api_key = cfg.get("KOLICODE_API_KEY")

