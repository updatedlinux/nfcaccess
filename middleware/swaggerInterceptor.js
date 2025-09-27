/**
 * Middleware para interceptar y corregir URLs de Swagger UI Express
 * Asegura que todas las URLs incluyan el prefijo correcto
 */

/**
 * Middleware para interceptar respuestas de Swagger UI y corregir URLs
 */
function swaggerInterceptor(basePath = '') {
    return function(req, res, next) {
        // Solo aplicar a rutas de Swagger UI
        if (req.path.startsWith('/api-docs')) {
            // Interceptar la respuesta HTML
            const originalSend = res.send;
            
            res.send = function(data) {
                if (typeof data === 'string' && data.includes('swagger-ui')) {
                    // Corregir URLs en el HTML
                    let correctedData = data;
                    
                    // Corregir URLs de recursos estáticos
                    correctedData = correctedData.replace(
                        /href="([^"]*swagger-ui[^"]*)"/g,
                        (match, url) => {
                            if (!url.startsWith('http') && !url.startsWith('/')) {
                                return `href="${basePath}/api-docs/${url}"`;
                            } else if (url.startsWith('/api-docs/') && !url.includes(basePath)) {
                                return `href="${basePath}${url}"`;
                            }
                            return match;
                        }
                    );
                    
                    correctedData = correctedData.replace(
                        /src="([^"]*swagger-ui[^"]*)"/g,
                        (match, url) => {
                            if (!url.startsWith('http') && !url.startsWith('/')) {
                                return `src="${basePath}/api-docs/${url}"`;
                            } else if (url.startsWith('/api-docs/') && !url.includes(basePath)) {
                                return `src="${basePath}${url}"`;
                            }
                            return match;
                        }
                    );
                    
                    // Corregir URLs en JavaScript
                    correctedData = correctedData.replace(
                        /url:\s*['"]\/api-docs\/swagger\.json['"]/g,
                        `url: '${basePath}/api-docs/swagger.json'`
                    );
                    
                    correctedData = correctedData.replace(
                        /url:\s*['"]\/api-docs\/oauth2-redirect\.html['"]/g,
                        `url: '${basePath}/api-docs/oauth2-redirect.html'`
                    );
                    
                    // Corregir URLs de servidores
                    correctedData = correctedData.replace(
                        /url:\s*['"]\/['"]/g,
                        `url: '${basePath}'`
                    );
                    
                    // Agregar script para corregir URLs dinámicamente
                    const scriptCorrection = `
                    <script>
                        // Corregir URLs dinámicamente
                        (function() {
                            const basePath = '${basePath}';
                            
                            // Interceptar fetch requests
                            const originalFetch = window.fetch;
                            window.fetch = function(url, options) {
                                if (typeof url === 'string' && url.includes('/api-docs/') && !url.includes(basePath)) {
                                    url = basePath + url;
                                }
                                return originalFetch(url, options);
                            };
                            
                            // Interceptar XMLHttpRequest
                            const originalXHROpen = XMLHttpRequest.prototype.open;
                            XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
                                if (typeof url === 'string' && url.includes('/api-docs/') && !url.includes(basePath)) {
                                    url = basePath + url;
                                }
                                return originalXHROpen.call(this, method, url, async, user, password);
                            };
                            
                            // Corregir URLs en el DOM después de que se cargue
                            document.addEventListener('DOMContentLoaded', function() {
                                // Corregir enlaces
                                const links = document.querySelectorAll('a[href*="/api-docs/"]');
                                links.forEach(link => {
                                    if (!link.href.includes(basePath)) {
                                        link.href = basePath + link.href;
                                    }
                                });
                                
                                // Corregir formularios
                                const forms = document.querySelectorAll('form[action*="/api-docs/"]');
                                forms.forEach(form => {
                                    if (!form.action.includes(basePath)) {
                                        form.action = basePath + form.action;
                                    }
                                });
                            });
                        })();
                    </script>`;
                    
                    // Insertar el script antes del cierre del body
                    correctedData = correctedData.replace('</body>', scriptCorrection + '</body>');
                    
                    return originalSend.call(this, correctedData);
                }
                
                return originalSend.call(this, data);
            };
        }
        
        next();
    };
}

module.exports = {
    swaggerInterceptor
};
