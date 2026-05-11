

# Manual de Instalación Profesional – SGDEA

## 1. Requisitos Previos

Antes de iniciar la instalación del Sistema de Gestión Documental Electrónica y Archivo (SGDEA), asegúrese de contar con los siguientes requisitos:

- **Sistema Operativo:** Windows 10/11, Linux o macOS.
- **Node.js:** v16 o superior. [Descargar Node.js](https://nodejs.org/)
- **npm:** v8 o superior (incluido con Node.js).
- **PostgreSQL:** v13 o superior. [Descargar PostgreSQL](https://www.postgresql.org/download/)
- **Git:** (opcional, para clonar el repositorio).

## 2. Descarga del Proyecto

Clone el repositorio o descargue el código fuente en su equipo:

```bash
git clone https://github.com/Daloce05/SGDEA.git
cd SGDEA
```
O simplemente descargue y descomprima el archivo ZIP desde GitHub.

## 3. Configuración de Variables de Entorno

Edite el archivo `.env` en la raíz del proyecto para definir los parámetros de conexión a la base de datos y otras variables clave. Ejemplo:

```
PUERTO=3000
AMBIENTE=desarrollo
PG_HOST=localhost
PG_PORT=5432
PG_USER=postgres
PG_PASSWORD=su_contraseña
PG_DATABASE=sgdea_production
```

## 4. Instalación de Dependencias

Ejecute el siguiente comando para instalar las dependencias del backend:

```bash
npm install
```

## 5. Inicialización de la Base de Datos

SGDEA incluye scripts automatizados para crear y poblar la base de datos TRD:

- **Windows:**
	- Ejecute `inicializar_trd.bat` haciendo doble clic o desde la terminal:
		```
		./inicializar_trd.bat
		```
- **Linux/macOS:**
	- Ejecute el script en terminal:
		```bash
		bash inicializar_trd.sh
		```

Estos scripts:
- Verifican dependencias (Node.js, npm, PostgreSQL)
- Instalan dependencias Node.js
- Crean la base de datos y ejecutan el schema SQL
- Generan carpetas necesarias para documentos y logs

Siga las instrucciones interactivas en pantalla para completar la inicialización.

## 6. Ejecución del Servidor

Inicie el servidor de desarrollo con:

```bash
npm run dev
```

El backend estará disponible en `http://localhost:3000`.

## 7. Pruebas Básicas de Funcionamiento

Puede verificar el funcionamiento básico con:

```bash
curl http://localhost:3000/api/trd/series
```
O acceda a la interfaz web en `public/index.html` o `public/admin.html`.

## 8. Recomendaciones de Seguridad y Producción

- Cambie las contraseñas y secretos por valores seguros antes de producción.
- Restrinja el acceso a la base de datos y puertos del servidor.
- Realice respaldos periódicos de la base de datos y documentos.
- Mantenga actualizado el sistema y dependencias.

## 9. Soporte y Documentación

- Consulte los archivos `README.md`, `GUIA_RBAC.md` y `GUIA_TRD.md` para detalles de uso y administración.
- Para soporte, contacte al equipo de desarrollo o abra un issue en el repositorio.

---

**Este manual de instalación garantiza una puesta en marcha profesional, segura y eficiente del sistema SGDEA.**