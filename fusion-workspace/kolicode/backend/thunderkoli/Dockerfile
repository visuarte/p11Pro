# ════════════════════════════════════════════════════════════════════════════
# Dockerfile — Backend (Node.js / Express)
# ════════════════════════════════════════════════════════════════════════════

# Imagen base oficial de Node.js LTS sobre Alpine (imagen mínima)
FROM node:20-alpine

# Metadatos
LABEL maintainer="Illusion Reveal"
LABEL description="API RESTful de ilusiones ópticas"

# Directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiar solo los archivos de dependencias primero (aprovecha la caché de capas)
COPY package.json ./

# Instalar SOLO dependencias de producción (sin devDependencies)
RUN npm install --omit=dev

# Copiar el resto del código fuente
COPY server.js ./
COPY data.json ./

# Exponer el puerto de la API
EXPOSE 3000

# Comando de arranque
CMD ["node", "server.js"]
