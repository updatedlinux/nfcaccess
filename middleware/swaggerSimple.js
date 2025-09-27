/**
 * Middleware simple para corregir URLs de Swagger UI Express
 * Sin JavaScript problemático, solo corrección de URLs
 */

/**
 * Middleware simple para corregir URLs en respuestas HTML
 */
function swaggerSimpleFix(basePath = '') {
    return function(req, res, next) {
        // Solo aplicar a rutas de Swagger UI
        if (req.path.startsWith('/api-docs')) {
            // Interceptar la respuesta HTML
            const originalSend = res.send;
            
            res.send = function(data) {
                if (typeof data === 'string' && data.includes('swagger-ui')) {
                    // Corregir URLs en el HTML de manera simple
                    let correctedData = data;
                    
                    // Corregir URL del JSON de Swagger
                    correctedData = correctedData.replace(
                        /url:\s*['"]\/api-docs\/swagger\.json['"]/g,
                        `url: '${basePath}/api-docs/swagger.json'`
                    );
                    
                    // Corregir URL de OAuth2 redirect
                    correctedData = correctedData.replace(
                        /oauth2RedirectUrl:\s*['"]\/api-docs\/oauth2-redirect\.html['"]/g,
                        `oauth2RedirectUrl: '${basePath}/api-docs/oauth2-redirect.html'`
                    );
                    
                    // Corregir URLs de servidores
                    correctedData = correctedData.replace(
                        /url:\s*['"]\/['"]/g,
                        `url: '${basePath}'`
                    );
                    
                    // Corregir URLs de recursos estáticos
                    correctedData = correctedData.replace(
                        /href="\/api-docs\/([^"]*)"/g,
                        `href="${basePath}/api-docs/$1"`
                    );
                    
                    correctedData = correctedData.replace(
                        /src="\/api-docs\/([^"]*)"/g,
                        `src="${basePath}/api-docs/$1"`
                    );
                    
                    return originalSend.call(this, correctedData);
                }
                
                return originalSend.call(this, data);
            };
        }
        
        next();
    };
}

/**
 * Handler simple para OAuth2 redirect
 */
function oauth2RedirectSimple(basePath = '') {
    return function(req, res, next) {
        if (req.path === '/oauth2-redirect.html') {
            const oauth2Html = `<!DOCTYPE html>
<html lang="en-US">
<head>
    <title>Swagger UI: OAuth2 Redirect</title>
</head>
<body>
<script>
    'use strict';
    function run () {
        var oauth2 = window.opener.swaggerUIRedirectOauth2;
        oauth2.auth.callback(window.location.href);
        window.close();
    }
    if (document.readyState === 'complete') {
        run();
    } else {
        window.addEventListener('load', run);
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
    swaggerSimpleFix,
    oauth2RedirectSimple
};
