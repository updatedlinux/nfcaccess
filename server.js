const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

// Importar configuración y utilidades
const { testConnection } = require('./config/database');
const swaggerSpecs = require('./config/swagger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Importar rutas
const cardsRoutes = require('./routes/cards');
const accessRoutes = require('./routes/access');

const app = express();
const PORT = process.env.PORT || 5000;

// Configuración de seguridad
app.use(helmet());

// Configuración de CORS - abierto para integración
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: false
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 1000, // máximo 1000 requests por ventana
    message: {
        success: false,
        message: 'Demasiadas solicitudes desde esta IP, intente nuevamente más tarde'
    },
    standardHeaders: true,
    legacyHeaders: false
});
app.use(limiter);

// Middleware para parsing de JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

// Documentación Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'NFC Access API - Documentación',
    swaggerOptions: {
        docExpansion: 'none',
        filter: true,
        showRequestHeaders: true,
        showCommonExtensions: true
    }
}));

// Ruta raíz con información de la API
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'API NFC Access - Sistema de gestión de acceso vehicular',
        version: '1.0.0',
        documentation: '/api-docs',
        health: '/health',
        endpoints: {
            cards: {
                register: 'POST /cards/register',
                getByUser: 'GET /cards/:wp_user_id',
                getOwner: 'GET /cards/owner/:card_uid',
                search: 'GET /cards/search',
                deactivate: 'PUT /cards/deactivate/:card_uid'
            },
            access: {
                log: 'POST /access/log',
                getLogs: 'GET /access/logs/:wp_user_id',
                getStats: 'GET /access/stats/:wp_user_id',
                getLastAccess: 'GET /access/last/:card_uid',
                getTodaySummary: 'GET /access/today-summary'
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
