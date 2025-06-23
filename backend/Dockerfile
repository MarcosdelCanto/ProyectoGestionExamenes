# backend/Dockerfile

# Usamos una imagen Node.js estándar (basada en Debian)
FROM node:20

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia TODO el código y los archivos de configuración del backend primero
# Esto incluye package.json, index.js, db.js, etc.
COPY . .

# Ahora que todos los archivos están, instala las dependencias de Node.js
# --production se asegura de no instalar dependencias de desarrollo como 'vitest'
RUN npm install --production

# Expone el puerto en el que la aplicación Express estará escuchando
EXPOSE 3000

# Comando para iniciar la aplicación Node.js
CMD ["node", "index.js"]
