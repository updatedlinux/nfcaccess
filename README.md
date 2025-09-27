# Sistema NFC Access - Condo360

Sistema completo para gestión de acceso vehicular mediante tarjetas NFC MIFARE Classic, desarrollado para el condominio Bonaventure Country Club.

## 📋 Descripción General

Este sistema consta de dos componentes principales:
- **Backend API** en Node.js con Express
- **Plugin WordPress** con shortcodes para propietarios y administradores

### Características Principales

- ✅ Gestión completa de tarjetas NFC MIFARE Classic
- ✅ Registro de eventos de ingreso y salida vehicular
- ✅ Integración con usuarios de WordPress
- ✅ Panel de administración para junta de condominio
- ✅ Historial de accesos para propietarios
- ✅ Documentación API con Swagger
- ✅ Diseño responsive compatible con tema Astra
- ✅ Zona horaria GMT-4 (Venezuela)
- ✅ CORS abierto para integración
- ✅ Sin restricciones de acceso (registra todo)

## 🏗️ Arquitectura del Sistema

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   WordPress     │    │   Backend API   │    │   MySQL DB      │
│   (Frontend)    │◄──►│   (Node.js)     │◄──►│   (Datos)       │
│                 │    │                 │    │                 │
│ - Plugin        │    │ - Express       │    │ - wp_users      │
│ - Shortcodes    │    │ - MySQL2        │    │ - nfc_cards     │
│ - Astra Theme   │    │ - Swagger       │    │ - access_logs   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🗄️ Estructura de Base de Datos

### Tabla: `condo360_nfc_cards`
```sql
- id (BIGINT, AUTO_INCREMENT, PRIMARY KEY)
- wp_user_id (BIGINT UNSIGNED, FK a wp_users.ID)
- card_uid (VARCHAR(32), UNIQUE)
- label (VARCHAR(100), NULL)
- active (BOOLEAN, DEFAULT TRUE)
- created_at (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
```

### Tabla: `condo360_access_logs`
```sql
- id (BIGINT, AUTO_INCREMENT, PRIMARY KEY)
- card_id (BIGINT, FK a condo360_nfc_cards.id)
- access_type (ENUM: 'ingreso', 'salida')
- timestamp (DATETIME, GMT-4)
- guard_user (VARCHAR(100), NULL)
- created_at (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
```

## 🚀 Instalación

### Prerrequisitos

- Node.js 16+ 
- MySQL 8.0.43+
- WordPress 5.0+
- PHP 7.4+
- Tema Astra (recomendado)

### 1. Configuración de Base de Datos

Ejecutar el script SQL para crear las tablas:

```bash
mysql -u root -p wordpress_db < database/schema.sql
```

### 2. Instalación del Backend

```bash
# Clonar el repositorio
git clone <repository-url>
cd nfcaccess

# Instalar dependencias
npm install

# Configurar variables de entorno
cp env.example .env
# Editar .env con tus credenciales de base de datos

# Iniciar servidor
npm start
# Para desarrollo: npm run dev
```

### 3. Instalación del Plugin WordPress

1. Subir la carpeta `wordpress-plugin` a `/wp-content/plugins/`
2. Renombrar a `nfc-access`
3. Activar el plugin desde el panel de administración
4. Verificar que las tablas de base de datos existan

### 4. Configuración de Nginx (Producción)

```nginx
location /nfc_access {
    proxy_pass http://localhost:5000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## 📚 API Endpoints

### Base URL
- **Desarrollo**: `http://localhost:5000`
- **Producción**: `https://api.bonaventurecclub.com/nfc_access`

### Documentación Swagger
- **Desarrollo**: `http://localhost:5000/api-docs`
- **Producción**: `https://api.bonaventurecclub.com/nfc_access/api-docs`

### Endpoints Principales

#### Tarjetas NFC

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/cards/register` | Registrar nueva tarjeta |
| `GET` | `/cards/:wp_user_id` | Obtener tarjetas de usuario |
| `GET` | `/cards/owner/:card_uid` | Obtener propietario por tarjeta |
| `GET` | `/cards/search` | Buscar tarjetas (admin) |
| `PUT` | `/cards/deactivate/:card_uid` | Desactivar tarjeta |

#### Accesos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/access/log` | Registrar evento de acceso |
| `GET` | `/access/logs/:wp_user_id` | Historial de usuario |
| `GET` | `/access/stats/:wp_user_id` | Estadísticas de usuario |
| `GET` | `/access/last/:card_uid` | Último acceso de tarjeta |
| `GET` | `/access/today-summary` | Resumen del día |

