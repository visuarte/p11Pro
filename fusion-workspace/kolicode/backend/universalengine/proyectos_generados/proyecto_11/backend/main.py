

import os
import logging
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Any, Dict, Optional
from backend.generative import router as generative_router
from backend.pilot_agent import pilot_agent
from fastapi.middleware.cors import CORSMiddleware

# Configuración de logging
LOG_DIR = os.path.join(os.path.dirname(__file__), "logs")
os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE = os.path.join(LOG_DIR, "codedesign.log")
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE, encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("codedesign")

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(generative_router)

class SyncConfig(BaseModel):
    user_id: str
    project_id: str
    config: Dict[str, Any]

sync_db = {}

@app.post("/sync/config")
def sync_config(data: SyncConfig):
    key = f"{data.user_id}:{data.project_id}"
    sync_db[key] = data.config
    logger.info(f"Sync config: user={data.user_id}, project={data.project_id}, config={data.config}")
    return {"msg": "Configuración sincronizada", "key": key, "config": data.config}
class Project(BaseModel):
    project_id: str
    name: str
    owner_id: str
    description: Optional[str] = None

projects_db = {}

@app.post("/projects/create")
def create_project(project: Project):
    if project.project_id in projects_db:
        logger.warning(f"Intento de crear proyecto duplicado: {project.project_id}")
        return {"error": "El proyecto ya existe"}
    projects_db[project.project_id] = project.dict()
    logger.info(f"Proyecto creado: {project.project_id}, owner={project.owner_id}")
    return {"msg": "Proyecto creado", "project": project.dict()}
class User(BaseModel):
    user_id: str
    name: str
    email: Optional[str] = None

users_db = {}

@app.post("/users/create")
def create_user(user: User):
    if user.user_id in users_db:
        logger.warning(f"Intento de crear usuario duplicado: {user.user_id}")
        return {"error": "El usuario ya existe"}
    users_db[user.user_id] = user.dict()
    logger.info(f"Usuario creado: {user.user_id}, name={user.name}")
    return {"msg": "Usuario creado", "user": user.dict()}

class CanvasConfig(BaseModel):
    user_id: str
    config: Dict[str, Any]


@app.get("/")
def root():
    logger.info("API REST de Codedesign activa")
    return {"status": "API REST de Codedesign activa"}


@app.post("/canvas/config")
def update_canvas_config(data: CanvasConfig):
    valid, msg = pilot_agent.validate_config(data.config)
    logger.info(f"Canvas config: user={data.user_id}, valid={valid}, msg={msg}")
    return {"msg": msg, "valid": valid, "data": data.dict()}

# Endpoint para consultar los últimos logs
@app.get("/logs/recent")
def get_recent_logs(lines: int = 30):
    try:
        with open(LOG_FILE, "r", encoding="utf-8") as f:
            log_lines = f.readlines()[-lines:]
        return {"logs": [line.strip() for line in log_lines]}
    except Exception as e:
        logger.error(f"Error al leer logs: {e}")
        raise HTTPException(status_code=500, detail="No se pudieron leer los logs")
