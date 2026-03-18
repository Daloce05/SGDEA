@echo off
REM ============================================================================
REM Script: Inicialización del Módulo TRD para Windows
REM Descripción: Automatiza la instalación y configuración del módulo TRD
REM Uso: inicializar_trd.bat
REM ============================================================================

setlocal enabledelayedexpansion

cls
echo.
echo ============================================================================
echo.              SGDEA - Inicializador del Módulo TRD
echo.              Tabla de Retención Documental (TRD)
echo.
echo ============================================================================
echo.

REM Variables
set PROYECTO_ROOT=%CD%
set PG_HOST=localhost
set PG_PUERTO=5432
set PG_USUARIO=postgres
set PG_BASE_DATOS=sgdea_trd
set SCHEMA_FILE=base_datos\trd\schema.sql
set DOCS_FOLDER=src\documentos\trd

echo [1/5] Verificando dependencias...
echo.

REM 1. Verificar Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js no está instalado
    echo Descarga desde: https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%a in ('node -v') do set NODE_VERSION=%%a
echo [OK] Node.js !NODE_VERSION! detectado

REM 2. Verificar npm
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm no está instalado
    pause
    exit /b 1
)

for /f "tokens=*" %%a in ('npm -v') do set NPM_VERSION=%%a
echo [OK] npm !NPM_VERSION! detectado

REM 3. Verificar PostgreSQL
where psql >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] PostgreSQL no está instalado
    echo Windows: https://www.postgresql.org/download/windows/
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%a in ('psql --version') do set PG_VERSION=%%a
echo [OK] PostgreSQL detectado
echo.

echo [2/5] Instalando dependencias de Node.js...
echo.

call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Error instalando dependencias
    pause
    exit /b 1
)

echo [OK] Dependencias instaladas
echo.

echo [3/5] Creando base de datos PostgreSQL...
echo.

echo Credenciales PostgreSQL:
echo - Host: %PG_HOST%
echo - Puerto: %PG_PUERTO%
echo - Usuario: %PG_USUARIO%
echo.

REM Crear base de datos
echo Creando base de datos '%PG_BASE_DATOS%'...

REM Verificar si existe
for /f %%a in ('psql -U %PG_USUARIO% -h %PG_HOST% -p %PG_PUERTO% -tc "SELECT 1 FROM pg_database WHERE datname = '%PG_BASE_DATOS%';"') do set DB_EXISTS=%%a

if "%DB_EXISTS%"=="1" (
    echo Base de datos ya existe
    set /p RECREATE="¿Quieres eliminar y recrear? (s/n): "
    
    if /i "%RECREATE%"=="s" (
        psql -U %PG_USUARIO% -h %PG_HOST% -p %PG_PUERTO% -c "DROP DATABASE IF EXISTS %PG_BASE_DATOS%;"
        psql -U %PG_USUARIO% -h %PG_HOST% -p %PG_PUERTO% -c "CREATE DATABASE %PG_BASE_DATOS%;"
        echo [OK] Base de datos recreada
    ) else (
        echo [OK] Usando base de datos existente
    )
) else (
    psql -U %PG_USUARIO% -h %PG_HOST% -p %PG_PUERTO% -c "CREATE DATABASE %PG_BASE_DATOS%;"
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Error creando base de datos
        echo Verifica:
        echo - PostgreSQL esté corriendo
        echo - Usuario y contraseña sean correctos
        pause
        exit /b 1
    )
    echo [OK] Base de datos creada
)
echo.

echo [4/5] Importando schema SQL...
echo.

if not exist "%SCHEMA_FILE%" (
    echo [ERROR] Archivo schema no encontrado: %SCHEMA_FILE%
    pause
    exit /b 1
)

echo Ejecutando: %SCHEMA_FILE%

psql -U %PG_USUARIO% -h %PG_HOST% -p %PG_PUERTO% -d %PG_BASE_DATOS% -f "%SCHEMA_FILE%"
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Error importando schema
    pause
    exit /b 1
)

echo [OK] Schema importado correctamente
echo.

echo [5/5] Verificando carpetas...
echo.

REM Crear carpeta de documentos
if not exist "%DOCS_FOLDER%" (
    mkdir "%DOCS_FOLDER%"
    echo [OK] Carpeta de documentos creada: %DOCS_FOLDER%
) else (
    echo [OK] Carpeta de documentos existente: %DOCS_FOLDER%
)

REM Crear carpetas de logs
if not exist "logs" mkdir logs
if not exist "logs\trd" mkdir logs\trd
echo [OK] Carpetas de logs creadas
echo.

cls
echo.
echo ============================================================================
echo.                 [OK] INICIALIZACIÓN COMPLETADA
echo.
echo ============================================================================
echo.

echo Proximos pasos:
echo.
echo 1. Verifica variables en .env:
echo    PG_HOST, PG_PUERTO, PG_USUARIO, PG_CONTRASEÑA, PG_BASE_DATOS
echo.
echo 2. Inicia el servidor (abre nueva terminal):
echo    npm run dev
echo.
echo 3. Test basico (en otra terminal):
echo    curl http://localhost:3000/api/trd/series
echo.
echo 4. Consulta documentacion:
echo    Ver archivo GUIA_TRD.md
echo.

echo Informacion util:
echo - Schema SQL: base_datos\trd\schema.sql
echo - Rutas API: src\rutas\trd\rutasTRD.js
echo - Documentacion: GUIA_TRD.md
echo - Guia Rapida: README_TRD.md
echo.

pause
