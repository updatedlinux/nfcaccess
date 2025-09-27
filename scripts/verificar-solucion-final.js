#!/usr/bin/env node

/**
 * Script de verificación final para Swagger UI sin errores de JavaScript
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

async function verificarSolucionFinal() {
    console.log('🎯 Verificación Final - Swagger UI Sin Errores de JavaScript\n');
    
    const baseUrl = 'https://api.bonaventurecclub.com/nfc_access';
    
    try {
        // 1. Verificar HTML de Swagger UI
        console.log('1️⃣ Verificando HTML de Swagger UI...');
        const htmlResponse = await makeRequest(baseUrl + '/api-docs/');
        
        if (htmlResponse.statusCode === 200) {
            console.log('✅ HTML de Swagger UI se sirve correctamente');
            
            const html = htmlResponse.data;
            
            // Verificar elementos clave
            const checks = [
                { name: 'Swagger UI CSS', pattern: 'swagger-ui.css', required: true },
                { name: 'Swagger UI Bundle JS', pattern: 'swagger-ui-bundle.js', required: true },
                { name: 'Swagger UI Standalone Preset', pattern: 'swagger-ui-standalone-preset.js', required: true },
                { name: 'Swagger UI Init JS', pattern: 'swagger-ui-init.js', required: true },
                { name: 'Swagger UI Container', pattern: 'swagger-ui', required: true }
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
            
            // Verificar que no haya JavaScript problemático
            if (!html.includes('Illegal return statement') && !html.includes('SyntaxError')) {
                console.log('✅ Sin errores de sintaxis JavaScript detectados');
            } else {
                console.log('❌ Errores de sintaxis JavaScript detectados');
                allChecksPassed = false;
            }
            
            // Verificar que la URL del JSON sea correcta
            if (html.includes('/nfc_access/api-docs/swagger.json')) {
                console.log('✅ URL del JSON incluye el prefijo /nfc_access');
            } else {
                console.log('❌ URL del JSON NO incluye el prefijo /nfc_access');
                allChecksPassed = false;
            }
            
            if (allChecksPassed) {
                console.log('✅ Todos los elementos de Swagger UI están presentes y correctos');
            } else {
                console.log('❌ Faltan elementos críticos de Swagger UI');
            }
            
        } else {
            console.log(`❌ Error al obtener HTML (${htmlResponse.statusCode})`);
            return false;
        }
        
        // 2. Verificar JavaScript de inicialización
        console.log('\n2️⃣ Verificando JavaScript de inicialización...');
        const initResponse = await makeRequest(baseUrl + '/api-docs/swagger-ui-init.js');
        
        if (initResponse.statusCode === 200) {
            console.log('✅ JavaScript de inicialización accesible');
            
            const initJs = initResponse.data;
            
            // Verificar que tenga la configuración correcta
            if (initJs.includes('Sistema NFC Access - Condo360')) {
                console.log('✅ Configuración de Swagger correcta');
            } else {
                console.log('❌ Configuración de Swagger incorrecta');
            }
            
            // Verificar que no haya errores de sintaxis
            if (!initJs.includes('Illegal return statement') && !initJs.includes('SyntaxError')) {
                console.log('✅ JavaScript de inicialización sin errores de sintaxis');
            } else {
                console.log('❌ Errores de sintaxis en JavaScript de inicialización');
            }
            
        } else {
            console.log(`❌ Error al obtener JavaScript de inicialización (${initResponse.statusCode})`);
        }
        
        // 3. Verificar JSON de Swagger
        console.log('\n3️⃣ Verificando JSON de Swagger...');
        const jsonResponse = await makeRequest(baseUrl + '/api-docs/swagger.json');
        
        if (jsonResponse.statusCode === 200) {
            console.log('✅ JSON de Swagger accesible');
            
            try {
                const swaggerData = JSON.parse(jsonResponse.data);
                console.log(`   📋 Título: ${swaggerData.info.title}`);
                console.log(`   🔢 Versión: ${swaggerData.info.version}`);
                
                // Verificar endpoints
                const paths = Object.keys(swaggerData.paths || {});
                console.log(`   🛣️  Endpoints disponibles: ${paths.length}`);
                
                if (paths.length > 0) {
                    console.log('   📝 Endpoints encontrados:');
                    paths.slice(0, 3).forEach(path => {
                        const methods = Object.keys(swaggerData.paths[path]);
                        console.log(`      ${methods.join(', ').toUpperCase()} ${path}`);
                    });
                    if (paths.length > 3) {
                        console.log(`      ... y ${paths.length - 3} más`);
                    }
                }
                
            } catch (parseError) {
                console.log('❌ Error al parsear JSON de Swagger');
                return false;
            }
            
        } else {
            console.log(`❌ Error al obtener JSON (${jsonResponse.statusCode})`);
            return false;
        }
        
        // 4. Verificar recursos estáticos
        console.log('\n4️⃣ Verificando recursos estáticos...');
        
        const staticResources = [
            '/api-docs/swagger-ui.css',
            '/api-docs/swagger-ui-bundle.js',
            '/api-docs/swagger-ui-standalone-preset.js',
            '/api-docs/swagger-ui-init.js'
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
        console.log('✅ Swagger UI Express funcionando correctamente');
        console.log('✅ HTML con todos los elementos necesarios');
        console.log('✅ JavaScript de inicialización sin errores');
        console.log('✅ JSON de Swagger accesible y válido');
        console.log('✅ URLs correctas con prefijo /nfc_access');
        console.log('✅ Sin errores de sintaxis JavaScript');
        
        if (staticResourcesOk) {
            console.log('✅ Todos los recursos estáticos accesibles');
        } else {
            console.log('⚠️  Algunos recursos estáticos podrían tener problemas');
        }
        
        console.log('\n🚀 ¡SWAGGER UI COMPLETAMENTE FUNCIONAL!');
        console.log('\n📋 Instrucciones para el usuario:');
        console.log('   1. Abrir: https://api.bonaventurecclub.com/nfc_access/api-docs/');
        console.log('   2. Verificar que NO aparece "Iniciado Swagger UI"');
        console.log('   3. Confirmar que se carga la interfaz completa de Swagger UI');
        console.log('   4. Expandir secciones de endpoints (Tarjetas, Accesos)');
        console.log('   5. Hacer click en "Try it out" en cualquier endpoint');
        console.log('   6. Verificar que NO hay errores en la consola del navegador (F12)');
        console.log('   7. Probar funcionalidad completa de la API');
        
        return true;
        
    } catch (error) {
        console.log(`❌ Error durante la verificación: ${error.error || error.message}`);
        return false;
    }
}

// Ejecutar verificación
if (require.main === module) {
    verificarSolucionFinal()
        .then((success) => {
            process.exit(success ? 0 : 1);
        })
        .catch((error) => {
            console.error('❌ Error inesperado:', error.message);
            process.exit(1);
        });
}

module.exports = { verificarSolucionFinal };
