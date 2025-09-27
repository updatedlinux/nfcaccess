const { query } = require('../config/database');
const { getMySQLDateTime, formatDateTimeAMPM } = require('../utils/timezone');

class AccessLog {
    /**
     * Registrar un evento de acceso (ingreso o salida)
     * @param {Object} logData - Datos del evento de acceso
     * @param {string} logData.card_uid - UID de la tarjeta NFC
     * @param {string} logData.access_type - Tipo de acceso ('ingreso' o 'salida')
     * @param {string} logData.guard_user - Usuario vigilante (opcional)
     * @returns {Promise<Object>} Resultado de la operación
     */
    static async logAccess(logData) {
        const { card_uid, access_type, guard_user } = logData;
        
        try {
            // Validar tipo de acceso
            if (!['ingreso', 'salida'].includes(access_type)) {
                throw new Error('Tipo de acceso debe ser "ingreso" o "salida"');
            }
            
            // Obtener información de la tarjeta
            const cardQuery = 'SELECT id FROM condo360_nfc_cards WHERE card_uid = ? AND active = TRUE';
            const cards = await query(cardQuery, [card_uid]);
            
            if (cards.length === 0) {
                throw new Error(`Tarjeta con UID '${card_uid}' no encontrada o inactiva`);
            }
            
            const card_id = cards[0].id;
            const timestamp = getMySQLDateTime();
            
            // Insertar log de acceso
            const insertQuery = `
                INSERT INTO condo360_access_logs (card_id, access_type, timestamp, guard_user, created_at)
                VALUES (?, ?, ?, ?, ?)
            `;
            
            const result = await query(insertQuery, [card_id, access_type, timestamp, guard_user || null, timestamp]);
            
            return {
                success: true,
                message: `${access_type.charAt(0).toUpperCase() + access_type.slice(1)} registrado exitosamente`,
                data: {
                    id: result.insertId,
                    card_uid,
                    access_type,
                    timestamp: formatDateTimeAMPM(timestamp),
                    guard_user
                }
            };
            
        } catch (error) {
            throw new Error(`Error al registrar acceso: ${error.message}`);
        }
    }
    
    /**
     * Obtener historial de accesos de un usuario
     * @param {number} wp_user_id - ID del usuario de WordPress
     * @param {Object} options - Opciones de consulta
     * @param {number} options.limit - Límite de resultados (default: 50)
     * @param {number} options.offset - Offset para paginación (default: 0)
     * @param {string} options.start_date - Fecha de inicio (YYYY-MM-DD)
     * @param {string} options.end_date - Fecha de fin (YYYY-MM-DD)
     * @returns {Promise<Object>} Historial de accesos
     */
    static async getAccessLogsByUserId(wp_user_id, options = {}) {
        const { limit = 50, offset = 0, start_date, end_date } = options;
        
        try {
            // Validar que wp_user_id sea un número entero
            const userId = parseInt(wp_user_id);
            if (isNaN(userId) || userId <= 0) {
                throw new Error('ID de usuario inválido');
            }
            
            // Primero verificar si el usuario existe
            const userCheck = await query('SELECT ID FROM wp_users WHERE ID = ?', [userId]);
            if (userCheck.length === 0) {
                return {
                    success: true,
                    message: 'Usuario no encontrado',
                    data: {
                        logs: [],
                        pagination: {
                            total: 0,
                            limit: parseInt(limit) || 50,
                            offset: parseInt(offset) || 0,
                            has_more: false
                        }
                    }
                };
            }
            
            // Verificar si el usuario tiene tarjetas registradas
            const cardsCheck = await query('SELECT COUNT(*) as count FROM condo360_nfc_cards WHERE wp_user_id = ?', [userId]);
            if (cardsCheck[0].count === 0) {
                return {
                    success: true,
                    message: 'Usuario no tiene tarjetas registradas',
                    data: {
                        logs: [],
                        pagination: {
                            total: 0,
                            limit: parseInt(limit) || 50,
                            offset: parseInt(offset) || 0,
                            has_more: false
                        }
                    }
                };
            }
            
            // Verificar si hay logs de acceso
            const logsCheck = await query(`
                SELECT COUNT(*) as count 
                FROM condo360_access_logs al
                INNER JOIN condo360_nfc_cards c ON al.card_id = c.id
                WHERE c.wp_user_id = ?
            `, [userId]);
            
            if (logsCheck[0].count === 0) {
                return {
                    success: true,
                    message: 'No se encontraron registros de acceso',
                    data: {
                        logs: [],
                        pagination: {
                            total: 0,
                            limit: parseInt(limit) || 50,
                            offset: parseInt(offset) || 0,
                            has_more: false
                        }
                    }
                };
            }
            
            // Si hay datos, ejecutar la consulta completa
            let sql = `
                SELECT 
                    al.id,
                    al.access_type,
                    al.timestamp,
                    al.guard_user,
                    al.created_at,
                    c.card_uid,
                    c.label as card_label,
                    u.user_login,
                    u.display_name
                FROM condo360_access_logs al
                INNER JOIN condo360_nfc_cards c ON al.card_id = c.id
                INNER JOIN wp_users u ON c.wp_user_id = u.ID
                WHERE c.wp_user_id = ?
            `;
            
            const params = [userId];
            
            // Agregar filtros de fecha si se proporcionan
            if (start_date) {
                sql += ' AND DATE(al.timestamp) >= ?';
                params.push(start_date);
            }
            
            if (end_date) {
                sql += ' AND DATE(al.timestamp) <= ?';
                params.push(end_date);
            }
            
            sql += ' ORDER BY al.timestamp DESC LIMIT ? OFFSET ?';
            
            // Asegurar que limit y offset sean números enteros válidos
            const limitNum = parseInt(limit) || 50;
            const offsetNum = parseInt(offset) || 0;
            
            params.push(limitNum, offsetNum);
            
            const logs = await query(sql, params);
            
            // Formatear fechas para mostrar
            const formattedLogs = logs.map(log => ({
                ...log,
                timestamp_formatted: formatDateTimeAMPM(log.timestamp),
                access_type_spanish: log.access_type === 'ingreso' ? 'Ingreso' : 'Salida'
            }));
            
            // Obtener total de registros para paginación
            let countSql = `
                SELECT COUNT(*) as total
                FROM condo360_access_logs al
                INNER JOIN condo360_nfc_cards c ON al.card_id = c.id
                WHERE c.wp_user_id = ?
            `;
            
            const countParams = [userId];
            
            if (start_date) {
                countSql += ' AND DATE(al.timestamp) >= ?';
                countParams.push(start_date);
            }
            
            if (end_date) {
                countSql += ' AND DATE(al.timestamp) <= ?';
                countParams.push(end_date);
            }
            
            const countResult = await query(countSql, countParams);
            const total = countResult[0].total;
            
            return {
                success: true,
                message: 'Historial obtenido exitosamente',
                data: {
                    logs: formattedLogs,
                    pagination: {
                        total,
                        limit: limitNum,
                        offset: offsetNum,
                        has_more: offsetNum + limitNum < total
                    }
                }
            };
            
        } catch (error) {
            throw new Error(`Error al obtener historial: ${error.message}`);
        }
    }
    
