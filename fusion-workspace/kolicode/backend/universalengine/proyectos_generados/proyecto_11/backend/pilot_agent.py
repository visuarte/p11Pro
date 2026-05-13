# Agente Pilot básico para integración

class PilotAgent:
    def __init__(self):
        self.status = "ready"

    def validate_config(self, config):
        # Validación avanzada: claves obligatorias y tipos
        required_keys = ["canvas_width", "canvas_height", "background"]
        for key in required_keys:
            if key not in config:
                logger.warning(f"Validación fallida: falta clave {key} en config={config}")
                return False, f"Falta la clave obligatoria: {key}"
        # Validar tipos y límites
        if not isinstance(config["canvas_width"], int) or config["canvas_width"] <= 0:
            logger.warning(f"Validación fallida: canvas_width inválido en config={config}")
            return False, "canvas_width debe ser un entero positivo"
        if not isinstance(config["canvas_height"], int) or config["canvas_height"] <= 0:
            logger.warning(f"Validación fallida: canvas_height inválido en config={config}")
            return False, "canvas_height debe ser un entero positivo"
        if not (isinstance(config["background"], list) and len(config["background"]) == 3):
            logger.warning(f"Validación fallida: background inválido en config={config}")
            return False, "background debe ser una lista RGB de 3 valores"
        if not all(isinstance(v, int) and 0 <= v <= 255 for v in config["background"]):
            logger.warning(f"Validación fallida: valores de background fuera de rango en config={config}")
            return False, "Los valores de background deben ser enteros entre 0 y 255"
        logger.info(f"Validación exitosa de configuración: {config}")
        return True, "Configuración válida"

pilot_agent = PilotAgent()
