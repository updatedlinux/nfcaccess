const moment = require('moment-timezone');

// Configurar zona horaria GMT-4 (Venezuela)
const TIMEZONE = process.env.TIMEZONE || 'America/Caracas';

/**
 * Obtiene la fecha y hora actual en GMT-4
 * @returns {string} Fecha y hora en formato YYYY-MM-DD HH:mm:ss
 */
function getCurrentDateTime() {
    return moment().tz(TIMEZONE).format('YYYY-MM-DD HH:mm:ss');
}

/**
 * Convierte una fecha UTC a GMT-4
 * @param {Date|string} date - Fecha a convertir
 * @returns {string} Fecha en formato YYYY-MM-DD HH:mm:ss GMT-4
 */
function convertToGMTMinus4(date) {
    return moment(date).tz(TIMEZONE).format('YYYY-MM-DD HH:mm:ss');
}

/**
 * Formatea una fecha para mostrar en formato AM/PM
 * @param {Date|string} date - Fecha a formatear
 * @returns {string} Fecha en formato DD/MM/YYYY HH:mm A
 */
function formatDateTimeAMPM(date) {
    return moment(date).tz(TIMEZONE).format('DD/MM/YYYY hh:mm A');
}

/**
 * Formatea una fecha para mostrar en formato AM/PM con día de la semana
 * @param {Date|string} date - Fecha a formatear
 * @returns {string} Fecha en formato dddd, DD/MM/YYYY HH:mm A
 */
function formatDateTimeWithDay(date) {
    return moment(date).tz(TIMEZONE).format('dddd, DD/MM/YYYY hh:mm A');
}

/**
 * Valida si una fecha es válida
 * @param {string} dateString - String de fecha a validar
 * @returns {boolean} True si es válida, false si no
 */
function isValidDate(dateString) {
    return moment(dateString, 'YYYY-MM-DD HH:mm:ss', true).isValid();
}

/**
 * Obtiene la fecha actual en formato para MySQL
 * @returns {string} Fecha actual en formato YYYY-MM-DD HH:mm:ss
 */
function getMySQLDateTime() {
    return moment().tz(TIMEZONE).format('YYYY-MM-DD HH:mm:ss');
}

module.exports = {
    TIMEZONE,
    getCurrentDateTime,
    convertToGMTMinus4,
    formatDateTimeAMPM,
    formatDateTimeWithDay,
    isValidDate,
    getMySQLDateTime
};
