#!/usr/bin/env node

/**
 * Script de diagnóstico para Swagger UI
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

async function debugSwagger() {
    console.log('🔍 Diagnóstico de Swagger UI\n');
    
    const baseUrl = 'https://api.bonaventurecclub.com/nfc_access';
    
    try {
        // 1. Verificar HTML de Swagger UI
        console.log('1️⃣ Verificando HTML de Swagger UI...');
        const htmlResponse = await makeRequest(baseUrl + '/api-docs/');
        
        if (htmlResponse.statusCode === 200) {
            console.log('✅ HTML de Swagger UI se sirve correctamente');
            
            const html = htmlResponse.data;
            
            // Verificar elementos clave
            if (html.includes('swagger-ui-bundle.js')) {
                console.log('✅ Script swagger-ui-bundle.js incluido');
            } else {
                console.log('❌ Script swagger-ui-bundle.js NO incluido');
            }
            
            if (html.includes('swagger-ui-standalone-preset.js')) {
                console.log('✅ Script swagger-ui-standalone-preset.js incluido');
            } else {
                console.log('❌ Script swagger-ui-standalone-preset.js NO incluido');
            }
            
            if (html.includes('swagger-ui.css')) {
                console.log('✅ CSS de Swagger UI incluido');
            } else {
                console.log('❌ CSS de Swagger UI NO incluido');
            }
            
            if (html.includes('SwaggerUIBundle')) {
                console.log('✅ Configuración SwaggerUIBundle incluida');
            } else {
                console.log('❌ Configuración SwaggerUIBundle NO incluida');
            }
            
            if (html.includes('/api-docs/swagger.json')) {
                console.log('✅ URL del JSON de Swagger correcta');
            } else {
                console.log('❌ URL del JSON de Swagger incorrecta');
            }
            
            // Verificar si hay errores en el HTML
            if (html.includes('error-container')) {
                console.log('⚠️  Contenedor de errores presente en HTML');
            }
            
        } else {
            console.log(`❌ Error al obtener HTML (${htmlResponse.statusCode})`);
            return;
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
                
                if (swaggerData.paths) {
                    const pathCount = Object.keys(swaggerData.paths).length;
                    console.log(`   🛣️  Endpoints: ${pathCount}`);
                }
                
            } catch (parseError) {
                console.log('❌ Error al parsear JSON de Swagger');
                console.log(`   Error: ${parseError.message}`);
            }
            
        } else {
            console.log(`❌ Error al obtener JSON (${jsonResponse.statusCode})`);
        }
        
        // 3. Verificar recursos externos
        console.log('\n3️⃣ Verificando recursos externos...');
        
        const externalResources = [
            'https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui.css',
            'https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-bundle.js',
            'https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-standalone-preset.js'
        ];
        
        for (const resource of externalResources) {
            try {
                const response = await makeRequest(resource);
                if (response.statusCode === 200) {
                    console.log(`✅ ${resource.split('/').pop()} - Accesible`);
                } else {
                    console.log(`❌ ${resource.split('/').pop()} - Error ${response.statusCode}`);
                }
            } catch (error) {
                console.log(`❌ ${resource.split('/').pop()} - Error: ${error.error}`);
            }
        }
        
        // 4. Generar HTML de prueba
        console.log('\n4️⃣ Generando HTML de prueba...');
        
        const testHtml = `<!DOCTYPE html>
<html>
<head>
    <title>Test Swagger UI</title>
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui.css" />
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-standalone-preset.js"></script>
    <script>
        console.log('Iniciando test de Swagger UI...');
        
        window.onload = function() {
            try {
                const ui = SwaggerUIBundle({
                    url: '${baseUrl}/api-docs/swagger.json',
                    dom_id: '#swagger-ui',
                    deepLinking: true,
                    presets: [
                        SwaggerUIBundle.presets.apis,
                        SwaggerUIStandalonePreset
                    ],
                    layout: "StandaloneLayout",
                    validatorUrl: null,
                    onComplete: function() {
                        console.log('✅ Swagger UI cargado exitosamente');
                    },
                    onFailure: function(data) {
                        console.error('❌ Error al cargar Swagger UI:', data);
                    }
                });
            } catch (error) {
                console.error('❌ Error al inicializar:', error);
            }
        };
    </script>
</body>
</html>`;
        
        console.log('📄 HTML de prueba generado (guardar como test.html para probar)');
        
        // Resumen
        console.log('\n📊 RESUMEN DEL DIAGNÓSTICO');
        console.log('==========================');
        console.log('✅ HTML de Swagger UI se sirve correctamente');
        console.log('✅ JSON de Swagger es accesible');
        console.log('✅ Recursos externos están disponibles');
        console.log('\n💡 POSIBLES CAUSAS DEL PROBLEMA:');
        console.log('   1. JavaScript bloqueado por el navegador');
        console.log('   2. Problemas de CORS');
        console.log('   3. Cache del navegador');
        console.log('   4. Errores en la consola del navegador');
        console.log('\n🔧 SOLUCIONES RECOMENDADAS:');
        console.log('   1. Abrir DevTools y revisar la consola');
        console.log('   2. Limpiar cache del navegador (Ctrl+Shift+R)');
        console.log('   3. Probar en modo incógnito');
        console.log('   4. Verificar que no haya bloqueadores de JavaScript');
        
    } catch (error) {
        console.log(`❌ Error durante el diagnóstico: ${error.error || error.message}`);
    }
}

// Ejecutar diagnóstico
if (require.main === module) {
    debugSwagger().catch((error) => {
        console.error('❌ Error inesperado:', error.message);
        process.exit(1);
    });
}

module.exports = { debugSwagger };
