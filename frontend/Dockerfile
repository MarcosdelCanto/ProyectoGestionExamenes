# Usa una imagen base de Node.js para construir la aplicación React
FROM node:20-alpine AS builder

# Establece el directorio de trabajo para la fase de construcción
WORKDIR /app

# Copia los archivos package.json y package-lock.json
COPY package*.json ./

# Instala las dependencias
RUN npm install

# Copia el resto del código de la aplicación
COPY . .

# Construye la aplicación React para producción
RUN npm run build

# --- Fase de Producción ---
# Usa una imagen de Nginx ligera para servir los archivos estáticos
FROM nginx:alpine

# Copia los archivos de la aplicación construida desde la fase 'builder'
COPY --from=builder /app/dist /usr/share/nginx/html

# Elimina la configuración por defecto de Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copia tu configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expone el puerto 80, que es el puerto por defecto de Nginx para HTTP
EXPOSE 80

# Comando para iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
