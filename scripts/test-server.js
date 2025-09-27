#!/usr/bin/env node

/**
 * Script simple para probar el servidor
 */

const https = require('https');

function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, { timeout: 10000 }, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    data: data,
                    url: url
                });
            });
        });
        
        req.on('error', (error) => {
            reject({ error: error.message, url: url });
        });
        
        req.on('timeout', () => {
            req.destroy();
            reject({ error: 'Request timeout', url: url });
        });
    });
}

async function testServer() {
    console.log('🧪 Probando Servidor NFC Access\n');
    
    const baseUrl = 'https://api.bonaventurecclub.com/nfc_access';
    
    try {
        // 1. Probar endpoint de salud
        console.log('1️⃣ Probando endpoint de salud...');
        const healthResponse = await makeRequest(baseUrl + '/health');
        
        if (healthResponse.statusCode === 200) {
            console.log('✅ Servidor funcionando');
            try {
                const healthData = JSON.parse(healthResponse.data);
                console.log(`   📊 Estado: ${healthData.status}`);
                console.log(`   ⏰ Timestamp: ${healthData.timestamp}`);
            } catch (e) {
                console.log('   ⚠️  Respuesta no es JSON válido');
            }
        } else {
            console.log(`❌ Error en salud (${healthResponse.statusCode})`);
        }
        
        // 2. Probar endpoint de logs con parámetros simples
        console.log('\n2️⃣ Probando endpoint de logs...');
        const logsResponse = await makeRequest(baseUrl + '/access/logs/1?limit=5');
        
        if (logsResponse.statusCode === 200) {
            console.log('✅ Endpoint de logs funciona');
            try {
                const logsData = JSON.parse(logsResponse.data);
                if (logsData.success) {
                    console.log(`   📊 Logs encontrados: ${logsData.data.logs.length}`);
                    console.log(`   📈 Total: ${logsData.data.pagination.total}`);
                } else {
                    console.log(`   ⚠️  Error: ${logsData.message}`);
                }
            } catch (e) {
                console.log('   ❌ Respuesta no es JSON válido');
            }
        } else {
            console.log(`❌ Error en logs (${logsResponse.statusCode})`);
            console.log(`   Respuesta: ${logsResponse.data.substring(0, 200)}...`);
        }
        
        // 3. Probar endpoint de búsqueda
        console.log('\n3️⃣ Probando endpoint de búsqueda...');
        const searchResponse = await makeRequest(baseUrl + '/cards/search?search=test');
        
        if (searchResponse.statusCode === 200) {
            console.log('✅ Endpoint de búsqueda funciona');
            try {
                const searchData = JSON.parse(searchResponse.data);
                if (searchData.success) {
                    console.log(`   🔍 Tarjetas encontradas: ${searchData.data.length}`);
                } else {
                    console.log(`   ⚠️  Error: ${searchData.message}`);
                }
            } catch (e) {
                console.log('   ❌ Respuesta no es JSON válido');
            }
        } else {
            console.log(`❌ Error en búsqueda (${searchResponse.statusCode})`);
        }
        
        console.log('\n🎉 Pruebas completadas');
        
    } catch (error) {
        console.log(`❌ Error durante las pruebas: ${error.error || error.message}`);
    }
}

// Ejecutar pruebas
if (require.main === module) {
    testServer()
        .then(() => {
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Error inesperado:', error.message);
            process.exit(1);
        });
}

module.exports = { testServer };
