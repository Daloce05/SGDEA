# 🎨 Frontend TRD SGDEA

Frontend limpio y moderno para el Sistema de Gestión Documental (TRD).

## ✨ Características

- ✅ **Interfaz Intuitiva**: Navegación clara con sidebar
- ✅ **Colores Claros**: Azul, verde, gris - muy legible
- ✅ **Totalmente Responsivo**: Funciona en desktop, tablet y móvil
- ✅ **Sin Dependencias**: HTML5 + CSS3 + JavaScript vanilla
- ✅ **Toda Funcionalidad**: Crear, editar, eliminar, cargar, descargar
- ✅ **Búsqueda Avanzada**: Filtros y búsqueda fulltext
- ✅ **Estadísticas**: Dashboard con gráficos
- ✅ **Notificaciones**: Toast con avisos de éxito/error

## 📁 Estructura

```
frontend/
├── index.html          # HTML principal
├── styles.css          # Estilos limpios y claros
├── app.js              # Lógica JavaScript
└── README.md           # Este archivo
```

## 🚀 Inicio Rápido

### 1. Requisitos
- Backend SGDEA TRD corriendo en `http://localhost:3000`
- Navegador moderno (Chrome, Firefox, Safari, Edge)

### 2. Abrir en Navegador

```bash
# Opción 1: Abrir directamente
open frontend/index.html

# Opción 2: Usar línea de comandos
start frontend\index.html  # Windows
```

### 3. O servir con Python

```bash
# Python 3
python -m http.server 8000

# Luego visita
http://localhost:8000/frontend/
```

O con Node.js:

```bash
npx http-server frontend -p 8000
```

## 📋 Secciones

### 📑 Series
- Listar todas las series
- Crear nueva serie
- Ver detalles
- Desactivar serie
- Búsqueda rápida

### 📄 Subseries
- Listar por serie
- Crear subserie
- Filtrar por serie
- Gestionar subseries

### 📋 Tipos Documentales
- Listar tipos de una subserie
- Crear nuevo tipo
- Flexible parent (serie o subserie)
- Eliminar tipos

### 📦 Archivos
- Listar archivos por tipo
- Cargar PDF (drag & drop)
- Descargar archivo
- Eliminar archivo
- Ver metadata (tamaño, hash)

### 🔎 Búsqueda
- Buscar por nombre
- Filtrar por estado (digital/físico/híbrido)
- Rango de fechas
- Resultados en tiempo real

### 📊 Estadísticas
- Total de archivos
- Almacenamiento total
- Desglose por estado
- Gráfico de distribución

## 🎨 Paleta de Colores

```
Primario:     #3B82F6  (Azul amigable)
Secundario:   #10B981  (Verde suave)
Peligro:      #EF4444  (Rojo suave)
Advertencia:  #F59E0B  (Ámbar suave)
Grises:       #F9FAFB  (Muy claros)
```

## 🏗️ Arquitectura

```
Frontend
├── HTML (Estructura)
│   └── Secciones, Modales, Tablas
├── CSS (Presentación)
│   ├── Variables de color
│   ├── Grid/Flex layouts
│   ├── Componentes reutilizables
│   └── Responsive design
└── JavaScript (Lógica)
    ├── API calls
    ├── Event handling
    ├── DOM manipulation
    └── Validaciones
```

## 🔌 API Integration

Todos los endpoints se llaman desde JavaScript:

```javascript
const API_BASE = 'http://localhost:3000/api/trd';

// Ejemplo:
fetch(`${API_BASE}/series`)
    .then(r => r.json())
    .then(data => {
        if (data.exito) {
            // procesar datos
        }
    });
```

## 📱 Responsividad

```
Desktop (>1024px)
├── Sidebar lateral
├── Contenido amplio
└── Todas funciones visibles

Tablet (768-1024px)
├── Sidebar arriba horizontal
├── Contenido mediado
└── Botones adaptados

Mobile (<768px)
├── Navegación colapsada
├── Una columna
└── Botones grandes
```

## ⌨️ Atajos y Funciones

| Acción | Resultado |
|--------|-----------|
| Click en sección | Cambiar vista |
| Seleccionar serie | Cargar subseries |
| Seleccionar subserie | Cargar tipos |
| Seleccionar tipo | Cargar archivos |
| Arrastar PDF | Cargar archivo |
| Click en botón X | Eliminar elemento |
| Buscar | Filtrar en vivo |

## 🐛 Troubleshooting

### "Desconectado"
- Verifica que backend corra en `localhost:3000`
- Revisa la consola (F12) para errores
- Prueba: `curl http://localhost:3000/api/trd/series`

### "Error cargando datos"
- Revisa la pestaña Network en DevTools
- Verifica CORS está habilitado en backend
- Lee el error en la consola

### Archivo no carga
- Solo se aceptan PDFs
- Máximo 100MB
- Verifica carpeta `src/documentos/trd/` exista

### No veo cambios
- Haz clic en "Refrescar" en sidebar
- Limpia cache: "Limpiar Cache" en sidebar
- F5 para refrescar página

## 🔐 Seguridad

- ✅ Validaciones frontend (no confiable)
- ✅ Backend hace validaciones reales (confiable)
- ✅ MD5 hashing de archivos
- ✅ Soft deletes (no borrado físico)
- ✅ Soft deletes (no borrado físico)

## 📱 Dispositivos Soportados

- ✅ Desktop (Chrome, Firefox, Safari, Edge)
- ✅ Tablet (iPad, Android)
- ✅ Mobile (iPhone, Android)

## 📝 Ejemplo de Flujo

1. **Crear Serie**: Click "Nueva Serie" → Completa form → Guardar
2. **Crear Subserie**: Select serie → "Nueva Subserie" → Guardar
3. **Crear Tipo**: Select subserie → "Nuevo Tipo" → Guardar
4. **Cargar Archivo**: Select tipo → "Cargar Archivo" → Arrastra PDF → Cargar
5. **Descargar**: Click ⬇️ en archivo
6. **Buscar**: Ir a Búsqueda → Completa criterios → Click Buscar

## 🎓 Ver

- Tablascon datos en tiempo real
- Modales para crear nuevos elementos
- Notificaciones toast
- Sidebar con navegación
- Estadísticas con gráficos

## 🚀 Próximas Mejoras

- [ ] Exportar a Excel
- [ ] Reportes en PDF
- [ ] Autenticación/login
- [ ] Temas dark mode
- [ ] Drag & drop en tablas
- [ ] Editar elementos
- [ ] Confirmaciones antes de eliminar
- [ ] Paginación en tablas

## 📞 Soporte

Si algo no funciona:

1. Verifica backend corra: `npm run dev`
2. Abre DevTools (F12): Consola y Network
3. Revisa `.env` tenga config PostgreSQL correcta
4. Consulta `GUIA_TRD.md`

## 📄 Licencia

MIT

---

**Versión**: 1.0.0  
**Estado**: ✅ Producción  
**Actualizado**: Marzo 2026