### Ejemplos de Uso

#### Registrar Tarjeta
```bash
curl -X POST https://api.bonaventurecclub.com/nfc_access/cards/register \
  -H "Content-Type: application/json" \
  -d '{
    "wp_user_login": "propietario123",
    "card_uid": "12345678ABCD",
    "label": "Tarjeta vehículo principal"
  }'
```

#### Registrar Acceso
```bash
curl -X POST https://api.bonaventurecclub.com/nfc_access/access/log \
  -H "Content-Type: application/json" \
  -d '{
    "card_uid": "12345678ABCD",
    "access_type": "ingreso",
    "guard_user": "Vigilante Juan"
  }'
```

## 🎨 Shortcodes WordPress

### Para Propietarios

```php
[nfc_access_logs limit="50" show_stats="true"]
```

**Parámetros:**
- `limit`: Número de registros a mostrar (default: 50)
- `show_stats`: Mostrar estadísticas (default: true)

### Para Administradores

```php
[nfc_admin_panel]
```

**Funcionalidades:**
- Búsqueda de tarjetas por usuario
- Resumen de accesos del día
- Visualización de historial de cualquier propietario

## 🔧 Configuración

### Variables de Entorno (.env)

```env
# Base de Datos
DB_HOST=localhost
DB_PORT=3306
DB_NAME=wordpress_db
DB_USER=wordpress_user
DB_PASSWORD=your_password

# Servidor
PORT=5000
NODE_ENV=production

# WordPress
WP_DB_HOST=localhost
WP_DB_PORT=3306
WP_DB_NAME=wordpress_db
WP_DB_USER=wordpress_user
WP_DB_PASSWORD=your_password

# Zona Horaria
TIMEZONE=America/Caracas
```

### Configuración del Plugin WordPress

El plugin se configura automáticamente, pero puedes verificar:

1. **Estado de la API**: Ir a `Configuración > NFC Access`
2. **Permisos**: Solo administradores pueden usar `[nfc_admin_panel]`
3. **Estilos**: Compatible con tema Astra por defecto

## 📱 Uso del Sistema

### Para Propietarios

1. **Ver Historial**: Usar shortcode `[nfc_access_logs]` en cualquier página
2. **Filtrar Fechas**: Usar los filtros de fecha para buscar períodos específicos
3. **Ver Estadísticas**: Estadísticas mensuales de ingresos y salidas

### Para Administradores

1. **Buscar Tarjetas**: Usar `[nfc_admin_panel]` para buscar por nombre, email o login
2. **Ver Resumen Diario**: Resumen de todos los accesos del día actual
3. **Historial Completo**: Ver accesos de cualquier propietario

### Para Desarrolladores

1. **API REST**: Usar endpoints para integración con sistemas externos
2. **Webhooks**: Posibilidad de agregar webhooks para notificaciones
3. **Logs**: Todos los eventos se registran para auditoría

## 🛠️ Desarrollo

### Estructura del Proyecto

```
nfcaccess/
├── config/
│   ├── database.js          # Configuración MySQL
│   └── swagger.js           # Configuración Swagger
├── controllers/
│   ├── cardController.js    # Controlador tarjetas
│   └── accessController.js  # Controlador accesos
├── models/
│   ├── Card.js              # Modelo tarjetas
│   └── AccessLog.js         # Modelo logs
├── routes/
│   ├── cards.js             # Rutas tarjetas
│   └── access.js            # Rutas accesos
├── middleware/
│   └── errorHandler.js      # Manejo errores
├── utils/
│   └── timezone.js          # Utilidades zona horaria
├── wordpress-plugin/
│   ├── nfc-access-plugin.php # Plugin principal
│   └── assets/
│       ├── css/nfc-access.css # Estilos
│       └── js/nfc-access.js   # JavaScript
├── database/
│   └── schema.sql           # Script creación tablas
├── server.js                # Servidor principal
├── package.json             # Dependencias Node.js
└── README.md               # Esta documentación
```

### Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Servidor con nodemon

# Producción
npm start           # Servidor normal

