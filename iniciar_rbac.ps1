#!/usr/bin/env pwsh

# Script de Inicio Rápido - SGDEA RBAC
# Ejecuta la migración y el servidor

Write-Host ""
Write-Host "========================================"
Write-Host "SGDEA - Control de Acceso por Roles" -ForegroundColor Cyan
Write-Host "========================================"
Write-Host ""

# Verificar si node está instalado
$nodeCheck = & where.exe node 2>$null
if (-not $nodeCheck) {
    Write-Host "ERROR: Node.js no está instalado" -ForegroundColor Red
    Write-Host "Descargar desde: https://nodejs.org/"
    Read-Host "Presiona Enter para salir"
    exit 1
}

Write-Host "✓ Node.js detectado" -ForegroundColor Green

# Ir al directorio del proyecto
Set-Location $PSScriptRoot

# Verificar package.json
if (-not (Test-Path "package.json")) {
    Write-Host "ERROR: package.json no encontrado" -ForegroundColor Red
    Write-Host "Asegúrate de estar en la carpeta SGDEA"
    Read-Host "Presiona Enter para salir"
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "Paso 1: Instalando dependencias"
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""

npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Error durante npm install" -ForegroundColor Red
    Read-Host "Presiona Enter para salir"
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "Paso 2: Ejecutando migración de BD"
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""

node migracion_roles_auth.js

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Error en la migración" -ForegroundColor Red
    Write-Host "Verifica que:" -ForegroundColor Yellow
    Write-Host "  - MySQL está corriendo"
    Write-Host "  - Base de datos SGDEA existe"
    Write-Host "  - Las credenciales son correctas"
    Read-Host "Presiona Enter para salir"
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "Paso 3: Iniciando servidor"
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "El servidor se iniciará en http://localhost:3000" -ForegroundColor Cyan
Write-Host "Presiona Ctrl+C para detener" -ForegroundColor Cyan
Write-Host ""

npm run dev

Read-Host "Presiona Enter para salir"
