const express = require('express');
const router = express.Router();
const AccessController = require('../controllers/accessController');

/**
 * @swagger
 * components:
 *   schemas:
 *     AccessLog:
 *       type: object
 *       required:
 *         - card_uid
 *         - access_type
 *       properties:
 *         card_uid:
 *           type: string
 *           description: UID de la tarjeta NFC
 *         access_type:
 *           type: string
 *           enum: [ingreso, salida]
 *           description: Tipo de acceso
 *         guard_user:
 *           type: string
 *           description: Usuario vigilante (opcional)
 *     AccessLogResponse:
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
 * /access/log:
 *   post:
 *     summary: Registrar evento de acceso
 *     tags: [Accesos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - card_uid
 *               - access_type
 *             properties:
 *               card_uid:
 *                 type: string
 *                 example: "12345678ABCD"
 *               access_type:
 *                 type: string
 *                 enum: [ingreso, salida]
 *                 example: "ingreso"
 *               guard_user:
 *                 type: string
 *                 example: "Vigilante Juan"
 *     responses:
 *       201:
 *         description: Acceso registrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AccessLogResponse'
 *       400:
 *         description: Error en la solicitud
 */
router.post('/log', AccessController.logAccess);

/**
 * @swagger
 * /access/logs/{wp_user_id}:
 *   get:
 *     summary: Obtener historial de accesos de un usuario
 *     tags: [Accesos]
 *     parameters:
 *       - in: path
 *         name: wp_user_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario de WordPress
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Límite de resultados (1-200)
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Offset para paginación
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de inicio (YYYY-MM-DD)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de fin (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Historial obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AccessLogResponse'
 *       400:
 *         description: Error en la solicitud
 */
router.get('/logs/:wp_user_id', AccessController.getAccessLogsByUserId);

/**
 * @swagger
 * /access/stats/{wp_user_id}:
 *   get:
 *     summary: Obtener estadísticas de acceso de un usuario
 *     tags: [Accesos]
 *     parameters:
 *       - in: path
 *         name: wp_user_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario de WordPress
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [today, week, month, year]
 *           default: month
 *         description: Período de estadísticas
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AccessLogResponse'
 *       400:
 *         description: Error en la solicitud
 */
router.get('/stats/:wp_user_id', AccessController.getAccessStatsByUserId);

/**
 * @swagger
 * /access/last/{card_uid}:
 *   get:
 *     summary: Obtener último acceso de una tarjeta
 *     tags: [Accesos]
 *     parameters:
 *       - in: path
 *         name: card_uid
 *         required: true
 *         schema:
 *           type: string
 *         description: UID de la tarjeta NFC
 *     responses:
 *       200:
 *         description: Último acceso obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AccessLogResponse'
 *       400:
 *         description: Error en la solicitud
 */
router.get('/last/:card_uid', AccessController.getLastAccessByCard);

/**
 * @swagger
 * /access/today-summary:
 *   get:
 *     summary: Obtener resumen de accesos del día actual
 *     tags: [Accesos]
 *     responses:
 *       200:
 *         description: Resumen obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AccessLogResponse'
 *       500:
 *         description: Error interno del servidor
 */
router.get('/today-summary', AccessController.getTodayAccessSummary);

module.exports = router;