# Base de datos
mysql -u root -p wordpress_db < database/schema.sql
```

### Agregar Nuevas Funcionalidades

1. **Nuevo Endpoint**: Agregar ruta en `/routes/` y controlador en `/controllers/`
2. **Nuevo Modelo**: Crear modelo en `/models/` con métodos de base de datos
3. **Nuevo Shortcode**: Agregar método en el plugin WordPress
4. **Nuevos Estilos**: Modificar `/wordpress-plugin/assets/css/nfc-access.css`

## 🔒 Seguridad

### Medidas Implementadas

- ✅ **Helmet.js**: Headers de seguridad
- ✅ **Rate Limiting**: Límite de requests por IP
- ✅ **CORS**: Configurado para integración
- ✅ **Validación**: Validación de datos de entrada
- ✅ **Sanitización**: Sanitización de parámetros
- ✅ **Nonces**: Tokens de seguridad en WordPress

### Consideraciones

- **Sin Autenticación**: El sistema no requiere autenticación API (por diseño)
- **CORS Abierto**: Permitido para integración con sistemas externos
- **Logs Completos**: Todos los eventos se registran para auditoría
- **Validación WordPress**: El plugin usa nonces y capacidades de WordPress

## 🐛 Solución de Problemas

### Problemas Comunes

#### Error de Conexión a Base de Datos
```bash
# Verificar configuración
mysql -u wordpress_user -p wordpress_db

# Verificar variables de entorno
cat .env
```

#### Plugin No Se Activa
1. Verificar que las tablas existan en MySQL
2. Verificar permisos de archivos
3. Revisar logs de WordPress

#### API No Responde
1. Verificar que el servidor esté corriendo: `npm start`
2. Verificar puerto: `netstat -tlnp | grep 5000`
3. Verificar logs del servidor

#### Estilos No Se Aplican
1. Verificar que el tema Astra esté activo
2. Limpiar caché del navegador
3. Verificar que el CSS se esté cargando

### Logs y Debugging

#### Logs del Servidor
```bash
# Ver logs en tiempo real
tail -f /var/log/nfc-access.log

# Verificar estado
curl http://localhost:5000/health
```

#### Logs de WordPress
```bash
# Habilitar debug en wp-config.php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
```

## 📊 Monitoreo

### Métricas Importantes

- **Uptime**: Disponibilidad del servidor API
- **Response Time**: Tiempo de respuesta de endpoints
- **Database Connections**: Conexiones activas a MySQL
- **Error Rate**: Porcentaje de errores en requests

### Health Check

```bash
# Verificar estado del sistema
curl https://api.bonaventurecclub.com/nfc_access/health
```

Respuesta esperada:
```json
{
  "success": true,
  "message": "Sistema funcionando correctamente",
  "data": {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "database": "conectado",
    "uptime": 3600,
    "memory": {...},
    "version": "v16.0.0"
  }
}
```

## 🤝 Contribución

### Cómo Contribuir

1. Fork del repositorio
2. Crear rama para feature: `git checkout -b feature/nueva-funcionalidad`
3. Commit cambios: `git commit -m 'Agregar nueva funcionalidad'`
4. Push a la rama: `git push origin feature/nueva-funcionalidad`
5. Crear Pull Request

### Estándares de Código

- **JavaScript**: ESLint con configuración estándar
- **PHP**: WordPress Coding Standards
- **CSS**: BEM methodology
- **Commits**: Conventional Commits

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 📞 Soporte

### Contacto

- **Email**: soporte@condo360.com
- **Documentación**: [Swagger UI](https://api.bonaventurecclub.com/nfc_access/api-docs)
- **Issues**: Usar el sistema de issues de GitHub

### Horarios de Soporte

- **Lunes a Viernes**: 8:00 AM - 6:00 PM (GMT-4)
- **Emergencias**: 24/7 para problemas críticos

---

## 📝 Changelog

### v1.0.0 (2024-01-15)
- ✅ Sistema inicial completo
- ✅ Backend API con Express
- ✅ Plugin WordPress con shortcodes
- ✅ Documentación Swagger
- ✅ Compatibilidad con tema Astra
- ✅ Zona horaria GMT-4
- ✅ Sistema de logs completo

---

**Desarrollado con ❤️ para Condo360 - Bonaventure Country Club**
