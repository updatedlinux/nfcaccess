#!/usr/bin/env node

/**
 * Script para verificar y poblar la base de datos con datos de prueba
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function verificarYPoplarDB() {
    console.log('🔍 Verificando y poblando base de datos\n');
    
    let connection;
    
    try {
        // Conectar a la base de datos
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'wordpress_db',
            charset: 'utf8mb4',
            timezone: '+00:00'
        });
        
        console.log('✅ Conectado a la base de datos');
        
        // 1. Verificar que las tablas existen
        console.log('\n1️⃣ Verificando estructura de tablas...');
        
        const tables = await connection.execute(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = ? 
            AND TABLE_NAME IN ('condo360_nfc_cards', 'condo360_access_logs')
        `, [process.env.DB_NAME || 'wordpress_db']);
        
        if (tables[0].length === 2) {
            console.log('✅ Ambas tablas existen');
        } else {
            console.log('❌ Faltan tablas:', tables[0].map(t => t.TABLE_NAME));
            return;
        }
        
        // 2. Verificar usuarios de WordPress
        console.log('\n2️⃣ Verificando usuarios de WordPress...');
        
        const users = await connection.execute(`
            SELECT ID, user_login, display_name, user_email 
            FROM wp_users 
            WHERE user_login IN ('jmelendez', 'apartamento1134')
            ORDER BY ID
        `);
        
        if (users[0].length > 0) {
            console.log('✅ Usuarios encontrados:');
            users[0].forEach(user => {
                console.log(`   👤 ID: ${user.ID}, Login: ${user.user_login}, Nombre: ${user.display_name}`);
            });
        } else {
            console.log('❌ No se encontraron usuarios de prueba');
            return;
        }
        
        // 3. Verificar tarjetas existentes
        console.log('\n3️⃣ Verificando tarjetas existentes...');
        
        const cards = await connection.execute(`
            SELECT c.id, c.card_uid, c.label, c.active, c.wp_user_id, u.user_login
            FROM condo360_nfc_cards c
            INNER JOIN wp_users u ON c.wp_user_id = u.ID
            ORDER BY c.created_at DESC
            LIMIT 5
        `);
        
        if (cards[0].length > 0) {
            console.log('✅ Tarjetas encontradas:');
            cards[0].forEach(card => {
                console.log(`   🎫 UID: ${card.card_uid}, Usuario: ${card.user_login}, Activa: ${card.active}`);
            });
        } else {
            console.log('⚠️  No hay tarjetas registradas');
            
            // Crear tarjetas de prueba
            console.log('\n4️⃣ Creando tarjetas de prueba...');
            
            for (const user of users[0]) {
                const cardUid = `TEST${user.ID.toString().padStart(8, '0')}`;
                
                await connection.execute(`
                    INSERT INTO condo360_nfc_cards (wp_user_id, card_uid, label, active, created_at)
                    VALUES (?, ?, ?, 1, NOW())
                `, [user.ID, cardUid, `Tarjeta de prueba - ${user.display_name}`]);
                
                console.log(`   ✅ Tarjeta creada: ${cardUid} para ${user.user_login}`);
            }
        }
        
        // 4. Verificar logs de acceso
        console.log('\n5️⃣ Verificando logs de acceso...');
        
        const logs = await connection.execute(`
            SELECT COUNT(*) as total
            FROM condo360_access_logs al
            INNER JOIN condo360_nfc_cards c ON al.card_id = c.id
            WHERE c.wp_user_id = ?
        `, [users[0][0].ID]);
        
        const logCount = logs[0][0].total;
        console.log(`   📊 Logs existentes para ${users[0][0].user_login}: ${logCount}`);
        
        if (logCount === 0) {
            console.log('\n6️⃣ Creando logs de acceso de prueba...');
            
            // Obtener tarjetas del primer usuario
            const userCards = await connection.execute(`
                SELECT id FROM condo360_nfc_cards WHERE wp_user_id = ?
            `, [users[0][0].ID]);
            
            if (userCards[0].length > 0) {
                const cardId = userCards[0][0].id;
                
                // Crear algunos logs de prueba
                const testLogs = [
                    { access_type: 'ingreso', hours_ago: 2 },
                    { access_type: 'salida', hours_ago: 1 },
                    { access_type: 'ingreso', hours_ago: 0.5 }
                ];
                
                for (const log of testLogs) {
                    const timestamp = new Date();
                    timestamp.setHours(timestamp.getHours() - log.hours_ago);
                    
                    await connection.execute(`
                        INSERT INTO condo360_access_logs (card_id, access_type, timestamp, created_at)
                        VALUES (?, ?, ?, ?)
                    `, [cardId, log.access_type, timestamp, timestamp]);
                    
                    console.log(`   ✅ Log creado: ${log.access_type} hace ${log.hours_ago}h`);
                }
            }
        }
        
        // 5. Probar consulta de logs
        console.log('\n7️⃣ Probando consulta de logs...');
        
        const testLogs = await connection.execute(`
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
            ORDER BY al.timestamp DESC 
            LIMIT ? OFFSET ?
        `, [users[0][0].ID, 50, 0]);
        
        console.log(`   ✅ Consulta exitosa: ${testLogs[0].length} registros encontrados`);
        
        if (testLogs[0].length > 0) {
            console.log('   📋 Primer registro:');
            const firstLog = testLogs[0][0];
            console.log(`      🎫 Tarjeta: ${firstLog.card_uid}`);
            console.log(`      👤 Usuario: ${firstLog.user_login}`);
            console.log(`      🚪 Acceso: ${firstLog.access_type}`);
            console.log(`      ⏰ Fecha: ${firstLog.timestamp}`);
        }
        
        console.log('\n🎉 BASE DE DATOS VERIFICADA Y POBLADA');
        console.log('====================================');
        console.log('✅ Tablas existentes');
        console.log('✅ Usuarios verificados');
        console.log('✅ Tarjetas creadas/verificadas');
        console.log('✅ Logs de acceso creados/verificados');
        console.log('✅ Consultas funcionando');
        
        console.log('\n📋 Ahora puedes probar:');
        console.log('   1. Shortcode [nfc_access_logs limit="50" show_stats="true"]');
        console.log('   2. Shortcode [nfc_admin_panel] y buscar usuarios');
        console.log('   3. Los endpoints de la API deberían funcionar');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Ejecutar verificación
if (require.main === module) {
    verificarYPoplarDB()
        .then(() => {
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Error inesperado:', error.message);
            process.exit(1);
        });
}

module.exports = { verificarYPoplarDB };
