const { query } = require('../config/database');
const { getMySQLDateTime } = require('../utils/timezone');

class Card {
    /**
     * Registrar una nueva tarjeta NFC
     * @param {Object} cardData - Datos de la tarjeta
     * @param {string} cardData.wp_user_login - Login del usuario de WordPress
     * @param {string} cardData.card_uid - UID de la tarjeta NFC
     * @param {string} cardData.label - Etiqueta opcional de la tarjeta
     * @returns {Promise<Object>} Resultado de la operación
     */
    static async registerCard(cardData) {
        const { wp_user_login, card_uid, label } = cardData;
        
        try {
            // Verificar que el usuario existe en WordPress
            const userQuery = 'SELECT ID FROM wp_users WHERE user_login = ?';
            const users = await query(userQuery, [wp_user_login]);
            
            if (users.length === 0) {
                throw new Error(`Usuario '${wp_user_login}' no encontrado en Condominio360`);
            }
            
            const wp_user_id = users[0].ID;
            
            // Verificar si la tarjeta ya existe
            const existingCardQuery = 'SELECT id FROM condo360_nfc_cards WHERE card_uid = ?';
            const existingCards = await query(existingCardQuery, [card_uid]);
            
            if (existingCards.length > 0) {
                throw new Error(`La tarjeta con UID '${card_uid}' ya está registrada`);
            }
            
            // Insertar nueva tarjeta
            const insertQuery = `
                INSERT INTO condo360_nfc_cards (wp_user_id, card_uid, label, active, created_at)
                VALUES (?, ?, ?, TRUE, ?)
            `;
            
            const result = await query(insertQuery, [wp_user_id, card_uid, label || null, getMySQLDateTime()]);
            
            return {
                success: true,
                message: 'Tarjeta registrada exitosamente',
                data: {
                    id: result.insertId,
                    wp_user_id,
                    card_uid,
                    label,
                    active: true
                }
            };
            
        } catch (error) {
            throw new Error(`Error al registrar tarjeta: ${error.message}`);
        }
    }
    
    /**
     * Obtener todas las tarjetas activas de un usuario
     * @param {number} wp_user_id - ID del usuario de WordPress
     * @returns {Promise<Array>} Lista de tarjetas del usuario
     */
    static async getCardsByUserId(wp_user_id) {
        try {
            const sql = `
                SELECT 
                    c.id,
                    c.card_uid,
                    c.label,
                    c.active,
                    c.created_at,
                    u.user_login,
                    u.display_name,
                    u.user_email
                FROM condo360_nfc_cards c
                INNER JOIN wp_users u ON c.wp_user_id = u.ID
                WHERE c.wp_user_id = ? AND c.active = TRUE
                ORDER BY c.created_at DESC
            `;
            
            const cards = await query(sql, [wp_user_id]);
            
            return {
                success: true,
                message: 'Tarjetas obtenidas exitosamente',
                data: cards
            };
            
        } catch (error) {
            throw new Error(`Error al obtener tarjetas: ${error.message}`);
        }
    }
    
    /**
     * Obtener datos del propietario por UID de tarjeta
     * @param {string} card_uid - UID de la tarjeta
     * @returns {Promise<Object>} Datos del propietario
     */
    static async getOwnerByCardUid(card_uid) {
        try {
            const sql = `
                SELECT 
                    c.id as card_id,
                    c.card_uid,
                    c.label,
                    c.active,
                    u.ID as wp_user_id,
                    u.user_login,
                    u.display_name,
                    u.user_email
                FROM condo360_nfc_cards c
                INNER JOIN wp_users u ON c.wp_user_id = u.ID
                WHERE c.card_uid = ? AND c.active = TRUE
            `;
            
            const results = await query(sql, [card_uid]);
            
            if (results.length === 0) {
                throw new Error(`Tarjeta con UID '${card_uid}' no encontrada o inactiva`);
            }
            
            return {
                success: true,
                message: 'Propietario encontrado exitosamente',
                data: results[0]
            };
            
        } catch (error) {
            throw new Error(`Error al obtener propietario: ${error.message}`);
        }
    }
    
    /**
     * Desactivar una tarjeta
     * @param {string} card_uid - UID de la tarjeta
     * @returns {Promise<Object>} Resultado de la operación
     */
    static async deactivateCard(card_uid) {
        try {
            const sql = 'UPDATE condo360_nfc_cards SET active = FALSE WHERE card_uid = ?';
            const result = await query(sql, [card_uid]);
            
            if (result.affectedRows === 0) {
                throw new Error(`Tarjeta con UID '${card_uid}' no encontrada`);
            }
            
            return {
                success: true,
                message: 'Tarjeta desactivada exitosamente'
            };
            
        } catch (error) {
            throw new Error(`Error al desactivar tarjeta: ${error.message}`);
        }
    }
    
    /**
     * Buscar tarjetas por nombre de usuario (para administradores)
     * @param {string} searchTerm - Término de búsqueda
     * @returns {Promise<Array>} Lista de tarjetas encontradas
     */
    static async searchCardsByUser(searchTerm) {
        try {
            const sql = `
                SELECT 
                    c.id,
                    c.card_uid,
                    c.label,
                    c.active,
                    c.created_at,
                    c.wp_user_id,
                    u.user_login,
                    u.display_name,
                    u.user_email
                FROM condo360_nfc_cards c
                INNER JOIN wp_users u ON c.wp_user_id = u.ID
                WHERE (
                    u.user_login LIKE ? OR 
                    u.display_name LIKE ? OR 
                    u.user_email LIKE ?
                )
                ORDER BY u.display_name, c.created_at DESC
            `;
            
            const searchPattern = `%${searchTerm}%`;
            const cards = await query(sql, [searchPattern, searchPattern, searchPattern]);
            
            return {
                success: true,
                message: cards.length > 0 ? 'Búsqueda completada exitosamente' : 'No se encontraron propietarios con tarjetas registradas',
                data: cards
            };
            
        } catch (error) {
            throw new Error(`Error en búsqueda: ${error.message}`);
        }
    }
}

module.exports = Card;
