# Usa una imagen base de Node.js ligera. Alpine es buena para imágenes pequeñas.
FROM node:20-alpine

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia los archivos package.json y package-lock.json para aprovechar el cache de Docker
COPY package*.json ./

# Instala las dependencias de Node.js
RUN npm install --production

# Copia la carpeta wallet (necesaria para Oracle Autonomous Database)
# Me has confirmado que la carpeta wallet está en backend/wallet/
# y que la conexión es a Autonomous Database por wallet.
# La ruta de origen es relativa al contexto de construcción (el directorio 'backend').
# La ruta de destino '/app/wallet/' es dentro del contenedor.
COPY wallet/ /app/wallet/

# Establece TNS_ADMIN dentro del contenedor, apuntando a la ubicación de la wallet copiada.
# Esta variable es utilizada por el cliente de Oracle (oracledb) para encontrar los archivos de la wallet.
ENV TNS_ADMIN=/app/wallet

# Copia el resto del código de la aplicación
COPY . .

# Expone el puerto en el que la aplicación Express estará escuchando
# Este puerto es el puerto interno del contenedor.
EXPOSE 3000

# Comando para iniciar la aplicación Node.js
CMD ["npm", "start"]
