#!/bin/bash

###############################################################################
# Script: Inicialización del Módulo TRD
# Descripción: Automatiza la instalación y configuración del módulo TRD
# Uso: bash inicializar_trd.sh
###############################################################################

echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║         SGDEA - Inicializador del Módulo TRD                      ║"
echo "║         Tabla de Retención Documental (TRD)                       ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables
PROYECTO_ROOT="$(pwd)"
PG_HOST="${PG_HOST:-localhost}"
PG_PUERTO="${PG_PUERTO:-5432}"
PG_USUARIO="${PG_USUARIO:-postgres}"
PG_BASE_DATOS="sgdea_trd"
SCHEMA_FILE="base_datos/trd/schema.sql"
DOCS_FOLDER="src/documentos/trd"

echo -e "${BLUE}[1/5]${NC} Verificando dependencias..."
echo ""

# 1. Verificar Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js no está instalado${NC}"
    echo "  Descarga desde: https://nodejs.org/"
    exit 1
fi
NODE_VERSION=$(node -v)
echo -e "${GREEN}✓ Node.js${NC} ($NODE_VERSION) detectado"

# 2. Verificar npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm no está instalado${NC}"
    exit 1
fi
NPM_VERSION=$(npm -v)
echo -e "${GREEN}✓ npm${NC} ($NPM_VERSION) detectado"

# 3. Verificar PostgreSQL
if ! command -v psql &> /dev/null; then
    echo -e "${RED}✗ PostgreSQL no está instalado${NC}"
    echo "  Windows: https://www.postgresql.org/download/windows/"
    echo "  macOS: brew install postgresql"
    echo "  Linux: sudo apt-get install postgresql"
    exit 1
fi
PG_VERSION=$(psql --version)
echo -e "${GREEN}✓ PostgreSQL${NC} detectado"
echo ""

echo -e "${BLUE}[2/5]${NC} Instalando dependencias de Node.js..."
echo ""

if npm install; then
    echo -e "${GREEN}✓ Dependencias instaladas${NC}"
else
    echo -e "${RED}✗ Error instalando dependencias${NC}"
    exit 1
fi
echo ""

echo -e "${BLUE}[3/5]${NC} Creando base de datos PostgreSQL..."
echo ""

# Crear base de datos
PSQL_CMD="psql -U $PG_USUARIO -h $PG_HOST -p $PG_PUERTO"

echo "  Credenciales PostgreSQL:"
echo "  - Host: $PG_HOST"
echo "  - Puerto: $PG_PUERTO"
echo "  - Usuario: $PG_USUARIO"
echo ""

# Intentar crear la base de datos
echo "  Creando base de datos '$PG_BASE_DATOS'..."
if $PSQL_CMD -tc "SELECT 1 FROM pg_database WHERE datname = '$PG_BASE_DATOS'" | grep -q 1; then
    echo -e "${YELLOW}⚠ Base de datos ya existe${NC}"
    read -p "  ¿Quieres eliminar y recrear? (s/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        $PSQL_CMD -c "DROP DATABASE IF EXISTS $PG_BASE_DATOS;"
        $PSQL_CMD -c "CREATE DATABASE $PG_BASE_DATOS;"
        echo -e "${GREEN}✓ Base de datos recreada${NC}"
    else
        echo -e "${YELLOW}⚠ Usando base de datos existente${NC}"
    fi
else
    if $PSQL_CMD -c "CREATE DATABASE $PG_BASE_DATOS;"; then
        echo -e "${GREEN}✓ Base de datos creada${NC}"
    else
        echo -e "${RED}✗ Error creando base de datos${NC}"
        exit 1
    fi
fi
echo ""

echo -e "${BLUE}[4/5]${NC} Importando schema SQL..."
echo ""

if [ ! -f "$SCHEMA_FILE" ]; then
    echo -e "${RED}✗ Archivo schema no encontrado: $SCHEMA_FILE${NC}"
    exit 1
fi

echo "  Ejecutando: $SCHEMA_FILE"
if $PSQL_CMD -d $PG_BASE_DATOS -f "$SCHEMA_FILE" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Schema importado correctamente${NC}"
    
    # Contar tablas creadas
    TABLA_COUNT=$($PSQL_CMD -d $PG_BASE_DATOS -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';")
    echo "  Tablas creadas: $TABLA_COUNT"
else
    echo -e "${RED}✗ Error importando schema${NC}"
    exit 1
fi
echo ""

echo -e "${BLUE}[5/5]${NC} Verificando carpetas..."
echo ""

# Crear carpeta de documentos si no existe
if [ ! -d "$DOCS_FOLDER" ]; then
    mkdir -p "$DOCS_FOLDER"
    echo -e "${GREEN}✓ Carpeta de documentos creada: $DOCS_FOLDER${NC}"
else
    echo -e "${GREEN}✓ Carpeta de documentos existente: $DOCS_FOLDER${NC}"
fi

# Crear carpetas de logs
mkdir -p "logs"
mkdir -p "logs/trd"
echo -e "${GREEN}✓ Carpetas de logs creadas${NC}"
echo ""

echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║                   ✓ INICIALIZACIÓN COMPLETADA                     ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""

echo "📋 Próximos pasos:"
echo ""
echo "  1. Verifica variables en .env:"
echo "     PG_HOST, PG_PUERTO, PG_USUARIO, PG_CONTRASEÑA, PG_BASE_DATOS"
echo ""
echo "  2. Inicia el servidor:"
echo "     npm run dev"
echo ""
echo "  3. Test básico:"
echo "     curl http://localhost:3000/api/trd/series"
echo ""
echo "  4. Consulta documentación:"
echo "     Ver archivo GUIA_TRD.md"
echo ""

echo -e "${BLUE}Información útil:${NC}"
echo "  - Schema SQL: base_datos/trd/schema.sql"
echo "  - Rutas API: src/rutas/trd/rutasTRD.js"
echo "  - Documentación: GUIA_TRD.md"
echo "  - Guía Rápida: README_TRD.md"
echo ""