    /**
     * Obtener estadísticas de acceso de un usuario
     * @param {number} wp_user_id - ID del usuario de WordPress
     * @param {string} period - Período ('today', 'week', 'month', 'year')
     * @returns {Promise<Object>} Estadísticas de acceso
     */
    static async getAccessStatsByUserId(wp_user_id, period = 'month') {
        try {
            let dateFilter = '';
            const params = [wp_user_id];
            
            switch (period) {
                case 'today':
                    dateFilter = 'AND DATE(al.timestamp) = CURDATE()';
                    break;
                case 'week':
                    dateFilter = 'AND al.timestamp >= DATE_SUB(NOW(), INTERVAL 1 WEEK)';
                    break;
                case 'month':
                    dateFilter = 'AND al.timestamp >= DATE_SUB(NOW(), INTERVAL 1 MONTH)';
                    break;
                case 'year':
                    dateFilter = 'AND al.timestamp >= DATE_SUB(NOW(), INTERVAL 1 YEAR)';
                    break;
                default:
                    dateFilter = 'AND al.timestamp >= DATE_SUB(NOW(), INTERVAL 1 MONTH)';
            }
            
            const sql = `
                SELECT 
                    al.access_type,
                    COUNT(*) as count,
                    DATE(al.timestamp) as date
                FROM condo360_access_logs al
                INNER JOIN condo360_nfc_cards c ON al.card_id = c.id
                WHERE c.wp_user_id = ? ${dateFilter}
                GROUP BY al.access_type, DATE(al.timestamp)
                ORDER BY date DESC
            `;
            
            const stats = await query(sql, params);
            
            // Calcular totales
            const totals = {
                ingresos: 0,
                salidas: 0,
                total: 0
            };
            
            stats.forEach(stat => {
                if (stat.access_type === 'ingreso') {
                    totals.ingresos += stat.count;
                } else {
                    totals.salidas += stat.count;
                }
                totals.total += stat.count;
            });
            
            return {
                success: true,
                message: 'Estadísticas obtenidas exitosamente',
                data: {
                    period,
                    totals,
                    daily_stats: stats
                }
            };
            
        } catch (error) {
            throw new Error(`Error al obtener estadísticas: ${error.message}`);
        }
    }
    
    /**
     * Obtener último acceso de una tarjeta
     * @param {string} card_uid - UID de la tarjeta
     * @returns {Promise<Object>} Último acceso registrado
     */
    static async getLastAccessByCard(card_uid) {
        try {
            const sql = `
                SELECT 
                    al.access_type,
                    al.timestamp,
                    al.guard_user,
                    c.card_uid,
                    c.label as card_label
                FROM condo360_access_logs al
                INNER JOIN condo360_nfc_cards c ON al.card_id = c.id
                WHERE c.card_uid = ?
                ORDER BY al.timestamp DESC
                LIMIT 1
            `;
            
            const results = await query(sql, [card_uid]);
            
            if (results.length === 0) {
                return {
                    success: true,
                    message: 'No se encontraron accesos previos',
                    data: null
                };
            }
            
            const lastAccess = results[0];
            
            return {
                success: true,
                message: 'Último acceso obtenido exitosamente',
                data: {
                    ...lastAccess,
                    timestamp_formatted: formatDateTimeAMPM(lastAccess.timestamp),
                    access_type_spanish: lastAccess.access_type === 'ingreso' ? 'Ingreso' : 'Salida'
                }
            };
            
        } catch (error) {
            throw new Error(`Error al obtener último acceso: ${error.message}`);
        }
    }
}

module.exports = AccessLog;
