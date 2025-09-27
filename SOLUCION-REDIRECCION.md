# Solución Específica para Redirección de Swagger UI

## 🎯 Problema Identificado

A pesar de que el backend funciona correctamente (como se puede ver en [https://api.bonaventurecclub.com/nfc_access/](https://api.bonaventurecclub.com/nfc_access/)), Swagger UI sigue redirigiendo de:
- `https://api.bonaventurecclub.com/nfc_access/api-docs` 
- A: `https://api.bonaventurecclub.com/api-docs`

## 🔧 Solución Implementada

He implementado una solución específica que reemplaza completamente el comportamiento de Swagger UI Express con un HTML personalizado que:

1. **Intercepta todas las redirecciones** antes de que ocurran
2. **Corrige automáticamente las URLs** para mantener el prefijo `/nfc_access`
3. **Previene redirecciones del navegador** mediante JavaScript
4. **Maneja eventos de click y formularios** para corregir URLs

## 📁 Archivos Modificados

### 1. `server.js` - Servidor Principal
- ✅ Comentado el middleware original de Swagger UI Express
- ✅ Agregado middleware personalizado `swaggerUIFix`
- ✅ Agregado middleware para OAuth2 redirect

### 2. `middleware/swaggerFix.js` - Nuevo Middleware
- ✅ HTML personalizado para Swagger UI
- ✅ JavaScript para interceptar y corregir redirecciones
- ✅ Manejo de eventos de click y formularios
- ✅ Prevención de redirecciones del navegador

### 3. `scripts/test-swagger-redirect.js` - Script de Verificación
- ✅ Verificación específica de redirecciones
- ✅ Detección de URLs incorrectas en HTML
- ✅ Prueba de múltiples rutas de acceso

## 🚀 Pasos para Implementar

### 1. Reiniciar el Backend

```bash
# Si usas PM2
pm2 restart nfc-access

# Si usas systemd
sudo systemctl restart nfc-access

# Si usas Docker
docker restart nfc-access-container

# Si ejecutas directamente
# Detener el proceso actual (Ctrl+C) y ejecutar:
npm start
```

### 2. Verificar la Implementación

```bash
# Ejecutar script de verificación específico
node scripts/test-swagger-redirect.js production
```

### 3. Probar en el Navegador

1. **Acceder a**: `https://api.bonaventurecclub.com/nfc_access/api-docs/`
2. **Verificar que**:
   - La URL se mantiene con `/nfc_access/api-docs/`
   - No hay redirección a `/api-docs/`
   - Swagger UI carga correctamente
   - Los recursos CSS/JS cargan sin errores

## 🔍 Cómo Funciona la Solución

### Interceptación de Redirecciones

El middleware personalizado:

1. **Sirve HTML personalizado** en lugar del HTML de Swagger UI Express
2. **Incluye JavaScript que intercepta**:
   - Clicks en enlaces (`<a>` tags)
   - Envío de formularios
   - Cambios en `window.location`
   - Manipulación del historial del navegador

3. **Corrige automáticamente** cualquier URL que contenga `/api-docs` sin el prefijo `/nfc_access`

### Prevención de Redirecciones del Navegador

```javascript
// Interceptar clicks en enlaces
document.addEventListener('click', function(e) {
    const target = e.target;
    if (target.tagName === 'A' && target.href) {
        const href = target.href;
        if (href.includes('/api-docs') && !href.includes('/nfc_access/api-docs')) {
            e.preventDefault();
            const correctedUrl = href.replace('/api-docs', '/nfc_access/api-docs');
            window.location.href = correctedUrl;
        }
    }
});
```

### Configuración de Swagger UI

El HTML personalizado configura Swagger UI con:

- **URL del JSON**: `/nfc_access/api-docs/swagger.json`
- **Servidor base**: `/nfc_access`
- **OAuth2 redirect**: `/nfc_access/api-docs/oauth2-redirect.html`
- **Validación externa deshabilitada**: `validatorUrl: null`

## 🧪 Verificación de la Solución

### Script de Verificación

El script `test-swagger-redirect.js` verifica:

1. **Carga de Swagger UI** sin redirecciones
2. **Referencias correctas** en el HTML
3. **Ausencia de scripts problemáticos**
4. **JSON de Swagger** accesible
5. **Múltiples rutas de acceso** sin redirecciones

### Verificación Manual

1. **Abrir**: `https://api.bonaventurecclub.com/nfc_access/api-docs/`
2. **Verificar en DevTools**:
   - No hay errores 404 en recursos
   - No hay redirecciones en Network tab
   - Console no muestra errores de JavaScript

3. **Probar funcionalidad**:
   - Expandir/contraer endpoints
   - Usar "Try it out" en endpoints
   - Verificar que las URLs generadas incluyan `/nfc_access`

## 🐛 Solución de Problemas

### Problema: Swagger UI sigue redirigiendo

**Posibles causas**:
1. El backend no se reinició correctamente
2. Hay caché del navegador
3. El middleware no se está aplicando

**Soluciones**:
```bash
# 1. Verificar que el backend esté corriendo
pm2 status nfc-access

# 2. Verificar logs del backend
pm2 logs nfc-access

# 3. Limpiar caché del navegador (Ctrl+Shift+R)
# 4. Probar en modo incógnito
```

### Problema: Recursos CSS/JS no cargan

**Solución**:
- Los recursos se cargan desde CDN (unpkg.com)
- Verificar conectividad a internet
- Verificar que no haya bloqueos de firewall

### Problema: JavaScript no funciona

**Verificar**:
1. Console del navegador para errores
2. Que el HTML personalizado se esté sirviendo
3. Que los scripts de Swagger UI se carguen correctamente

## 📊 Monitoreo

### Logs a Revisar

```bash
# Logs del backend
pm2 logs nfc-access --lines 50

# Buscar requests a /api-docs
pm2 logs nfc-access | grep "api-docs"
```

### Métricas Importantes

1. **Tiempo de carga** de Swagger UI
2. **Errores 404** en recursos estáticos
3. **Redirecciones** en logs de acceso
4. **Errores JavaScript** en console del navegador

## ✅ Checklist de Verificación

- [ ] Backend reiniciado correctamente
- [ ] Script de verificación pasa todas las pruebas
- [ ] Swagger UI carga en `https://api.bonaventurecclub.com/nfc_access/api-docs/`
- [ ] No hay redirección a `https://api.bonaventurecclub.com/api-docs/`
- [ ] Recursos CSS/JS cargan correctamente
- [ ] No hay errores en console del navegador
- [ ] Funcionalidad "Try it out" funciona
- [ ] URLs generadas incluyen `/nfc_access`

## 🎉 Resultado Esperado

Después de implementar esta solución:

1. **Swagger UI cargará directamente** en `https://api.bonaventurecclub.com/nfc_access/api-docs/`
2. **No habrá redirecciones** fuera del prefijo `/nfc_access`
3. **Toda la funcionalidad** de Swagger UI funcionará correctamente
4. **Los desarrolladores** podrán usar la documentación sin problemas
5. **El sistema será robusto** contra futuras redirecciones

## 🔄 Rollback (Si es Necesario)

Si necesitas revertir a la configuración anterior:

1. **Descomentar** la línea en `server.js`:
   ```javascript
   app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, swaggerOptions));
   ```

2. **Comentar** las líneas del middleware personalizado:
   ```javascript
   // app.use('/api-docs', swaggerUIFix(basePath));
   // app.use('/api-docs', oauth2RedirectHandler(basePath));
   ```

3. **Reiniciar** el backend

---

**¡La solución específica para redirecciones está implementada y lista para probar! 🚀**
