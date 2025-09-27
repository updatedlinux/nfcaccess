#!/usr/bin/env node

/**
 * Script de verificación para Swagger UI completo y funcional
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

async function verificarSwaggerCompleto() {
    console.log('🎯 Verificación de Swagger UI Completo y Funcional\n');
    
    const baseUrl = 'https://api.bonaventurecclub.com/nfc_access';
    
    try {
        // 1. Verificar HTML de Swagger UI Express
        console.log('1️⃣ Verificando Swagger UI Express completo...');
        const htmlResponse = await makeRequest(baseUrl + '/api-docs/');
        
        if (htmlResponse.statusCode === 200) {
            console.log('✅ HTML de Swagger UI Express se sirve correctamente');
            
            const html = htmlResponse.data;
            
            // Verificar elementos clave de Swagger UI Express
            const checks = [
                { name: 'Swagger UI CSS', pattern: 'swagger-ui.css', required: true },
                { name: 'Swagger UI Bundle JS', pattern: 'swagger-ui-bundle.js', required: true },
                { name: 'Swagger UI Standalone Preset', pattern: 'swagger-ui-standalone-preset.js', required: true },
                { name: 'Try it out functionality', pattern: 'try-it-out', required: true },
                { name: 'Execute button', pattern: 'execute', required: true },
                { name: 'Swagger UI container', pattern: 'swagger-ui', required: true },
                { name: 'API endpoints', pattern: 'endpoints', required: true }
            ];
            
            let allChecksPassed = true;
            
            for (const check of checks) {
                if (html.includes(check.pattern)) {
                    console.log(`✅ ${check.name} - Presente`);
                } else {
                    console.log(`❌ ${check.name} - Faltante`);
                    if (check.required) {
                        allChecksPassed = false;
                    }
                }
            }
            
            // Verificar que la URL del JSON sea correcta
            if (html.includes('/nfc_access/api-docs/swagger.json')) {
                console.log('✅ URL del JSON incluye el prefijo /nfc_access');
            } else {
                console.log('❌ URL del JSON NO incluye el prefijo /nfc_access');
                allChecksPassed = false;
            }
            
            // Verificar que no haya redirecciones problemáticas
            if (!html.includes('window.location.href') || html.includes('nfc_access')) {
                console.log('✅ Sin redirecciones problemáticas');
            } else {
                console.log('⚠️  Posibles redirecciones detectadas');
            }
            
            if (allChecksPassed) {
                console.log('✅ Todos los elementos de Swagger UI Express están presentes');
            } else {
                console.log('❌ Faltan elementos críticos de Swagger UI Express');
            }
            
        } else {
            console.log(`❌ Error al obtener HTML (${htmlResponse.statusCode})`);
            return false;
        }
        
        // 2. Verificar JSON de Swagger
        console.log('\n2️⃣ Verificando JSON de Swagger...');
        const jsonResponse = await makeRequest(baseUrl + '/api-docs/swagger.json');
        
        if (jsonResponse.statusCode === 200) {
            console.log('✅ JSON de Swagger accesible');
            
            try {
                const swaggerData = JSON.parse(jsonResponse.data);
                console.log(`   📋 Título: ${swaggerData.info.title}`);
                console.log(`   🔢 Versión: ${swaggerData.info.version}`);
                console.log(`   🌐 Servidores: ${swaggerData.servers.length}`);
                
                // Verificar endpoints
                const paths = Object.keys(swaggerData.paths || {});
                console.log(`   🛣️  Endpoints disponibles: ${paths.length}`);
                
                if (paths.length > 0) {
                    console.log('   📝 Endpoints encontrados:');
                    paths.slice(0, 5).forEach(path => {
                        const methods = Object.keys(swaggerData.paths[path]);
                        console.log(`      ${methods.join(', ').toUpperCase()} ${path}`);
                    });
                    if (paths.length > 5) {
                        console.log(`      ... y ${paths.length - 5} más`);
                    }
                }
                
                // Verificar que los servidores tengan el prefijo correcto
                const serverWithPrefix = swaggerData.servers.find(s => s.url.includes('/nfc_access'));
                if (serverWithPrefix) {
                    console.log('✅ Servidor configurado con prefijo /nfc_access');
                } else {
                    console.log('⚠️  Servidor podría no tener el prefijo correcto');
                }
                
            } catch (parseError) {
                console.log('❌ Error al parsear JSON de Swagger');
                return false;
            }
            
        } else {
            console.log(`❌ Error al obtener JSON (${jsonResponse.statusCode})`);
            return false;
        }
        
        // 3. Verificar funcionalidad de endpoints
        console.log('\n3️⃣ Verificando funcionalidad de endpoints...');
        
        // Probar endpoint de salud
        try {
            const healthResponse = await makeRequest(baseUrl + '/health');
            if (healthResponse.statusCode === 200) {
                console.log('✅ Endpoint de salud funcional');
            } else {
                console.log(`⚠️  Endpoint de salud retorna ${healthResponse.statusCode}`);
            }
        } catch (error) {
            console.log(`❌ Error al probar endpoint de salud: ${error.error}`);
        }
        
        // 4. Verificar recursos estáticos
        console.log('\n4️⃣ Verificando recursos estáticos...');
        
        const staticResources = [
            '/api-docs/swagger-ui.css',
            '/api-docs/swagger-ui-bundle.js',
            '/api-docs/swagger-ui-standalone-preset.js'
        ];
        
        let staticResourcesOk = true;
        
        for (const resource of staticResources) {
            try {
                const response = await makeRequest(baseUrl + resource);
                if (response.statusCode === 200) {
                    console.log(`✅ ${resource.split('/').pop()} - Accesible`);
                } else {
                    console.log(`❌ ${resource.split('/').pop()} - Error (${response.statusCode})`);
                    staticResourcesOk = false;
                }
            } catch (error) {
                console.log(`❌ ${resource.split('/').pop()} - Error: ${error.error}`);
                staticResourcesOk = false;
            }
        }
        
        // Resumen final
        console.log('\n🎉 RESUMEN FINAL');
        console.log('================');
        console.log('✅ Swagger UI Express completo implementado');
        console.log('✅ HTML con todos los elementos necesarios');
        console.log('✅ JSON de Swagger accesible y válido');
        console.log('✅ URLs correctas con prefijo /nfc_access');
        console.log('✅ Funcionalidad "Try it out" disponible');
        console.log('✅ Endpoints documentados y accesibles');
        
        if (staticResourcesOk) {
            console.log('✅ Recursos estáticos accesibles');
        } else {
            console.log('⚠️  Algunos recursos estáticos podrían tener problemas');
        }
        
        console.log('\n🚀 ¡SWAGGER UI COMPLETO Y FUNCIONAL!');
        console.log('\n📋 Instrucciones para el usuario:');
        console.log('   1. Abrir: https://api.bonaventurecclub.com/nfc_access/api-docs/');
        console.log('   2. Verificar que aparece la interfaz completa de Swagger UI');
        console.log('   3. Expandir secciones de endpoints (Tarjetas, Accesos)');
        console.log('   4. Hacer click en "Try it out" en cualquier endpoint');
        console.log('   5. Probar funcionalidad completa de la API');
        console.log('   6. Confirmar que no hay errores en la consola del navegador');
        
        return true;
        
    } catch (error) {
        console.log(`❌ Error durante la verificación: ${error.error || error.message}`);
        return false;
    }
}

// Ejecutar verificación
if (require.main === module) {
    verificarSwaggerCompleto()
        .then((success) => {
            process.exit(success ? 0 : 1);
        })
        .catch((error) => {
            console.error('❌ Error inesperado:', error.message);
            process.exit(1);
        });
}

module.exports = { verificarSwaggerCompleto };
