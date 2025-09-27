# Configuración Nginx Proxy Manager para NFC Access

## Problema Identificado

La configuración actual de Nginx Proxy Manager está causando que Swagger UI redirija incorrectamente a `https://api.bonaventurecclub.com/api-docs/` en lugar de mantener el prefijo `/nfc_access`.

## Configuración Correcta

### 1. Configuración Principal en Nginx Proxy Manager

En la interfaz web de Nginx Proxy Manager, para el dominio `api.bonaventurecclub.com`, usar la siguiente configuración:

#### Configuración Avanzada (Advanced Tab)

```nginx
# Configuración para manejar el prefijo /nfc_access correctamente
location /nfc_access/ {
    # Remover la barra final del proxy_pass para evitar problemas de redirección
    proxy_pass http://10.200.1.233:5000/;
    
    # Headers esenciales para proxy inverso
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Port $server_port;
    
    # Headers adicionales para Swagger UI
    proxy_set_header X-Forwarded-Prefix /nfc_access;
    proxy_set_header X-Original-URI $request_uri;
    
    # Configuración de timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
    
    # Buffer settings para mejor rendimiento
    proxy_buffering on;
    proxy_buffer_size 4k;
    proxy_buffers 8 4k;
    
    # Manejo de errores
    proxy_intercept_errors off;
    
    # Headers de respuesta
    proxy_hide_header X-Powered-By;
    add_header X-Proxy-Cache $upstream_cache_status;
}

# Redirección para /nfc_access sin barra final
location = /nfc_access {
    return 301 $scheme://$host/nfc_access/;
}

# Manejo específico para recursos estáticos de Swagger UI
location ~* ^/nfc_access/api-docs/(.*\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot))$ {
    proxy_pass http://10.200.1.233:5000/api-docs/$1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # Cache para recursos estáticos
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# Manejo específico para el JSON de Swagger
location = /nfc_access/api-docs/swagger.json {
    proxy_pass http://10.200.1.233:5000/api-docs/swagger.json;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # Headers específicos para JSON
    add_header Content-Type application/json;
    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
    add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With";
}
```

### 2. Configuración Alternativa (Si la anterior no funciona)

Si la configuración anterior presenta problemas, usar esta configuración más simple:

```nginx
# Configuración simplificada
location /nfc_access {
    proxy_pass http://10.200.1.233:5000/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Prefix /nfc_access;
    
    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
    
    # Buffer settings
    proxy_buffering on;
    proxy_buffer_size 4k;
    proxy_buffers 8 4k;
}
```

### 3. Configuración de SSL (Si aplica)

Si estás usando SSL, asegúrate de que la configuración incluya:

```nginx
# Headers de seguridad
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Content-Type-Options nosniff;
add_header X-Frame-Options DENY;
add_header X-XSS-Protection "1; mode=block";

# Manejo de HTTPS
proxy_redirect http:// https://;
```

## Pasos para Aplicar la Configuración

### 1. Acceder a Nginx Proxy Manager
- Ir a la interfaz web de Nginx Proxy Manager
- Buscar el dominio `api.bonaventurecclub.com`
- Editar la configuración

### 2. Aplicar la Configuración
- Copiar la configuración avanzada en el tab "Advanced"
- Guardar los cambios
- Reiniciar Nginx si es necesario

### 3. Verificar la Configuración
```bash
# Verificar que Nginx esté funcionando
sudo nginx -t

# Recargar configuración
sudo nginx -s reload
```

## Verificación de Funcionamiento

### 1. Probar URLs
- `https://api.bonaventurecclub.com/nfc_access/` - Debe mostrar la información de la API
- `https://api.bonaventurecclub.com/nfc_access/api-docs/` - Debe cargar Swagger UI
- `https://api.bonaventurecclub.com/nfc_access/api-docs/swagger.json` - Debe servir el JSON

### 2. Verificar Headers
```bash
# Verificar headers de respuesta
curl -I https://api.bonaventurecclub.com/nfc_access/api-docs/

# Verificar que no haya redirecciones incorrectas
curl -L https://api.bonaventurecclub.com/nfc_access/api-docs/
```

### 3. Verificar Recursos Estáticos
- Los archivos CSS y JS de Swagger UI deben cargar sin errores 404
- No debe haber errores de CORS en la consola del navegador
- Los recursos deben servirse desde `/nfc_access/api-docs/`

## Solución de Problemas

### Problema: Swagger UI redirige a `/api-docs/` sin prefijo
**Solución**: Verificar que `proxy_set_header X-Forwarded-Prefix /nfc_access;` esté configurado

### Problema: Recursos estáticos (CSS/JS) no cargan
**Solución**: Usar la configuración específica para recursos estáticos

### Problema: Errores 404 en recursos
**Solución**: Verificar que `proxy_pass` no tenga barra final y que la configuración de location sea correcta

### Problema: Timeouts
**Solución**: Aumentar los valores de timeout en la configuración

## Configuración de Desarrollo vs Producción

### Variables de Entorno
Asegúrate de que en tu archivo `.env` tengas:

```env
# Para producción
NODE_ENV=production

# Para desarrollo
NODE_ENV=development
```

### Backend
El backend detectará automáticamente el entorno y configurará Swagger UI apropiadamente.

## Notas Importantes

1. **Sin barra final en proxy_pass**: Es crucial que `proxy_pass` termine sin `/` para evitar problemas de redirección
2. **Headers de proxy**: Los headers `X-Forwarded-*` son esenciales para que el backend sepa que está detrás de un proxy
3. **Cache de recursos estáticos**: Los recursos de Swagger UI se pueden cachear para mejor rendimiento
4. **CORS**: Si hay problemas de CORS, verificar que el backend tenga CORS configurado correctamente

## Monitoreo

### Logs de Nginx
```bash
# Ver logs de acceso
tail -f /var/log/nginx/access.log

# Ver logs de error
tail -f /var/log/nginx/error.log
```

### Logs del Backend
```bash
# Ver logs del servidor Node.js
pm2 logs nfc-access

# O si usas systemd
journalctl -u nfc-access -f
```
