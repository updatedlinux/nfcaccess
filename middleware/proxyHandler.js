/**
 * Middleware para manejar correctamente el proxy inverso
 * Configura headers y rutas para Swagger UI
 */

/**
 * Middleware para configurar el proxy inverso
 */
function proxyHandler(req, res, next) {
    // Detectar si estamos detrás de un proxy inverso
    const isBehindProxy = req.headers['x-forwarded-for'] || req.headers['x-forwarded-proto'];
    
    if (isBehindProxy) {
        // Configurar protocolo correcto
        if (req.headers['x-forwarded-proto']) {
            req.protocol = req.headers['x-forwarded-proto'];
        }
        
        // Configurar host correcto
        if (req.headers['x-forwarded-host']) {
            req.hostname = req.headers['x-forwarded-host'];
        }
        
        // Configurar puerto correcto
        if (req.headers['x-forwarded-port']) {
            req.port = req.headers['x-forwarded-port'];
        }
        
        // Configurar prefijo de ruta
        if (req.headers['x-forwarded-prefix']) {
            req.basePath = req.headers['x-forwarded-prefix'];
        }
        
        // Configurar URL base completa
        req.baseUrl = `${req.protocol}://${req.hostname}${req.basePath || ''}`;
    }
    
    next();
}

/**
 * Middleware específico para Swagger UI
 */
function swaggerProxyHandler(req, res, next) {
    // Solo aplicar a rutas de Swagger
    if (req.path.startsWith('/api-docs')) {
        // Configurar headers de respuesta para Swagger UI
        res.setHeader('X-Frame-Options', 'SAMEORIGIN');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        
        // Configurar base path para recursos estáticos
        if (req.basePath) {
            res.locals.swaggerBasePath = req.basePath;
        }
    }
    
    next();
}

/**
 * Middleware para manejar recursos estáticos de Swagger UI
 */
function swaggerStaticHandler(req, res, next) {
    // Manejar recursos estáticos de Swagger UI
    if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
        // Configurar headers de cache para recursos estáticos
        res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 año
        res.setHeader('Expires', new Date(Date.now() + 31536000000).toUTCString());
    }
    
    next();
}

/**
 * Middleware para configurar CORS para Swagger UI
 */
function swaggerCorsHandler(req, res, next) {
    // Solo aplicar a rutas de Swagger
    if (req.path.startsWith('/api-docs')) {
        // Configurar CORS para Swagger UI
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        
        // Manejar preflight requests
        if (req.method === 'OPTIONS') {
            res.status(200).end();
            return;
        }
    }
    
    next();
}

/**
 * Middleware para generar URLs correctas en respuestas JSON
 */
function urlGenerator(req, res, next) {
    // Función helper para generar URLs correctas
    res.locals.generateUrl = function(path) {
        const basePath = req.basePath || '';
        const protocol = req.protocol || 'http';
        const host = req.hostname || req.get('host');
        
        return `${protocol}://${host}${basePath}${path}`;
    };
    
    next();
}

module.exports = {
    proxyHandler,
    swaggerProxyHandler,
    swaggerStaticHandler,
    swaggerCorsHandler,
    urlGenerator
};
