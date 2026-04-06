@echo off
REM Script de Inicio Rápido - SGDEA RBAC
REM Ejecuta la migración y el servidor

setlocal enabledelayedexpansion

echo.
echo ========================================
echo SGDEA - Control de Acceso por Roles
echo ========================================
echo.

REM Verificar si node está instalado
where node >nul 2>nul
if errorlevel 1 (
    echo ERROR: Node.js no está instalado
    echo Descargar desde: https://nodejs.org/
    pause
    exit /b 1
)

echo ✓ Node.js detectado

REM Ir al directorio del proyecto
cd /d "%~dp0"

REM Verificar package.json
if not exist package.json (
    echo ERROR: package.json no encontrado
    echo Asegúrate de estar en la carpeta SGDEA
    pause
    exit /b 1
)

echo.
echo ========================================
echo Paso 1: Instalando dependencias
echo ========================================
echo.

call npm install

if errorlevel 1 (
    echo ERROR: Error durante npm install
    pause
    exit /b 1
)

echo.
echo ========================================
echo Paso 2: Ejecutando migración de BD
echo ========================================
echo.

node migracion_roles_auth.js

if errorlevel 1 (
    echo ERROR: Error en la migración
    echo Verifica que:
    echo   - MySQL está corriendo
    echo   - Base de datos SGDEA existe
    echo   - Las credenciales son correctas
    pause
    exit /b 1
)

echo.
echo ========================================
echo Paso 3: Iniciando servidor
echo ========================================
echo.
echo El servidor se iniciará en http://localhost:3000
echo Presiona Ctrl+C para detener
echo.

call npm run dev

pause
