#!/bin/bash
# =============================================================
# Script de inicialización de la base de datos Oracle XE
# Se ejecuta UNA SOLA VEZ cuando el volumen oracle-data es nuevo
# =============================================================

echo "================================================================"
echo "Paso 1: Creando usuario ADMIN en XEPDB1..."
echo "================================================================"

sqlplus -s system/"${ORACLE_PWD}"@//localhost:1521/XEPDB1 << EOF
CREATE USER ADMIN IDENTIFIED BY "${ORACLE_PWD}";
GRANT CONNECT, RESOURCE, DBA TO ADMIN;
ALTER USER ADMIN QUOTA UNLIMITED ON USERS;
EXIT;
EOF

echo "================================================================"
echo "Paso 2: Creando esquema y datos iniciales como ADMIN..."
echo "================================================================"

sqlplus -s admin/"${ORACLE_PWD}"@//localhost:1521/XEPDB1 @/tmp/setup_database.sql

if [ $? -eq 0 ]; then
    echo "================================================================"
    echo "✅ Base de datos inicializada correctamente."
    echo "================================================================"
else
    echo "================================================================"
    echo "❌ Error al inicializar la base de datos."
    echo "================================================================"
    exit 1
fi
