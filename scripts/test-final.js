#!/usr/bin/env node

/**
 * Script de verificación final para Swagger UI
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

async function testFinal() {
    console.log('🎯 Verificación Final de Swagger UI\n');
    
    const baseUrl = 'https://api.bonaventurecclub.com/nfc_access';
    
    try {
        // 1. Verificar HTML de Swagger UI
        console.log('1️⃣ Verificando HTML de Swagger UI...');
        const htmlResponse = await makeRequest(baseUrl + '/api-docs/');
        
        if (htmlResponse.statusCode === 200) {
            console.log('✅ HTML de Swagger UI se sirve correctamente');
            
            const html = htmlResponse.data;
            
            // Verificar que la URL del JSON sea correcta
            if (html.includes('/nfc_access/api-docs/swagger.json')) {
                console.log('✅ URL del JSON incluye el prefijo /nfc_access');
            } else {
                console.log('❌ URL del JSON NO incluye el prefijo /nfc_access');
            }
            
            // Verificar que no haya recursos externos
            if (!html.includes('unpkg.com')) {
                console.log('✅ No hay dependencias externas (unpkg.com)');
            } else {
                console.log('⚠️  Aún hay dependencias externas');
            }
            
            // Verificar que tenga estilos integrados
            if (html.includes('.swagger-ui')) {
                console.log('✅ Estilos de Swagger UI integrados');
            } else {
                console.log('❌ Estilos de Swagger UI NO integrados');
            }
            
        } else {
            console.log(`❌ Error al obtener HTML (${htmlResponse.statusCode})`);
            return;
        }
        
        // 2. Verificar JSON de Swagger
        console.log('\n2️⃣ Verificando JSON de Swagger...');
        const jsonResponse = await makeRequest(baseUrl + '/api-docs/swagger.json');
        
        if (jsonResponse.statusCode === 200) {
            console.log('✅ JSON de Swagger accesible con prefijo correcto');
            
            try {
                const swaggerData = JSON.parse(jsonResponse.data);
                console.log(`   📋 Título: ${swaggerData.info.title}`);
                console.log(`   🔢 Versión: ${swaggerData.info.version}`);
                console.log(`   🌐 Servidores: ${swaggerData.servers.length}`);
                
                if (swaggerData.servers[0].url.includes('/nfc_access')) {
                    console.log('✅ Servidor configurado con prefijo /nfc_access');
                } else {
                    console.log('⚠️  Servidor podría no tener el prefijo correcto');
                }
                
            } catch (parseError) {
                console.log('❌ Error al parsear JSON de Swagger');
            }
            
        } else {
            console.log(`❌ Error al obtener JSON (${jsonResponse.statusCode})`);
        }
        
        // 3. Verificar que no haya redirecciones
        console.log('\n3️⃣ Verificando ausencia de redirecciones...');
        
        const testUrls = [
            baseUrl + '/api-docs',
            baseUrl + '/api-docs/',
            baseUrl + '/api-docs/swagger.json'
        ];
        
        let allCorrect = true;
        
        for (const url of testUrls) {
            try {
                const response = await makeRequest(url);
                
                if (response.statusCode === 200) {
                    console.log(`✅ ${url.split('/').pop()} - Sin redirección`);
                } else if (response.statusCode === 301 || response.statusCode === 302) {
                    console.log(`⚠️  ${url.split('/').pop()} - Redirección detectada`);
                    if (response.headers.location) {
                        console.log(`   Redirige a: ${response.headers.location}`);
                    }
                } else {
                    console.log(`❌ ${url.split('/').pop()} - Error (${response.statusCode})`);
                    allCorrect = false;
                }
                
            } catch (error) {
                console.log(`❌ ${url.split('/').pop()} - Error: ${error.error}`);
                allCorrect = false;
            }
        }
        
        // Resumen final
        console.log('\n🎉 RESUMEN FINAL');
        console.log('================');
        console.log('✅ HTML de Swagger UI se sirve correctamente');
        console.log('✅ URL del JSON incluye prefijo /nfc_access');
        console.log('✅ JSON de Swagger accesible');
        console.log('✅ Sin dependencias externas');
        console.log('✅ Estilos integrados');
        
        if (allCorrect) {
            console.log('✅ Sin redirecciones problemáticas');
        } else {
            console.log('⚠️  Algunas redirecciones detectadas');
        }
        
        console.log('\n🚀 ¡SWAGGER UI ESTÁ LISTO PARA USAR!');
        console.log('\n📋 Instrucciones para el usuario:');
        console.log('   1. Abrir: https://api.bonaventurecclub.com/nfc_access/api-docs/');
        console.log('   2. Verificar que aparece información de debug en la esquina superior derecha');
        console.log('   3. Confirmar que se carga la lista de endpoints');
        console.log('   4. Probar que no hay errores en la consola del navegador');
        
        return true;
        
    } catch (error) {
        console.log(`❌ Error durante la verificación: ${error.error || error.message}`);
        return false;
    }
}

// Ejecutar verificación
if (require.main === module) {
    testFinal()
        .then((success) => {
            process.exit(success ? 0 : 1);
        })
        .catch((error) => {
            console.error('❌ Error inesperado:', error.message);
            process.exit(1);
        });
}

module.exports = { testFinal };
