/**
 * Script SQL - Datos de prueba para SGDEA
 * 
 * Ejecutar después de inicializar las tablas:
 * mysql -u root -p sgdea < base_datos/datos_prueba.sql
 */

-- ============================================
-- INSERTAR TIPOS DE DOCUMENTOS
-- ============================================

INSERT INTO tipos_documentos (nombre, descripcion, prefijo, activo) VALUES
('Contrato', 'Contratos laborales y comerciales', 'CT', true),
('Reporte', 'Reportes y análisis', 'RP', true),
('Factura', 'Facturas y recibos', 'FV', true),
('Orden de Compra', 'Órdenes de compra a proveedores', 'OC', true),
('Memorándum', 'Comunicados internos', 'MM', true),
('Solicitud', 'Solicitudes de empleados', 'SL', true),
('Permiso', 'Permisos y autorizaciones', 'PM', true),
('Certificado', 'Certificados diversos', 'CF', true);

-- ============================================
-- INSERTAR CATEGORÍAS DE DOCUMENTOS
-- ============================================

INSERT INTO categorias_documentos (nombre, descripcion, color, activo) VALUES
('Recurso Humano', 'Documentos de RRHH', '#FF6B6B', true),
('Ventas', 'Documentos de ventas', '#00D9FF', true),
('Finanzas', 'Documentos financieros', '#52B788', true),
('Legal', 'Documentos legales', '#D62828', true),
('Administrativo', 'Documentos administrativos', '#F77F00', true),
('Confidencial', 'Documentos confidenciales', '#6A4C93', true);

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================

/*
Este archivo contiene los datos de prueba.

Para ejecutarlo:

1. Opción 1: Desde terminal
   mysql -u root -p sgdea < base_datos/datos_prueba.sql

2. Opción 2: Desde MySQL console
   mysql> use sgdea;
   mysql> source base_datos/datos_prueba.sql;

3. Opción 3: Desde interfaz gráfica (phpMyAdmin, Workbench)
   - Seleccionar base de datos 'sgdea'
   - Abrir este archivo
   - Ejecutar

NOTA: Este script no incluye usuarios de prueba
      Crear usuarios a través de la API en /api/autenticacion/registro
*/

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Ver tipos de documentos insertados
-- SELECT * FROM tipos_documentos;

-- Ver categorías insertadas
-- SELECT * FROM categorias_documentos;

-- Más ejemplos a ejecutar manualmente vía API:

/*
USUARIO DE PRUEBA (admin):
POST /api/autenticacion/registro
{
  "nombre": "Admin",
  "apellido": "Sistema",
  "email": "admin@sgdea.com",
  "contraseña": "AdminSGDEA2024!"
}

Luego cambiar su rol a 'admin' directamente en BD:
UPDATE usuarios SET rol = 'admin' WHERE email = 'admin@sgdea.com';

USUARIO DE PRUEBA (gerente):
POST /api/autenticacion/registro
{
  "nombre": "Carlos",
  "apellido": "Gerente",
  "email": "gerente@sgdea.com",
  "contraseña": "GerenteSGDEA2024!"
}

UPDATE usuarios SET rol = 'gerente' WHERE email = 'gerente@sgdea.com';

USUARIO NORMAL:
POST /api/autenticacion/registro
{
  "nombre": "Juan",
  "apellido": "Usuario",
  "email": "usuario@sgdea.com",
  "contraseña": "UsuarioSGDEA2024!"
}
*/
