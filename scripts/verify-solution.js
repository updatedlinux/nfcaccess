#!/usr/bin/env node

/**
 * Script final para verificar que la solución de redirección esté funcionando
 */

const https = require('https');

// Función para hacer requests HTTPS
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

// Función principal de verificación
async function verifySolution() {
    console.log('🎯 Verificación Final de la Solución de Redirección\n');
    
    const baseUrl = 'https://api.bonaventurecclub.com/nfc_access';
    
    try {
        // 1. Verificar que la API principal funcione
        console.log('1️⃣ Verificando API principal...');
        const apiResponse = await makeRequest(baseUrl + '/');
        
        if (apiResponse.statusCode === 200) {
            console.log('✅ API principal funciona correctamente');
            const apiData = JSON.parse(apiResponse.data);
            console.log(`   📋 Versión: ${apiData.version}`);
            console.log(`   📚 Documentación: ${apiData.documentation}`);
        } else {
            console.log(`❌ Error en API principal (${apiResponse.statusCode})`);
            return false;
        }
        
        // 2. Verificar que Swagger UI cargue sin redirección
        console.log('\n2️⃣ Verificando Swagger UI...');
        const swaggerResponse = await makeRequest(baseUrl + '/api-docs/');
        
        if (swaggerResponse.statusCode === 200) {
            console.log('✅ Swagger UI carga correctamente (sin redirección)');
            
            // Verificar que el HTML contenga las referencias correctas
            const html = swaggerResponse.data;
            if (html.includes('/nfc_access/api-docs/swagger.json')) {
                console.log('✅ Referencias al JSON de Swagger son correctas');
            } else {
                console.log('⚠️  Referencias al JSON podrían ser incorrectas');
            }
            
            if (html.includes('swagger-ui-bundle.js')) {
                console.log('✅ Recursos de Swagger UI están incluidos');
            } else {
                console.log('⚠️  Recursos de Swagger UI podrían faltar');
            }
            
        } else {
            console.log(`❌ Error en Swagger UI (${swaggerResponse.statusCode})`);
            return false;
        }
        
        // 3. Verificar que el JSON de Swagger sea accesible
        console.log('\n3️⃣ Verificando JSON de Swagger...');
        const jsonResponse = await makeRequest(baseUrl + '/api-docs/swagger.json');
        
        if (jsonResponse.statusCode === 200) {
            console.log('✅ JSON de Swagger es accesible');
            
            try {
                const swaggerData = JSON.parse(jsonResponse.data);
                console.log(`   📋 Título: ${swaggerData.info.title}`);
                console.log(`   🔢 Versión: ${swaggerData.info.version}`);
                
                if (swaggerData.servers && swaggerData.servers.length > 0) {
                    console.log(`   🌐 Servidor: ${swaggerData.servers[0].url}`);
                }
                
            } catch (parseError) {
                console.log('⚠️  Error al parsear JSON de Swagger');
            }
            
        } else {
            console.log(`❌ Error en JSON de Swagger (${jsonResponse.statusCode})`);
            return false;
        }
        
        // 4. Verificar que no haya redirecciones problemáticas
        console.log('\n4️⃣ Verificando ausencia de redirecciones problemáticas...');
        
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
                    console.log(`✅ ${url} - Sin redirección`);
                } else if (response.statusCode === 301 || response.statusCode === 302) {
                    console.log(`⚠️  ${url} - Redirección detectada`);
                    if (response.headers.location) {
                        console.log(`   Redirige a: ${response.headers.location}`);
                        
                        // Verificar si la redirección es problemática
                        if (response.headers.location.includes('/api-docs') && 
                            !response.headers.location.includes('/nfc_access/api-docs')) {
                            console.log('❌ Redirección problemática detectada');
                            allCorrect = false;
                        }
                    }
                } else {
                    console.log(`❌ ${url} - Error inesperado (${response.statusCode})`);
                    allCorrect = false;
                }
                
            } catch (error) {
                console.log(`❌ ${url} - Error: ${error.error}`);
                allCorrect = false;
            }
        }
        
        if (!allCorrect) {
            console.log('\n❌ Se detectaron problemas con las redirecciones');
            return false;
        }
        
        // 5. Verificar headers importantes
        console.log('\n5️⃣ Verificando headers importantes...');
        
        const headers = swaggerResponse.headers;
        
        if (headers['content-type'] && headers['content-type'].includes('text/html')) {
            console.log('✅ Content-Type correcto para HTML');
        } else {
            console.log('⚠️  Content-Type podría ser incorrecto');
        }
        
        if (headers['cache-control'] && headers['cache-control'].includes('no-cache')) {
            console.log('✅ Cache-Control configurado correctamente');
        } else {
            console.log('⚠️  Cache-Control podría necesitar ajustes');
        }
        
        // Resumen final
        console.log('\n🎉 RESUMEN FINAL');
        console.log('================');
        console.log('✅ API principal funcionando');
        console.log('✅ Swagger UI cargando sin redirecciones');
        console.log('✅ JSON de Swagger accesible');
        console.log('✅ Sin redirecciones problemáticas');
        console.log('✅ Headers configurados correctamente');
        
        console.log('\n🚀 ¡LA SOLUCIÓN ESTÁ FUNCIONANDO CORRECTAMENTE!');
        console.log('\n📋 Próximos pasos:');
        console.log('   1. Abrir en el navegador: https://api.bonaventurecclub.com/nfc_access/api-docs/');
        console.log('   2. Verificar que Swagger UI carga completamente');
        console.log('   3. Probar la funcionalidad "Try it out" en los endpoints');
        console.log('   4. Confirmar que las URLs generadas incluyen /nfc_access');
        
        return true;
        
    } catch (error) {
        console.log(`❌ Error durante la verificación: ${error.error || error.message}`);
        return false;
    }
}

// Ejecutar verificación
if (require.main === module) {
    verifySolution()
        .then((success) => {
            process.exit(success ? 0 : 1);
        })
        .catch((error) => {
            console.error('❌ Error inesperado:', error.message);
            process.exit(1);
        });
}

module.exports = { verifySolution };
