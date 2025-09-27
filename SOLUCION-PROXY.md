# Solución para Proxy Inverso con Swagger UI

## 🎯 Problema Resuelto

El problema de redirección de Swagger UI desde `https://api.bonaventurecclub.com/nfc_access/api-docs/` a `https://api.bonaventurecclub.com/api-docs/` ha sido solucionado mediante:

1. **Configuración del backend** para detectar el proxy inverso
2. **Configuración de Nginx Proxy Manager** correcta
3. **Middlewares específicos** para manejar el prefijo `/nfc_access`
4. **Script de verificación** para probar la configuración

## 🚀 Pasos para Implementar la Solución

### 1. Actualizar el Backend

Los archivos modificados ya están listos:

- ✅ `config/swagger.js` - Configuración de Swagger con detección de entorno
- ✅ `server.js` - Servidor con middlewares de proxy inverso
- ✅ `middleware/proxyHandler.js` - Middlewares específicos para proxy

### 2. Configurar Nginx Proxy Manager

Usar la configuración avanzada en el archivo `nginx-proxy-config.md`:

```nginx
location /nfc_access/ {
    proxy_pass http://10.200.1.233:5000/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Port $server_port;
    proxy_set_header X-Forwarded-Prefix /nfc_access;
    proxy_set_header X-Original-URI $request_uri;
    
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
    
    proxy_buffering on;
    proxy_buffer_size 4k;
    proxy_buffers 8 4k;
}

location = /nfc_access {
    return 301 $scheme://$host/nfc_access/;
}
```

### 3. Configurar Variables de Entorno

Asegúrate de que en tu archivo `.env` tengas:

```env
NODE_ENV=production
```

### 4. Reiniciar Servicios

```bash
# Reiniciar el backend
pm2 restart nfc-access
# O si usas systemd
sudo systemctl restart nfc-access

# Recargar configuración de Nginx
sudo nginx -s reload
```

## 🔍 Verificación de la Solución

### Usar el Script de Verificación

```bash
# Verificar configuración de producción
node scripts/test-proxy.js production

# Verificar configuración de desarrollo
node scripts/test-proxy.js development
```

### Verificación Manual

1. **Acceder a la documentación**:
   - `https://api.bonaventurecclub.com/nfc_access/api-docs/`

2. **Verificar que no haya redirecciones**:
   - La URL debe mantenerse con el prefijo `/nfc_access`
   - No debe redirigir a `/api-docs/` sin prefijo

3. **Verificar recursos estáticos**:
   - Los archivos CSS y JS deben cargar correctamente
   - No debe haber errores 404 en la consola del navegador

4. **Probar endpoints**:
   - Los botones "Try it out" deben funcionar
   - Las URLs generadas deben incluir el prefijo `/nfc_access`

## 🛠️ Cambios Técnicos Implementados

### Backend (Node.js + Express)

1. **Detección automática de entorno**:
   - Detecta si está en producción (`NODE_ENV=production`)
   - Configura automáticamente el `basePath` para Swagger

2. **Middlewares de proxy inverso**:
   - `proxyHandler`: Maneja headers de proxy inverso
   - `swaggerProxyHandler`: Configuración específica para Swagger UI
   - `swaggerCorsHandler`: Manejo de CORS para Swagger
   - `swaggerStaticHandler`: Cache para recursos estáticos

3. **Configuración de Swagger UI**:
   - URLs relativas correctas
   - Recursos estáticos desde CDN
   - Configuración de validación deshabilitada

### Nginx Proxy Manager

1. **Headers de proxy correctos**:
   - `X-Forwarded-Prefix`: Para que el backend sepa el prefijo
   - `X-Forwarded-Proto`: Para HTTPS correcto
   - `X-Forwarded-Host`: Para el host correcto

2. **Manejo de rutas**:
   - Redirección de `/nfc_access` a `/nfc_access/`
   - Proxy sin barra final para evitar problemas

3. **Configuración de recursos estáticos**:
   - Cache apropiado para archivos CSS/JS
   - Headers de CORS correctos

## 🐛 Solución de Problemas

### Problema: Swagger UI sigue redirigiendo incorrectamente

**Solución**:
1. Verificar que `NODE_ENV=production` esté configurado
2. Verificar que los headers `X-Forwarded-Prefix` estén configurados
3. Limpiar caché del navegador
4. Reiniciar el backend

### Problema: Recursos estáticos (CSS/JS) no cargan

**Solución**:
1. Verificar configuración de recursos estáticos en Nginx
2. Verificar que el CDN de Swagger UI esté accesible
3. Revisar logs de Nginx para errores 404

### Problema: Errores de CORS

**Solución**:
1. Verificar configuración de CORS en el backend
2. Verificar headers de CORS en Nginx
3. Verificar que no haya bloqueos de firewall

### Problema: Timeouts

**Solución**:
1. Aumentar timeouts en Nginx
2. Verificar conectividad entre Nginx y el backend
3. Revisar logs de error

## 📊 Monitoreo

### Logs Importantes

```bash
# Logs del backend
pm2 logs nfc-access

# Logs de Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Logs de error específicos
sudo grep "nfc_access" /var/log/nginx/error.log
```

### Métricas a Monitorear

1. **Tiempo de respuesta** de `/api-docs/`
2. **Errores 404** en recursos estáticos
3. **Redirecciones** incorrectas
4. **Uso de memoria** del backend

## ✅ Checklist de Verificación

- [ ] Backend configurado con `NODE_ENV=production`
- [ ] Nginx Proxy Manager configurado con headers correctos
- [ ] Swagger UI carga en `https://api.bonaventurecclub.com/nfc_access/api-docs/`
- [ ] No hay redirecciones a `/api-docs/` sin prefijo
- [ ] Recursos estáticos (CSS/JS) cargan correctamente
- [ ] Botones "Try it out" funcionan
- [ ] URLs generadas incluyen el prefijo `/nfc_access`
- [ ] Script de verificación pasa todas las pruebas

## 🎉 Resultado Esperado

Después de implementar esta solución:

1. **Swagger UI funcionará correctamente** en `https://api.bonaventurecclub.com/nfc_access/api-docs/`
2. **No habrá redirecciones incorrectas** fuera del prefijo `/nfc_access`
3. **Todos los recursos estáticos** se servirán correctamente
4. **Los endpoints de la API** funcionarán con el prefijo correcto
5. **La documentación será completamente funcional** para desarrolladores

## 📞 Soporte

Si encuentras problemas después de implementar esta solución:

1. Ejecuta el script de verificación: `node scripts/test-proxy.js production`
2. Revisa los logs del backend y Nginx
3. Verifica la configuración paso a paso
4. Contacta al equipo de desarrollo si persisten los problemas

---

**¡La solución está lista para implementar! 🚀**
