const express = require('express');
const router = express.Router();
const CardController = require('../controllers/cardController');

/**
 * @swagger
 * components:
 *   schemas:
 *     Card:
 *       type: object
 *       required:
 *         - wp_user_login
 *         - card_uid
 *       properties:
 *         wp_user_login:
 *           type: string
 *           description: Login del usuario de WordPress
 *         card_uid:
 *           type: string
 *           description: UID único de la tarjeta NFC
 *         label:
 *           type: string
 *           description: Etiqueta opcional de la tarjeta
 *     CardResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: object
 */

/**
 * @swagger
 * /cards/register:
 *   post:
 *     summary: Registrar una nueva tarjeta NFC
 *     tags: [Tarjetas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - wp_user_login
 *               - card_uid
 *             properties:
 *               wp_user_login:
 *                 type: string
 *                 example: "propietario123"
 *               card_uid:
 *                 type: string
 *                 example: "12345678ABCD"
 *               label:
 *                 type: string
 *                 example: "Tarjeta vehículo principal"
 *     responses:
 *       201:
 *         description: Tarjeta registrada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CardResponse'
 *       400:
 *         description: Error en la solicitud
 */
router.post('/register', CardController.registerCard);

/**
 * @swagger
 * /cards/{wp_user_id}:
 *   get:
 *     summary: Obtener tarjetas de un usuario
 *     tags: [Tarjetas]
 *     parameters:
 *       - in: path
 *         name: wp_user_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario de WordPress
 *     responses:
 *       200:
 *         description: Tarjetas obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CardResponse'
 *       400:
 *         description: Error en la solicitud
 */
router.get('/:wp_user_id', CardController.getCardsByUserId);

/**
 * @swagger
 * /cards/owner/{card_uid}:
 *   get:
 *     summary: Obtener propietario por UID de tarjeta
 *     tags: [Tarjetas]
 *     parameters:
 *       - in: path
 *         name: card_uid
 *         required: true
 *         schema:
 *           type: string
 *         description: UID de la tarjeta NFC
 *     responses:
 *       200:
 *         description: Propietario encontrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CardResponse'
 *       404:
 *         description: Tarjeta no encontrada
 */
router.get('/owner/:card_uid', CardController.getOwnerByCardUid);

/**
 * @swagger
 * /cards/search:
 *   get:
 *     summary: Buscar tarjetas por usuario (administradores)
 *     tags: [Tarjetas]
 *     parameters:
 *       - in: query
 *         name: search
 *         required: true
 *         schema:
 *           type: string
 *         description: Término de búsqueda (nombre, email o login)
 *     responses:
 *       200:
 *         description: Búsqueda completada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CardResponse'
 *       400:
 *         description: Error en la solicitud
 */
router.get('/search', CardController.searchCardsByUser);

/**
 * @swagger
 * /cards/deactivate/{card_uid}:
 *   put:
 *     summary: Desactivar una tarjeta
 *     tags: [Tarjetas]
 *     parameters:
 *       - in: path
 *         name: card_uid
 *         required: true
 *         schema:
 *           type: string
 *         description: UID de la tarjeta NFC
 *     responses:
 *       200:
 *         description: Tarjeta desactivada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CardResponse'
 *       400:
 *         description: Error en la solicitud
 */
router.put('/deactivate/:card_uid', CardController.deactivateCard);

module.exports = router;
