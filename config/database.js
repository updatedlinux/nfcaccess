const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración de conexión a la base de datos
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'wordpress_db',
    charset: 'utf8mb4',
    timezone: '-04:00', // GMT-4 (Venezuela) para consistencia con la aplicación
    connectionLimit: 10,
    queueLimit: 0
};

// Crear pool de conexiones
const pool = mysql.createPool(dbConfig);

// Función para probar la conexión
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Conexión a MySQL establecida correctamente');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Error al conectar con MySQL:', error.message);
        return false;
    }
}

// Función para ejecutar consultas
async function query(sql, params = []) {
    try {
        const [rows] = await pool.execute(sql, params);
        return rows;
    } catch (error) {
        console.error('Error en consulta SQL:', error.message);
        throw error;
    }
}

// Función para obtener una conexión del pool
async function getConnection() {
    try {
        return await pool.getConnection();
    } catch (error) {
        console.error('Error al obtener conexión:', error.message);
        throw error;
    }
}

// Función para cerrar el pool de conexiones
async function closePool() {
    try {
        await pool.end();
        console.log('Pool de conexiones cerrado');
    } catch (error) {
        console.error('Error al cerrar pool:', error.message);
    }
}

module.exports = {
    pool,
    query,
    getConnection,
    testConnection,
    closePool
};
