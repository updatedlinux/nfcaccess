const Card = require('../models/Card');

class CardController {
    /**
     * Registrar una nueva tarjeta NFC
     */
    static async registerCard(req, res) {
        try {
            const { wp_user_login, card_uid, label } = req.body;
            
            // Validaciones básicas
            if (!wp_user_login || !card_uid) {
                return res.status(400).json({
                    success: false,
                    message: 'Los campos wp_user_login y card_uid son obligatorios'
                });
            }
            
            if (card_uid.length < 8 || card_uid.length > 32) {
                return res.status(400).json({
                    success: false,
                    message: 'El UID de la tarjeta debe tener entre 8 y 32 caracteres'
                });
            }
            
            const result = await Card.registerCard({
                wp_user_login,
                card_uid: card_uid.toUpperCase(),
                label
            });
            
            res.status(201).json(result);
            
        } catch (error) {
            console.error('Error en registerCard:', error.message);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
    
    /**
     * Obtener tarjetas de un usuario
     */
    static async getCardsByUserId(req, res) {
        try {
            const { wp_user_id } = req.params;
            
            if (!wp_user_id || isNaN(wp_user_id)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de usuario inválido'
                });
            }
            
            const result = await Card.getCardsByUserId(parseInt(wp_user_id));
            res.json(result);
            
        } catch (error) {
            console.error('Error en getCardsByUserId:', error.message);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    
    /**
     * Obtener propietario por UID de tarjeta
     */
    static async getOwnerByCardUid(req, res) {
        try {
            const { card_uid } = req.params;
            
            if (!card_uid) {
                return res.status(400).json({
                    success: false,
                    message: 'UID de tarjeta es obligatorio'
                });
            }
            
            const result = await Card.getOwnerByCardUid(card_uid.toUpperCase());
            res.json(result);
            
        } catch (error) {
            console.error('Error en getOwnerByCardUid:', error.message);
            res.status(404).json({
                success: false,
                message: error.message
            });
        }
    }
    
    /**
     * Desactivar una tarjeta
     */
    static async deactivateCard(req, res) {
        try {
            const { card_uid } = req.params;
            
            if (!card_uid) {
                return res.status(400).json({
                    success: false,
                    message: 'UID de tarjeta es obligatorio'
                });
            }
            
            const result = await Card.deactivateCard(card_uid.toUpperCase());
            res.json(result);
            
        } catch (error) {
            console.error('Error en deactivateCard:', error.message);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
    
    /**
     * Buscar tarjetas por usuario (para administradores)
     */
    static async searchCardsByUser(req, res) {
        try {
            const { search } = req.query;
            
            if (!search || search.length < 2) {
                return res.status(400).json({
                    success: false,
                    message: 'Término de búsqueda debe tener al menos 2 caracteres'
                });
            }
            
            const result = await Card.searchCardsByUser(search);
            res.json(result);
            
        } catch (error) {
            console.error('Error en searchCardsByUser:', error.message);
            console.error('Parámetros recibidos:', { search: req.query.search });
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = CardController;
