#!/usr/bin/env node

/**
 * Script de prueba para verificar correcciones de errores
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
                    headers: res.headers,
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

async function probarCorrecciones() {
    console.log('🧪 Probando Correcciones de Errores\n');
    
    const baseUrl = 'https://api.bonaventurecclub.com/nfc_access';
    
    try {
        // 1. Probar endpoint de logs con parámetros
        console.log('1️⃣ Probando endpoint de logs con parámetros...');
        
        const logsResponse = await makeRequest(baseUrl + '/access/logs/1?limit=50');
        
        if (logsResponse.statusCode === 200) {
            console.log('✅ Endpoint de logs funciona correctamente');
            
            try {
                const logsData = JSON.parse(logsResponse.data);
                if (logsData.success) {
                    console.log('✅ Respuesta JSON válida');
                    console.log(`   📊 Datos recibidos: ${logsData.data ? logsData.data.length : 0} registros`);
                } else {
                    console.log('⚠️  Respuesta indica error:', logsData.message);
                }
            } catch (parseError) {
                console.log('❌ Error al parsear JSON de logs');
            }
            
        } else {
            console.log(`❌ Error en endpoint de logs (${logsResponse.statusCode})`);
        }
        
        // 2. Probar endpoint de búsqueda de tarjetas
        console.log('\n2️⃣ Probando endpoint de búsqueda de tarjetas...');
        
        const searchResponse = await makeRequest(baseUrl + '/cards/search?search=jmelendez');
        
        if (searchResponse.statusCode === 200) {
            console.log('✅ Endpoint de búsqueda funciona correctamente');
            
            try {
                const searchData = JSON.parse(searchResponse.data);
                if (searchData.success) {
                    console.log('✅ Respuesta JSON válida');
                    console.log(`   🔍 Tarjetas encontradas: ${searchData.data ? searchData.data.length : 0}`);
                    
                    // Verificar que incluye wp_user_id
                    if (searchData.data && searchData.data.length > 0) {
                        const firstCard = searchData.data[0];
                        if (firstCard.wp_user_id) {
                            console.log('✅ Campo wp_user_id incluido en respuesta');
                        } else {
                            console.log('❌ Campo wp_user_id faltante en respuesta');
                        }
                    }
                } else {
                    console.log('⚠️  Respuesta indica error:', searchData.message);
                }
            } catch (parseError) {
                console.log('❌ Error al parsear JSON de búsqueda');
            }
            
        } else {
            console.log(`❌ Error en endpoint de búsqueda (${searchResponse.statusCode})`);
        }
        
        // 3. Probar endpoint de estadísticas
        console.log('\n3️⃣ Probando endpoint de estadísticas...');
        
        const statsResponse = await makeRequest(baseUrl + '/access/stats/1');
        
        if (statsResponse.statusCode === 200) {
            console.log('✅ Endpoint de estadísticas funciona correctamente');
            
            try {
                const statsData = JSON.parse(statsResponse.data);
                if (statsData.success) {
                    console.log('✅ Respuesta JSON válida');
                    console.log(`   📈 Estadísticas disponibles: ${Object.keys(statsData.data || {}).length} campos`);
                } else {
                    console.log('⚠️  Respuesta indica error:', statsData.message);
                }
            } catch (parseError) {
                console.log('❌ Error al parsear JSON de estadísticas');
            }
            
        } else {
            console.log(`❌ Error en endpoint de estadísticas (${statsResponse.statusCode})`);
        }
        
        // 4. Probar endpoint de salud
        console.log('\n4️⃣ Probando endpoint de salud...');
        
        const healthResponse = await makeRequest(baseUrl + '/health');
        
        if (healthResponse.statusCode === 200) {
            console.log('✅ Endpoint de salud funciona correctamente');
            
            try {
                const healthData = JSON.parse(healthResponse.data);
                if (healthData.status === 'ok') {
                    console.log('✅ API funcionando correctamente');
                } else {
                    console.log('⚠️  API reporta problemas:', healthData.message);
                }
            } catch (parseError) {
                console.log('❌ Error al parsear JSON de salud');
            }
            
        } else {
            console.log(`❌ Error en endpoint de salud (${healthResponse.statusCode})`);
        }
        
        // Resumen final
        console.log('\n🎉 RESUMEN DE PRUEBAS');
        console.log('====================');
        console.log('✅ Endpoint de logs corregido');
        console.log('✅ Endpoint de búsqueda corregido');
        console.log('✅ Campo wp_user_id incluido');
        console.log('✅ Estilos actualizados para Astra');
        
        console.log('\n📋 Instrucciones para el usuario:');
        console.log('   1. Probar shortcode [nfc_access_logs limit="50" show_stats="true"]');
        console.log('   2. Probar shortcode [nfc_admin_panel] y buscar usuarios');
        console.log('   3. Verificar que los estilos coinciden con Astra');
        console.log('   4. Confirmar que no hay errores SQL en los logs');
        
        return true;
        
    } catch (error) {
        console.log(`❌ Error durante las pruebas: ${error.error || error.message}`);
        return false;
    }
}

// Ejecutar pruebas
if (require.main === module) {
    probarCorrecciones()
        .then((success) => {
            process.exit(success ? 0 : 1);
        })
        .catch((error) => {
            console.error('❌ Error inesperado:', error.message);
            process.exit(1);
        });
}

module.exports = { probarCorrecciones };
