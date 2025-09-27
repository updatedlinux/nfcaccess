const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

// Importar configuración y utilidades
const { testConnection } = require('./config/database');
const { specs: swaggerSpecs, basePath } = require('./config/swagger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { 
    proxyHandler, 
    swaggerProxyHandler, 
    swaggerStaticHandler, 
    swaggerCorsHandler,
    urlGenerator 
} = require('./middleware/proxyHandler');
const { 
    swaggerUIFix, 
    oauth2RedirectHandler 
} = require('./middleware/swaggerFix');
const { 
    swaggerUILocal 
} = require('./middleware/swaggerLocal');
const { 
    swaggerInterceptor 
} = require('./middleware/swaggerInterceptor');

// Importar rutas
const cardsRoutes = require('./routes/cards');
const accessRoutes = require('./routes/access');

const app = express();
const PORT = process.env.PORT || 5000;

// Configurar Express para trabajar con proxy inverso
app.set('trust proxy', true);

// Configuración de seguridad con CSP personalizado para Swagger UI
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
            connectSrc: ["'self'", "https://unpkg.com"],
            imgSrc: ["'self'", "data:", "https:"],
            fontSrc: ["'self'", "https:", "data:"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
        },
    },
}));

// Configuración de CORS - abierto para integración
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: false
}));

// Rate limiting con configuración específica para proxy inverso
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 1000, // máximo 1000 requests por ventana
    message: {
        success: false,
        message: 'Demasiadas solicitudes desde esta IP, intente nuevamente más tarde'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Configuración específica para proxy inverso
    trustProxy: 1, // Solo confiar en el primer proxy
    skip: (req) => {
        // Saltar rate limiting para requests de salud y documentación
        return req.path === '/health' || req.path.startsWith('/api-docs');
    }
});
app.use(limiter);

// Middleware para parsing de JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware para manejar proxy inverso
app.use(proxyHandler);
app.use(urlGenerator);

// Middleware para logging de requests
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} - ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
    next();
});

// Ruta de salud del sistema
app.get('/health', async (req, res) => {
    try {
        const dbStatus = await testConnection();
        res.json({
            success: true,
            message: 'Sistema funcionando correctamente',
            data: {
                timestamp: new Date().toISOString(),
                database: dbStatus ? 'conectado' : 'desconectado',
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                version: process.version
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error en el sistema',
            error: error.message
        });
    }
});

// Configurar Swagger UI para trabajar con proxy inverso
const swaggerOptions = {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'NFC Access API - Documentación',
    swaggerOptions: {
        docExpansion: 'list',
        filter: true,
        showRequestHeaders: true,
        showCommonExtensions: true,
        // Configuración específica para proxy inverso
        url: basePath ? `${basePath}/api-docs/swagger.json` : '/api-docs/swagger.json',
        validatorUrl: null, // Deshabilitar validación externa
        // Configurar URLs base para recursos estáticos
        deepLinking: true,
        displayRequestDuration: true,
        tryItOutEnabled: true,
        // Configuración crítica para proxy inverso
        oauth2RedirectUrl: basePath ? `${basePath}/api-docs/oauth2-redirect.html` : '/api-docs/oauth2-redirect.html',
        // Deshabilitar redirecciones automáticas
        persistAuthorization: true,
        // Configurar servidor base
        servers: [
            {
                url: basePath || '',
                description: 'Servidor actual'
            }
        ],
        // Configuración adicional para funcionalidad completa
        supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
        onComplete: function() {
            console.log('Swagger UI cargado correctamente');
        },
        onFailure: function(data) {
            console.error('Error al cargar Swagger UI:', data);
        }
    }
};

// Middleware específico para Swagger UI
app.use('/api-docs', swaggerCorsHandler);
app.use('/api-docs', swaggerProxyHandler);
app.use('/api-docs', swaggerStaticHandler);

// Middleware para interceptar y corregir URLs de Swagger UI
app.use('/api-docs', swaggerInterceptor(basePath));

// Middleware para interceptar y corregir redirecciones de Swagger UI
app.use('/api-docs', swaggerUIFix(basePath));
app.use('/api-docs', oauth2RedirectHandler(basePath));

// Servir el JSON de Swagger
app.get('/api-docs/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(swaggerSpecs);
});

// Documentación Swagger UI con configuración completa
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, swaggerOptions));

// Ruta raíz con información de la API
app.get('/', (req, res) => {
    const apiPrefix = basePath || '';
    
    res.json({
        success: true,
        message: 'API NFC Access - Sistema de gestión de acceso vehicular',
        version: '1.0.0',
        documentation: `${apiPrefix}/api-docs`,
        health: `${apiPrefix}/health`,
        swaggerJson: `${apiPrefix}/api-docs/swagger.json`,
        basePath: apiPrefix,
        endpoints: {
            cards: {
                register: `POST ${apiPrefix}/cards/register`,
                getByUser: `GET ${apiPrefix}/cards/:wp_user_id`,
                getOwner: `GET ${apiPrefix}/cards/owner/:card_uid`,
                search: `GET ${apiPrefix}/cards/search`,
                deactivate: `PUT ${apiPrefix}/cards/deactivate/:card_uid`
            },
            access: {
                log: `POST ${apiPrefix}/access/log`,
                getLogs: `GET ${apiPrefix}/access/logs/:wp_user_id`,
                getStats: `GET ${apiPrefix}/access/stats/:wp_user_id`,
                getLastAccess: `GET ${apiPrefix}/access/last/:card_uid`,
                getTodaySummary: `GET ${apiPrefix}/access/today-summary`
            }
        }
    });
});

// Rutas de la API
app.use('/cards', cardsRoutes);
app.use('/access', accessRoutes);

// Middleware para manejar rutas no encontradas
app.use(notFoundHandler);

// Middleware para manejo de errores
app.use(errorHandler);

// Función para iniciar el servidor
async function startServer() {
    try {
        // Probar conexión a la base de datos
        console.log('🔍 Probando conexión a la base de datos...');
        const dbConnected = await testConnection();
        
        if (!dbConnected) {
            console.error('❌ No se pudo conectar a la base de datos. Verifique la configuración.');
            process.exit(1);
        }
        
        // Iniciar servidor
        app.listen(PORT, () => {
            console.log('🚀 Servidor NFC Access iniciado exitosamente');
            console.log(`📡 Puerto: ${PORT}`);
            console.log(`🌐 URL: http://localhost:${PORT}`);
            console.log(`📚 Documentación: http://localhost:${PORT}/api-docs`);
            console.log(`❤️  Salud: http://localhost:${PORT}/health`);
            console.log('⏰ Zona horaria: GMT-4 (America/Caracas)');
            console.log('📅 Fecha:', new Date().toLocaleString('es-VE', { timeZone: 'America/Caracas' }));
        });
        
    } catch (error) {
        console.error('❌ Error al iniciar el servidor:', error.message);
        process.exit(1);
    }
}

// Manejo de señales para cierre graceful
process.on('SIGTERM', () => {
    console.log('🛑 Señal SIGTERM recibida. Cerrando servidor...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 Señal SIGINT recibida. Cerrando servidor...');
    process.exit(0);
});

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
    console.error('❌ Error no capturado:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promesa rechazada no manejada:', reason);
    process.exit(1);
});

// Iniciar servidor
startServer();

module.exports = app;
