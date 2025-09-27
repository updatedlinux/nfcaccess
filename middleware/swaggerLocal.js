/**
 * Middleware para servir Swagger UI con recursos locales
 * Evita problemas de CSP con recursos externos
 */

const path = require('path');
const fs = require('fs');

/**
 * Middleware para servir Swagger UI con recursos locales
 */
function swaggerUILocal(basePath = '') {
    return function(req, res, next) {
        // Solo aplicar a la ruta raíz de api-docs
        if (req.path === '/' || req.path === '') {
            const swaggerHtml = generateLocalSwaggerHTML(basePath);
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
            res.send(swaggerHtml);
            return;
        }
        
        next();
    };
}

/**
 * Generar HTML con recursos locales de Swagger UI
 */
function generateLocalSwaggerHTML(basePath) {
    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NFC Access API - Documentación</title>
    <style>
        html { 
            box-sizing: border-box; 
            overflow: -moz-scrollbars-vertical; 
            overflow-y: scroll; 
        }
        *, *:before, *:after { 
            box-sizing: inherit; 
        }
        body { 
            margin: 0; 
            background: #fafafa; 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }
        .swagger-ui .topbar { 
            display: none; 
        }
        .loading-container {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 200px;
            font-size: 18px;
            color: #3b4151;
        }
        .error-container {
            display: none;
            padding: 20px;
            background: #ffe6e6;
            border: 1px solid #ff6b6b;
            border-radius: 4px;
            margin: 20px;
            color: #d63031;
        }
        .debug-info {
            position: fixed;
            top: 10px;
            right: 10px;
            background: #333;
            color: white;
            padding: 10px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 9999;
        }
        /* Estilos básicos de Swagger UI */
        .swagger-ui {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }
        .swagger-ui .info {
            margin: 50px 0;
        }
        .swagger-ui .info .title {
            color: #3b4151;
            font-size: 36px;
            font-weight: 600;
            margin: 0 0 10px 0;
        }
        .swagger-ui .info .description {
            color: #3b4151;
            font-size: 16px;
            margin: 0 0 20px 0;
        }
        .swagger-ui .scheme-container {
            background: #f7f7f7;
            border-radius: 4px;
            padding: 10px;
            margin: 20px 0;
        }
        .swagger-ui .opblock {
            border: 1px solid #e0e0e0;
            border-radius: 4px;
            margin: 10px 0;
            background: white;
        }
        .swagger-ui .opblock .opblock-summary {
            padding: 15px;
            cursor: pointer;
            border-bottom: 1px solid #e0e0e0;
        }
        .swagger-ui .opblock .opblock-summary:hover {
            background: #f5f5f5;
        }
        .swagger-ui .opblock .opblock-summary-description {
            color: #3b4151;
            font-size: 14px;
        }
        .swagger-ui .opblock .opblock-summary-path {
            font-weight: 600;
            color: #3b4151;
        }
        .swagger-ui .opblock .opblock-summary-method {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
            margin-right: 10px;
        }
        .swagger-ui .opblock.opblock-post .opblock-summary-method {
            background: #49cc90;
            color: white;
        }
        .swagger-ui .opblock.opblock-get .opblock-summary-method {
            background: #61affe;
            color: white;
        }
        .swagger-ui .opblock.opblock-put .opblock-summary-method {
            background: #fca130;
            color: white;
        }
        .swagger-ui .opblock.opblock-delete .opblock-summary-method {
            background: #f93e3e;
            color: white;
        }
    </style>
</head>
<body>
    <div class="debug-info" id="debug-info">
        Cargando documentación...
    </div>
    
    <div id="swagger-ui">
        <div class="loading-container">
            <div>Cargando documentación de la API...</div>
        </div>
    </div>
    
    <div id="error-container" class="error-container">
        <strong>Error:</strong> <span id="error-message"></span>
    </div>
    
    <script>
        // Función para actualizar debug info
        function updateDebug(message) {
            const debugEl = document.getElementById('debug-info');
            if (debugEl) {
                debugEl.textContent = message;
            }
            console.log(message);
        }
        
        // Función para cargar Swagger UI sin dependencias externas
        function loadSwaggerUI() {
            updateDebug('Cargando JSON de Swagger...');
            
            fetch('/api-docs/swagger.json')
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Error al cargar JSON: ' + response.status);
                    }
                    return response.json();
                })
                .then(swaggerData => {
                    updateDebug('JSON cargado, renderizando UI...');
                    renderSwaggerUI(swaggerData);
                })
                .catch(error => {
                    updateDebug('Error: ' + error.message);
                    document.getElementById('error-container').style.display = 'block';
                    document.getElementById('error-message').textContent = 'Error al cargar la documentación: ' + error.message;
                });
        }
        
        // Función para renderizar Swagger UI manualmente
        function renderSwaggerUI(data) {
            const container = document.getElementById('swagger-ui');
            
            // Crear estructura básica
            const html = \`
                <div class="swagger-ui">
                    <div class="info">
                        <h1 class="title">\${data.info.title}</h1>
                        <p class="description">\${data.info.description}</p>
                        <div class="scheme-container">
                            <strong>Versión:</strong> \${data.info.version}<br>
                            <strong>Servidor:</strong> \${data.servers[0].url}
                        </div>
                    </div>
                    
                    <div class="operations">
                        <h2>Endpoints Disponibles</h2>
                        \${renderEndpoints(data.paths)}
                    </div>
                </div>
            \`;
            
            container.innerHTML = html;
            updateDebug('✅ Documentación cargada exitosamente');
            document.getElementById('debug-info').style.display = 'none';
        }
        
        // Función para renderizar endpoints
        function renderEndpoints(paths) {
            let html = '';
            
            for (const [path, methods] of Object.entries(paths)) {
                for (const [method, details] of Object.entries(methods)) {
                    html += \`
                        <div class="opblock opblock-\${method}">
                            <div class="opblock-summary">
                                <span class="opblock-summary-method">\${method.toUpperCase()}</span>
                                <span class="opblock-summary-path">\${path}</span>
                                <div class="opblock-summary-description">\${details.summary || 'Sin descripción'}</div>
                            </div>
                        </div>
                    \`;
                }
            }
            
            return html;
        }
        
        // Inicializar cuando el DOM esté listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', loadSwaggerUI);
        } else {
            loadSwaggerUI();
        }
    </script>
</body>
</html>`;
}

module.exports = {
    swaggerUILocal
};
