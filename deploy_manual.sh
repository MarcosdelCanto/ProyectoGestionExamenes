#!/bin/bash

# --- Configuración (AJUSTA ESTAS VARIABLES) ---
EC2_USER="linuxuser"
EC2_HOST="64.176.16.195"
EC2_PROJECT_PATH="/home/${EC2_USER}/ProyectoGestionExamenes" # Ruta confirmada donde está tu repo en EC2
DOCKER_HUB_USERNAME="micobo" # <--- ¡AJUSTA con tu nombre de usuario de Docker Hub!

# --- Paso 1: Pedir la contraseña de EC2 ---
# (Se usa 'read -s' para que la contraseña no se muestre en pantalla)
read -s -p "Introduce la contraseña para ${EC2_USER}@${EC2_HOST}: " EC2_PASSWORD
echo # Para una nueva línea después de la contraseña oculta

# --- Paso 2: Preparar la wallet en el servidor EC2 ---
# Nota: Esto asume que tienes la carpeta 'wallet' en la raíz de tu proyecto local.
# Si 'sshpass' no está instalado en tu sistema local, el script te lo indicará.
# Puedes instalarlo en Ubuntu/Debian con: sudo apt-get install sshpass
echo "🔵 Paso 2: Copiando la carpeta wallet al servidor EC2..."
sshpass -p "$EC2_PASSWORD" scp -r ./wallet "${EC2_USER}"@"${EC2_HOST}":"${EC2_PROJECT_PATH}"/

if [ $? -ne 0 ]; then
    echo "❌ Error: Falló la copia de la wallet a EC2. Asegúrate de que 'sshpass' esté instalado y que la contraseña sea correcta."
    exit 1
fi
echo "✅ Wallet copiada exitosamente a EC2."

# --- Paso 3: Iniciar sesión en Docker Hub (local) ---
echo "🔵 Paso 3: Iniciando sesión en Docker Hub..."
docker login -u "${DOCKER_HUB_USERNAME}"

if [ $? -ne 0 ]; then
    echo "❌ Error: Falló el inicio de sesión en Docker Hub. Revisa tus credenciales de Docker Hub."
    exit 1
fi
echo "✅ Sesión iniciada en Docker Hub."

# --- Paso 4: Construir y Subir imágenes Docker (local) ---
echo "🔵 Paso 4: Construyendo y subiendo imagen del Backend..."
# Asegúrate de que la ruta './ProyectoGestionExamenes/backend' sea correcta desde donde ejecutas el script.
docker build -t "${DOCKER_HUB_USERNAME}"/proyectogestionexamenes-backend:latest ./ProyectoGestionExamenes/backend
if [ $? -ne 0 ]; then echo "❌ Error: Falló la construcción del Backend."; exit 1; fi
docker push "${DOCKER_HUB_USERNAME}"/proyectogestionexamenes-backend:latest
if [ $? -ne 0 ]; then echo "❌ Error: Falló el push del Backend."; exit 1; fi
echo "✅ Imagen de Backend subida."

echo "🔵 Construyendo y subiendo imagen del Frontend..."
# Asegúrate de que la ruta './ProyectoGestionExamenes/frontend' sea correcta desde donde ejecutas el script.
docker build -t "${D_H_USERNAME}"/proyectogestionexamenes-frontend:latest ./ProyectoGestionExamenes/frontend
if [ $? -ne 0 ]; then echo "❌ Error: Falló la construcción del Frontend."; exit 1; fi
docker push "${D_H_USERNAME}"/proyectogestionexamenes-frontend:latest
if [ $? -ne 0 ]; then echo "❌ Error: Falló el push del Frontend."; exit 1; fi
echo "✅ Imagen de Frontend subida."

# --- Paso 5: Desplegar en el servidor EC2 (vía SSH) ---
echo "🔵 Paso 5: Conectando a EC2 y desplegando la aplicación..."
sshpass -p "$EC2_PASSWORD" ssh "${EC2_USER}"@"${EC2_HOST}" << EOF
    echo "Navegando al directorio del proyecto: ${EC2_PROJECT_PATH}"
    # '|| { ...; exit 1; }' es para salir si el 'cd' falla (ej. ruta incorrecta)
    cd "${EC2_PROJECT_PATH}" || { echo "❌ Error: No se pudo navegar al directorio del proyecto en EC2. Revisa la variable EC2_PROJECT_PATH en el script."; exit 1; }

    echo "Descargando imágenes actualizadas desde Docker Hub..."
    docker compose pull

    echo "Reiniciando contenedores..."
    docker compose down
    docker compose up -d --force-recreate

    echo "Limpiando imágenes Docker antiguas..."
    docker image prune -f

    echo "✅ Despliegue completado en EC2."
EOF

if [ $? -ne 0 ]; then
    echo "❌ Error: Falló el despliegue en EC2. Revisa los mensajes anteriores y los logs de SSH."
    exit 1
fi

echo "🎉 ¡Script de despliegue manual completado exitosamente!"
