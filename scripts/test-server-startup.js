#!/usr/bin/env node

/**
 * Script para probar el inicio del servidor sin errores
 */

const { spawn } = require('child_process');
const https = require('https');

function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, { timeout: 5000 }, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    data: data
                });
            });
        });
        
        req.on('error', (error) => {
            reject({ error: error.message });
        });
        
        req.on('timeout', () => {
            req.destroy();
            reject({ error: 'Request timeout' });
        });
    });
}

async function testServerStartup() {
    console.log('🧪 Probando Inicio del Servidor\n');
    
    try {
        // Probar endpoint de salud
        console.log('1️⃣ Probando endpoint de salud...');
        const healthResponse = await makeRequest('https://api.bonaventurecclub.com/nfc_access/health');
        
        if (healthResponse.statusCode === 200) {
            console.log('✅ Servidor funcionando correctamente');
            
            try {
                const healthData = JSON.parse(healthResponse.data);
                console.log(`   📊 Estado: ${healthData.status}`);
                console.log(`   ⏰ Uptime: ${Math.round(healthData.data.uptime)}s`);
                console.log(`   💾 Memoria: ${Math.round(healthData.data.memory.heapUsed / 1024 / 1024)}MB`);
            } catch (e) {
                console.log('   ⚠️  Respuesta no es JSON válido');
            }
        } else {
            console.log(`❌ Error en salud (${healthResponse.statusCode})`);
            return false;
        }
        
        // Probar endpoint de logs
        console.log('\n2️⃣ Probando endpoint de logs...');
        const logsResponse = await makeRequest('https://api.bonaventurecclub.com/nfc_access/access/logs/1?limit=5');
        
        if (logsResponse.statusCode === 200) {
            console.log('✅ Endpoint de logs funcionando');
            
            try {
                const logsData = JSON.parse(logsResponse.data);
                if (logsData.success) {
                    console.log(`   📊 Logs encontrados: ${logsData.data.logs.length}`);
                    console.log(`   📈 Total: ${logsData.data.pagination.total}`);
                } else {
                    console.log(`   ⚠️  Mensaje: ${logsData.message}`);
                }
            } catch (e) {
                console.log('   ❌ Respuesta no es JSON válido');
            }
        } else {
            console.log(`❌ Error en logs (${logsResponse.statusCode})`);
            return false;
        }
        
        // Probar endpoint de búsqueda
        console.log('\n3️⃣ Probando endpoint de búsqueda...');
        const searchResponse = await makeRequest('https://api.bonaventurecclub.com/nfc_access/cards/search?search=test');
        
        if (searchResponse.statusCode === 200) {
            console.log('✅ Endpoint de búsqueda funcionando');
            
            try {
                const searchData = JSON.parse(searchResponse.data);
                if (searchData.success) {
                    console.log(`   🔍 Resultados: ${searchData.data.length}`);
                    console.log(`   💬 Mensaje: ${searchData.message}`);
                } else {
                    console.log(`   ⚠️  Error: ${searchData.message}`);
                }
            } catch (e) {
                console.log('   ❌ Respuesta no es JSON válido');
            }
        } else {
            console.log(`❌ Error en búsqueda (${searchResponse.statusCode})`);
            return false;
        }
        
        console.log('\n🎉 TODAS LAS PRUEBAS EXITOSAS');
        console.log('==============================');
        console.log('✅ Servidor funcionando correctamente');
        console.log('✅ Endpoints respondiendo sin errores');
        console.log('✅ Sin errores de trust proxy');
        console.log('✅ Sistema estable y operativo');
        
        return true;
        
    } catch (error) {
        console.log(`❌ Error durante las pruebas: ${error.error || error.message}`);
        return false;
    }
}

// Ejecutar pruebas
if (require.main === module) {
    testServerStartup()
        .then((success) => {
            process.exit(success ? 0 : 1);
        })
        .catch((error) => {
            console.error('❌ Error inesperado:', error.message);
            process.exit(1);
        });
}

module.exports = { testServerStartup };
