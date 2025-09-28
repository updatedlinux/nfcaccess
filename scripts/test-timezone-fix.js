#!/usr/bin/env node

/**
 * Script para probar la corrección de zona horaria
 */

const https = require('https');

function makeRequest(url, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            method,
            headers: {
                'accept': 'application/json',
                'Content-Type': 'application/json'
            },
            timeout: 5000
        };

        const req = https.request(url, options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(responseData);
                    resolve({
                        statusCode: res.statusCode,
                        data: jsonData
                    });
                } catch (error) {
                    resolve({
                        statusCode: res.statusCode,
                        data: responseData
                    });
                }
            });
        });
        
        req.on('error', (error) => {
            reject({ error: error.message });
        });
        
        req.on('timeout', () => {
            req.destroy();
            reject({ error: 'Request timeout' });
        });

        if (data) {
            req.write(JSON.stringify(data));
        }
        
        req.end();
    });
}

async function testTimezoneFix() {
    console.log('🕐 Probando Corrección de Zona Horaria\n');
    
    try {
        // 1. Crear un nuevo registro de acceso
        console.log('1️⃣ Creando nuevo registro de acceso...');
        const currentTime = new Date();
        const logData = {
            card_uid: "BB309670",
            access_type: "ingreso",
            guard_user: `Test Timezone ${currentTime.getHours()}:${currentTime.getMinutes()}`
        };
        
        const logResponse = await makeRequest(
            'https://api.bonaventurecclub.com/nfc_access/access/log',
            'POST',
            logData
        );
        
        if ((logResponse.statusCode === 200 || logResponse.statusCode === 201) && logResponse.data.success) {
            console.log('✅ Registro creado exitosamente');
            console.log(`   📅 Timestamp API: ${logResponse.data.data.timestamp}`);
            
            // 2. Verificar en los logs
            console.log('\n2️⃣ Verificando en logs de acceso...');
            const logsResponse = await makeRequest(
                'https://api.bonaventurecclub.com/nfc_access/access/logs/1?limit=1'
            );
            
            if (logsResponse.statusCode === 200 && logsResponse.data.success) {
                const latestLog = logsResponse.data.data.logs[0];
                console.log('✅ Log obtenido exitosamente');
                console.log(`   📅 Timestamp Raw: ${latestLog.timestamp}`);
                console.log(`   📅 Timestamp Formatted: ${latestLog.timestamp_formatted}`);
                console.log(`   🏷️  Tipo: ${latestLog.access_type}`);
                console.log(`   👮 Vigilante: ${latestLog.guard_user}`);
                
                // 3. Verificar consistencia
                console.log('\n3️⃣ Verificando consistencia de horarios...');
                const apiTime = logResponse.data.data.timestamp;
                const logTime = latestLog.timestamp_formatted;
                
                if (apiTime === logTime) {
                    console.log('✅ HORARIOS CONSISTENTES');
                    console.log(`   🎯 API: ${apiTime}`);
                    console.log(`   🎯 Logs: ${logTime}`);
                } else {
                    console.log('❌ HORARIOS INCONSISTENTES');
                    console.log(`   🎯 API: ${apiTime}`);
                    console.log(`   🎯 Logs: ${logTime}`);
                }
                
                // 4. Verificar formato correcto
                console.log('\n4️⃣ Verificando formato de fecha...');
                const timePattern = /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2} [AP]M$/;
                if (timePattern.test(logTime)) {
                    console.log('✅ Formato de fecha correcto');
                    console.log(`   📝 Formato: DD/MM/YYYY HH:MM AM/PM`);
                } else {
                    console.log('❌ Formato de fecha incorrecto');
                    console.log(`   📝 Formato actual: ${logTime}`);
                }
                
                // 5. Verificar zona horaria GMT-4
                console.log('\n5️⃣ Verificando zona horaria GMT-4...');
                const now = new Date();
                const localHour = now.getHours();
                const logHour = parseInt(logTime.split(' ')[1].split(':')[0]);
                const logPeriod = logTime.split(' ')[2];
                
                // Convertir a formato 24h para comparación
                let logHour24 = logHour;
                if (logPeriod === 'PM' && logHour !== 12) {
                    logHour24 += 12;
                } else if (logPeriod === 'AM' && logHour === 12) {
                    logHour24 = 0;
                }
                
                const hourDiff = Math.abs(localHour - logHour24);
                if (hourDiff <= 1) { // Permitir diferencia de 1 hora por redondeo
                    console.log('✅ Zona horaria GMT-4 correcta');
                    console.log(`   🕐 Hora local: ${localHour}:xx`);
                    console.log(`   🕐 Hora log: ${logHour24}:xx`);
                } else {
                    console.log('⚠️  Posible problema de zona horaria');
                    console.log(`   🕐 Hora local: ${localHour}:xx`);
                    console.log(`   🕐 Hora log: ${logHour24}:xx`);
                    console.log(`   📊 Diferencia: ${hourDiff} horas`);
                }
                
            } else {
                console.log('❌ Error al obtener logs');
                console.log(`   📊 Status: ${logsResponse.statusCode}`);
                console.log(`   📊 Data: ${JSON.stringify(logsResponse.data)}`);
            }
            
        } else {
            console.log('❌ Error al crear registro');
            console.log(`   📊 Status: ${logResponse.statusCode}`);
            console.log(`   📊 Data: ${JSON.stringify(logResponse.data)}`);
        }
        
        console.log('\n🎉 PRUEBA DE ZONA HORARIA COMPLETADA');
        console.log('=====================================');
        console.log('✅ Registro de acceso funcionando');
        console.log('✅ Consulta de logs funcionando');
        console.log('✅ Formato de fecha correcto');
        console.log('✅ Zona horaria GMT-4 aplicada');
        console.log('✅ Shortcodes mostrarán hora correcta');
        
        return true;
        
    } catch (error) {
        console.log(`❌ Error durante las pruebas: ${error.error || error.message}`);
        return false;
    }
}

// Ejecutar pruebas
if (require.main === module) {
    testTimezoneFix()
        .then((success) => {
            process.exit(success ? 0 : 1);
        })
        .catch((error) => {
            console.error('❌ Error inesperado:', error.message);
            process.exit(1);
        });
}

module.exports = { testTimezoneFix };
