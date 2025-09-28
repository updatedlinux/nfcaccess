const AccessLog = require('../models/AccessLog');

class AccessController {
    /**
     * Registrar evento de acceso
     */
    static async logAccess(req, res) {
        try {
            const { card_uid, access_type, guard_user } = req.body;
            
            // Validaciones básicas
            if (!card_uid || !access_type) {
                return res.status(400).json({
                    success: false,
                    message: 'Los campos card_uid y access_type son obligatorios'
                });
            }
            
            if (!['ingreso', 'salida'].includes(access_type)) {
                return res.status(400).json({
                    success: false,
                    message: 'access_type debe ser "ingreso" o "salida"'
                });
            }
            
            const result = await AccessLog.logAccess({
                card_uid: card_uid.toUpperCase(),
                access_type,
                guard_user
            });
            
            res.status(201).json(result);
            
        } catch (error) {
            console.error('Error en logAccess:', error.message);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
    
    /**
     * Obtener historial de accesos de un usuario
     */
    static async getAccessLogsByUserId(req, res) {
        try {
            const { wp_user_id } = req.params;
            const { limit = 50, offset = 0, start_date, end_date } = req.query;
            
            if (!wp_user_id || isNaN(wp_user_id)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de usuario inválido'
                });
            }
            
            // Validar parámetros de paginación
            const limitNum = parseInt(limit);
            const offsetNum = parseInt(offset);
            
            if (limitNum < 1 || limitNum > 200) {
                return res.status(400).json({
                    success: false,
                    message: 'Límite debe estar entre 1 y 200'
                });
            }
            
            if (offsetNum < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Offset debe ser mayor o igual a 0'
                });
            }
            
            const result = await AccessLog.getAccessLogsByUserId(parseInt(wp_user_id), {
                limit: limitNum,
                offset: offsetNum,
                start_date,
                end_date
            });
            
            res.json(result);
            
        } catch (error) {
            console.error('Error en getAccessLogsByUserId:', error.message);
            console.error('Parámetros recibidos:', { 
                wp_user_id: req.params.wp_user_id, 
                limit: req.query.limit, 
                offset: req.query.offset, 
                start_date: req.query.start_date, 
                end_date: req.query.end_date 
            });
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    
    /**
     * Obtener estadísticas de acceso de un usuario
     */
    static async getAccessStatsByUserId(req, res) {
        try {
            const { wp_user_id } = req.params;
            const { period = 'month' } = req.query;
            
            if (!wp_user_id || isNaN(wp_user_id)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de usuario inválido'
                });
            }
            
            if (!['today', 'week', 'month', 'year'].includes(period)) {
                return res.status(400).json({
                    success: false,
                    message: 'Período debe ser: today, week, month o year'
                });
            }
            
            const result = await AccessLog.getAccessStatsByUserId(parseInt(wp_user_id), period);
            res.json(result);
            
        } catch (error) {
            console.error('Error en getAccessStatsByUserId:', error.message);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    
    /**
     * Obtener último acceso de una tarjeta
     */
    static async getLastAccessByCard(req, res) {
        try {
            const { card_uid } = req.params;
            
            if (!card_uid) {
                return res.status(400).json({
                    success: false,
                    message: 'UID de tarjeta es obligatorio'
                });
            }
            
            const result = await AccessLog.getLastAccessByCard(card_uid.toUpperCase());
            res.json(result);
            
        } catch (error) {
            console.error('Error en getLastAccessByCard:', error.message);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    
    /**
     * Obtener resumen de accesos del día actual
     */
    static async getTodayAccessSummary(req, res) {
        try {
            const { query } = require('../config/database');
            const { getCurrentDateTime } = require('../utils/timezone');
            
            // Obtener fecha actual en GMT-4
            const currentDateGMT4 = getCurrentDateTime().split(' ')[0]; // YYYY-MM-DD
            
            const sql = `
                SELECT 
                    al.access_type,
                    COUNT(*) as count,
                    c.card_uid,
                    u.display_name,
                    u.user_login
                FROM condo360_access_logs al
                INNER JOIN condo360_nfc_cards c ON al.card_id = c.id
                INNER JOIN wp_users u ON c.wp_user_id = u.ID
                WHERE DATE(al.timestamp) = ?
                GROUP BY al.access_type, c.card_uid, u.display_name, u.user_login
                ORDER BY al.access_type, u.display_name
            `;
            
            const results = await query(sql, [currentDateGMT4]);
            
            // Agrupar por tipo de acceso
            const summary = {
                ingresos: [],
                salidas: [],
                total_ingresos: 0,
                total_salidas: 0
            };
            
            results.forEach(row => {
                const accessData = {
                    card_uid: row.card_uid,
                    user_name: row.display_name,
                    user_login: row.user_login,
                    count: row.count
                };
                
                if (row.access_type === 'ingreso') {
                    summary.ingresos.push(accessData);
                    summary.total_ingresos += row.count;
                } else {
                    summary.salidas.push(accessData);
                    summary.total_salidas += row.count;
                }
            });
            
            res.json({
                success: true,
                message: 'Resumen del día obtenido exitosamente',
                data: {
                    date: currentDateGMT4, // Usar fecha en GMT-4
                    summary
                }
            });
            
        } catch (error) {
            console.error('Error en getTodayAccessSummary:', error.message);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = AccessController;
