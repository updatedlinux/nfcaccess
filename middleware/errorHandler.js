/**
 * Middleware para manejo de errores
 */
const errorHandler = (err, req, res, next) => {
    console.error('Error capturado:', err);
    
    // Error de validación de datos
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Error de validación: ' + err.message
        });
    }
    
    // Error de conexión a base de datos
    if (err.code === 'ECONNREFUSED' || err.code === 'ER_ACCESS_DENIED_ERROR') {
        return res.status(500).json({
            success: false,
            message: 'Error de conexión a la base de datos'
        });
    }
    
    // Error de MySQL
    if (err.code && err.code.startsWith('ER_')) {
        return res.status(400).json({
            success: false,
            message: 'Error en la base de datos: ' + err.message
        });
    }
    
    // Error de sintaxis JSON
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({
            success: false,
            message: 'Formato JSON inválido'
        });
    }
    
    // Error por defecto
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Error interno del servidor'
    });
};

/**
 * Middleware para manejar rutas no encontradas
 */
const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        message: `Ruta ${req.method} ${req.originalUrl} no encontrada`
    });
};

module.exports = {
    errorHandler,
    notFoundHandler
};
