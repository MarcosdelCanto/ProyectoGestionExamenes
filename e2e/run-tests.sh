#!/bin/bash

# Script para ejecutar pruebas E2E en diferentes modos

set -e

echo "🧪 Ejecutor de Pruebas E2E - Sistema de Gestión de Exámenes"
echo "============================================================"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para mostrar ayuda
show_help() {
    echo "Uso: $0 [OPCIÓN]"
    echo ""
    echo "Opciones:"
    echo "  smoke       Ejecutar solo pruebas básicas (smoke tests)"
    echo "  auth        Ejecutar solo pruebas de autenticación"
    echo "  examenes    Ejecutar solo pruebas de gestión de exámenes"
    echo "  ui          Ejecutar solo pruebas de navegación y UI"
    echo "  all         Ejecutar todas las pruebas (por defecto)"
    echo "  headed      Ejecutar pruebas con navegador visible"
    echo "  debug       Ejecutar en modo debug"
    echo "  report      Mostrar último reporte"
    echo "  codegen     Generar código de pruebas automáticamente"
    echo "  install     Instalar navegadores de Playwright"
    echo "  help        Mostrar esta ayuda"
    echo ""
    echo "Ejemplos:"
    echo "  $0 smoke           # Solo pruebas básicas"
    echo "  $0 auth headed     # Pruebas de login con navegador visible"
    echo "  $0 all debug       # Todas las pruebas en modo debug"
}

# Función para verificar prerrequisitos
check_prerequisites() {
    echo -e "${BLUE}🔍 Verificando prerrequisitos...${NC}"

    # Verificar Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js no está instalado${NC}"
        exit 1
    fi

    # Verificar dependencias
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}📦 Instalando dependencias...${NC}"
        npm install
    fi

    # Verificar que la aplicación esté corriendo
    if ! curl -s http://localhost:5174 > /dev/null; then
        if ! curl -s http://localhost:8080 > /dev/null; then
            echo -e "${YELLOW}⚠️  La aplicación no está corriendo.${NC}"
            echo -e "${YELLOW}   Asegúrate de iniciar el frontend y backend antes de ejecutar las pruebas.${NC}"
            echo ""
            echo -e "${BLUE}   Frontend: cd ../frontend && npm run dev${NC}"
            echo -e "${BLUE}   Backend:  cd ../backend && npm start${NC}"
            echo ""
            read -p "¿Deseas continuar de todas formas? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                exit 1
            fi
        fi
    fi

    echo -e "${GREEN}✅ Prerrequisitos verificados${NC}"
}

# Función para ejecutar pruebas
run_tests() {
    local test_type="$1"
    local mode="$2"

    echo -e "${BLUE}🧪 Ejecutando pruebas: $test_type${NC}"

    local cmd="npx playwright test"

    # Configurar tipo de prueba
    case $test_type in
        "smoke")
            cmd="$cmd tests/smoke.spec.js"
            ;;
        "auth")
            cmd="$cmd tests/auth.spec.js"
            ;;
        "examenes")
            cmd="$cmd tests/examenes.spec.js"
            ;;
        "ui")
            cmd="$cmd tests/navegacion.spec.js"
            ;;
        "all")
            # Ejecutar todas las pruebas
            ;;
        *)
            echo -e "${RED}❌ Tipo de prueba desconocido: $test_type${NC}"
            exit 1
            ;;
    esac

    # Configurar modo
    case $mode in
        "headed")
            cmd="$cmd --headed"
            ;;
        "debug")
            cmd="$cmd --debug"
            ;;
    esac

    # Ejecutar solo en Chrome para ser más rápido
    cmd="$cmd --project=chromium"

    echo -e "${YELLOW}Comando: $cmd${NC}"
    eval $cmd

    local exit_code=$?

    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}✅ Pruebas completadas exitosamente${NC}"
        echo -e "${BLUE}📊 Generando reporte...${NC}"

        # Mostrar resumen en terminal
        if [ -f "test-results/results.json" ]; then
            echo -e "${GREEN}📋 Resumen de resultados:${NC}"
            # Contar pruebas pasadas
            passed=$(grep -o '"status":"passed"' test-results/results.json | wc -l | xargs)
            failed=$(grep -o '"status":"failed"' test-results/results.json | wc -l | xargs)
            total=$((passed + failed))
            echo -e "${GREEN}   ✅ Pasadas: $passed${NC}"
            echo -e "${RED}   ❌ Fallidas: $failed${NC}"
            echo -e "${BLUE}   � Total: $total${NC}"
        fi

        echo -e "${BLUE}🌐 Abriendo reporte HTML...${NC}"
        show_report
    else
        echo -e "${RED}❌ Algunas pruebas fallaron${NC}"
        echo -e "${BLUE}💡 Abriendo reporte para ver detalles...${NC}"
        show_report
    fi

    return $exit_code
}

# Función para mostrar reporte
show_report() {
    echo -e "${BLUE}📊 Abriendo reporte de pruebas...${NC}"
    npx playwright show-report
}

# Función para generar código
generate_code() {
    echo -e "${BLUE}🎭 Iniciando generador de código...${NC}"
    echo -e "${YELLOW}   Navega en tu aplicación y Playwright generará el código automáticamente${NC}"
    npx playwright codegen http://localhost:5174
}

# Función para instalar navegadores
install_browsers() {
    echo -e "${BLUE}📥 Instalando navegadores de Playwright...${NC}"
    npx playwright install
}

# Función principal
main() {
    local test_type="all"
    local mode=""

    # Procesar argumentos
    while [[ $# -gt 0 ]]; do
        case $1 in
            smoke|auth|examenes|ui|all)
                test_type="$1"
                ;;
            headed|debug)
                mode="$1"
                ;;
            report)
                show_report
                exit 0
                ;;
            codegen)
                generate_code
                exit 0
                ;;
            install)
                install_browsers
                exit 0
                ;;
            help|--help|-h)
                show_help
                exit 0
                ;;
            *)
                echo -e "${RED}❌ Opción desconocida: $1${NC}"
                show_help
                exit 1
                ;;
        esac
        shift
    done

    # Verificar prerrequisitos
    check_prerequisites

    # Ejecutar pruebas
    run_tests "$test_type" "$mode"
}

# Si no hay argumentos, mostrar ayuda
if [[ $# -eq 0 ]]; then
    show_help
    exit 0
fi

# Ejecutar función principal
main "$@"
