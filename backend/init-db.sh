#!/bin/bash
# =============================================================
# Script de inicialización de la base de datos Oracle XE
# Se ejecuta UNA SOLA VEZ cuando el volumen oracle-data es nuevo
# =============================================================

echo "================================================================"
echo "Iniciando configuración del esquema en XEPDB1..."
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
