/**
 * Middleware específico para corregir problemas de redirección de Swagger UI
 * con proxy inverso
 */

/**
 * Middleware para servir Swagger UI con URLs corregidas
 */
function swaggerUIFix(basePath = '') {
    return function(req, res, next) {
        // Solo aplicar a la ruta raíz de api-docs
        if (req.path === '/' || req.path === '') {
            const swaggerHtml = generateSwaggerHTML(basePath);
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
 * Generar HTML personalizado para Swagger UI
 */
function generateSwaggerHTML(basePath) {
    // Usar URL relativa para evitar problemas de CORS
    const swaggerJsonUrl = '/api-docs/swagger.json';
    const oauth2RedirectUrl = '/api-docs/oauth2-redirect.html';
    
    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NFC Access API - Documentación</title>
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui.css" />
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
    </style>
</head>
<body>
    <div id="swagger-ui">
        <div class="loading-container">
            <div>Cargando documentación de la API...</div>
        </div>
    </div>
    <div id="error-container" class="error-container">
        <strong>Error:</strong> <span id="error-message"></span>
    </div>
    
    <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-standalone-preset.js"></script>
    <script>
        // Configuración simplificada de Swagger UI
        window.onload = function() {
            try {
                console.log('Iniciando Swagger UI...');
                
                const ui = SwaggerUIBundle({
                    url: '${swaggerJsonUrl}',
                    dom_id: '#swagger-ui',
                    deepLinking: true,
                    presets: [
                        SwaggerUIBundle.presets.apis,
                        SwaggerUIStandalonePreset
                    ],
                    plugins: [
                        SwaggerUIBundle.plugins.DownloadUrl
                    ],
                    layout: "StandaloneLayout",
                    validatorUrl: null,
                    oauth2RedirectUrl: '${oauth2RedirectUrl}',
                    persistAuthorization: true,
                    servers: [
                        {
                            url: '${basePath}',
                            description: 'Servidor actual'
                        }
                    ],
                    onComplete: function() {
                        console.log('Swagger UI cargado correctamente');
                    },
                    onFailure: function(data) {
                        console.error('Error al cargar Swagger UI:', data);
                        document.getElementById('error-container').style.display = 'block';
                        document.getElementById('error-message').textContent = 'Error al cargar la documentación de la API: ' + JSON.stringify(data);
                    }
                });
                
            } catch (error) {
                console.error('Error al inicializar Swagger UI:', error);
                document.getElementById('error-container').style.display = 'block';
                document.getElementById('error-message').textContent = 'Error al inicializar la documentación: ' + error.message;
            }
        };
    </script>
</body>
</html>`;
}

/**
 * Middleware para manejar oauth2 redirect
 */
function oauth2RedirectHandler(basePath = '') {
    return function(req, res, next) {
        if (req.path === '/oauth2-redirect.html') {
            const oauth2Html = `
<!DOCTYPE html>
<html>
<head>
    <title>OAuth2 Redirect</title>
</head>
<body>
    <script>
        // Manejar redirección OAuth2
        if (window.opener) {
            window.opener.postMessage({
                type: 'oauth2-redirect',
                data: window.location.search
            }, '*');
            window.close();
        }
    </script>
</body>
</html>`;
            
            res.setHeader('Content-Type', 'text/html');
            res.send(oauth2Html);
            return;
        }
        
        next();
    };
}

module.exports = {
    swaggerUIFix,
    oauth2RedirectHandler,
    generateSwaggerHTML
};
