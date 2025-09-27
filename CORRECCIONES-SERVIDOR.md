# Correcciones de Servidor - NFC Access

## 🚨 Problemas Identificados

### 1. Error de Rate Limiting
```
ValidationError: The Express 'trust proxy' setting is true, which allows anyone to trivially bypass IP-based rate limiting.
```

### 2. Error de Variable No Definida
```
ReferenceError: wp_user_id is not defined
```

### 3. Error SQL Persistente
```
Error en consulta SQL: Incorrect arguments to mysqld_stmt_execute
```

## ✅ Correcciones Implementadas

### 1. Rate Limiting Corregido

**Archivo**: `server.js`
**Cambio**: 
```javascript
// ANTES
trustProxy: 1, // Solo confiar en el primer proxy

// DESPUÉS  
trustProxy: false, // Deshabilitar trust proxy para evitar bypass de rate limiting
```

**Razón**: El `trustProxy: 1` permite que cualquiera pueda hacer bypass del rate limiting usando headers falsos.

### 2. Variable No Definida Corregida

**Archivo**: `controllers/accessController.js`
**Cambio**:
```javascript
// ANTES
console.error('Parámetros recibidos:', { wp_user_id, limit, offset, start_date, end_date });

// DESPUÉS
console.error('Parámetros recibidos:', { 
    wp_user_id: req.params.wp_user_id, 
    limit: req.query.limit, 
    offset: req.query.offset, 
    start_date: req.query.start_date, 
    end_date: req.query.end_date 
});
```

**Razón**: Las variables `wp_user_id`, `limit`, etc. no estaban en el scope del bloque `catch`.

### 3. Parámetros SQL Mejorados

**Archivo**: `models/AccessLog.js`
**Cambio**:
```javascript
// ANTES
params.push(parseInt(limit), parseInt(offset));

// DESPUÉS
// Asegurar que limit y offset sean números enteros válidos
const limitNum = parseInt(limit) || 50;
const offsetNum = parseInt(offset) || 0;

params.push(limitNum, offsetNum);
```

**Razón**: Agregar valores por defecto para evitar parámetros `undefined` o `NaN`.

## 🧪 Script de Prueba

Se creó `scripts/test-server.js` para verificar que el servidor funciona correctamente:

```bash
node scripts/test-server.js
```

## 📋 Instrucciones para el Usuario

### 1. Reiniciar el Servidor

```bash
# En el servidor
cd /usr/local/src/nfcaccess
npm start
```

### 2. Verificar que No Hay Errores

El servidor debe iniciar sin errores de:
- ✅ Rate limiting
- ✅ Variables no definidas
- ✅ SQL malformado

### 3. Probar Endpoints

```bash
# Probar salud
curl https://api.bonaventurecclub.com/nfc_access/health

# Probar logs
curl "https://api.bonaventurecclub.com/nfc_access/access/logs/1?limit=5"

# Probar búsqueda
curl "https://api.bonaventurecclub.com/nfc_access/cards/search?search=test"
```

### 4. Probar Shortcodes en WordPress

**Shortcode de logs**:
```
[nfc_access_logs limit="50" show_stats="true"]
```

**Shortcode de administración**:
```
[nfc_admin_panel]
```

## 🔧 Archivos Modificados

1. **`server.js`** - Corregido `trustProxy`
2. **`controllers/accessController.js`** - Corregido logging de parámetros
3. **`models/AccessLog.js`** - Mejorada validación de parámetros SQL

## 🎯 Resultado Esperado

- ✅ **Servidor inicia sin errores**
- ✅ **Rate limiting funciona correctamente**
- ✅ **Endpoints responden sin errores SQL**
- ✅ **Shortcodes funcionan en WordPress**
- ✅ **Logging mejorado para debugging**

## 🚀 Próximos Pasos

1. Reiniciar el servidor
2. Verificar que no hay errores en los logs
3. Probar los shortcodes en WordPress
4. Confirmar que los estilos coinciden con Astra

**¡El servidor debería funcionar correctamente ahora! 🎉**
