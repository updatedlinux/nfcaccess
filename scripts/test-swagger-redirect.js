#!/usr/bin/env node

/**
 * Script específico para probar que Swagger UI no redirija incorrectamente
 */

const https = require('https');
const http = require('http');

// Configuración
const config = {
    production: {
        baseUrl: 'https://api.bonaventurecclub.com/nfc_access',
        timeout: 15000
    },
    development: {
        baseUrl: 'http://localhost:5000',
        timeout: 5000
    }
};

// Función para hacer requests HTTP/HTTPS
function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const isHttps = url.startsWith('https://');
        const client = isHttps ? https : http;
        
        const requestOptions = {
            timeout: options.timeout || 10000,
            headers: {
                'User-Agent': 'NFC-Access-Swagger-Test/1.0.0',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            },
            // Seguir redirecciones manualmente para detectar problemas
            maxRedirects: 0
        };
        
        const req = client.get(url, requestOptions, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    data: data,
                    url: url,
                    redirectLocation: res.headers.location
                });
            });
        });
        
        req.on('error', (error) => {
            reject({
                error: error.message,
                url: url
            });
        });
        
        req.on('timeout', () => {
            req.destroy();
            reject({
                error: 'Request timeout',
                url: url
            });
        });
    });
}

// Función para verificar redirecciones de Swagger UI
async function checkSwaggerRedirects(baseUrl) {
    console.log(`\n🔍 Verificando redirecciones de Swagger UI en: ${baseUrl}`);
    
    const swaggerDocsUrl = `${baseUrl}/api-docs/`;
    const swaggerJsonUrl = `${baseUrl}/api-docs/swagger.json`;
    
    try {
        console.log(`\n📚 Verificando Swagger UI: ${swaggerDocsUrl}`);
        const swaggerResponse = await makeRequest(swaggerDocsUrl);
        
        if (swaggerResponse.statusCode === 200) {
            console.log(`✅ Swagger UI carga correctamente (${swaggerResponse.statusCode})`);
            
            // Verificar que el HTML contenga las URLs correctas
            const html = swaggerResponse.data;
            
            // Verificar que no haya redirecciones incorrectas en el HTML
            const hasIncorrectRedirects = html.includes('href="/api-docs/') && !html.includes('href="/nfc_access/api-docs/');
            
            if (hasIncorrectRedirects) {
                console.log('❌ Se encontraron enlaces incorrectos en el HTML');
                return false;
            }
            
            // Verificar que el JSON de Swagger esté referenciado correctamente
            const hasCorrectJsonReference = html.includes('/nfc_access/api-docs/swagger.json') || html.includes('swagger.json');
            
            if (hasCorrectJsonReference) {
                console.log('✅ Referencias al JSON de Swagger son correctas');
            } else {
                console.log('⚠️  No se detectaron referencias correctas al JSON de Swagger');
            }
            
            // Verificar que no haya scripts que causen redirecciones
            const hasRedirectScripts = html.includes('window.location.href') && html.includes('/api-docs') && !html.includes('/nfc_access/api-docs');
            
            if (hasRedirectScripts) {
                console.log('❌ Se encontraron scripts que podrían causar redirecciones incorrectas');
                return false;
            }
            
        } else if (swaggerResponse.statusCode === 301 || swaggerResponse.statusCode === 302) {
            console.log(`❌ Redirección detectada (${swaggerResponse.statusCode})`);
            if (swaggerResponse.redirectLocation) {
                console.log(`   Redirige a: ${swaggerResponse.redirectLocation}`);
                
                // Verificar si la redirección es incorrecta
                if (swaggerResponse.redirectLocation.includes('/api-docs') && !swaggerResponse.redirectLocation.includes('/nfc_access/api-docs')) {
                    console.log('❌ Redirección incorrecta: no incluye el prefijo /nfc_access');
                    return false;
                } else {
                    console.log('✅ Redirección correcta');
                }
            }
        } else {
            console.log(`❌ Error inesperado (${swaggerResponse.statusCode})`);
            return false;
        }
        
        // Verificar el JSON de Swagger
        console.log(`\n📄 Verificando JSON de Swagger: ${swaggerJsonUrl}`);
        const jsonResponse = await makeRequest(swaggerJsonUrl);
        
        if (jsonResponse.statusCode === 200) {
            console.log(`✅ JSON de Swagger carga correctamente (${jsonResponse.statusCode})`);
            
            try {
                const swaggerData = JSON.parse(jsonResponse.data);
                
                // Verificar que los servidores estén configurados correctamente
                if (swaggerData.servers && swaggerData.servers.length > 0) {
                    const hasCorrectServer = swaggerData.servers.some(server => 
                        server.url.includes('/nfc_access') || server.url === ''
                    );
                    
                    if (hasCorrectServer) {
                        console.log('✅ Servidores configurados correctamente');
                    } else {
                        console.log('⚠️  Servidores podrían no estar configurados correctamente');
                    }
                }
                
            } catch (parseError) {
                console.log('⚠️  Error al parsear JSON de Swagger');
            }
            
        } else {
            console.log(`❌ Error al cargar JSON de Swagger (${jsonResponse.statusCode})`);
            return false;
        }
        
        return true;
        
    } catch (error) {
        console.log(`❌ Error al verificar Swagger UI: ${error.error || error.message}`);
        return false;
    }
}

// Función para verificar que no haya redirecciones automáticas
async function checkNoAutoRedirects(baseUrl) {
    console.log(`\n🚫 Verificando que no haya redirecciones automáticas`);
    
    const testUrls = [
        `${baseUrl}/api-docs`,
        `${baseUrl}/api-docs/`,
        `${baseUrl}/api-docs/index.html`
    ];
    
    let allCorrect = true;
    
    for (const url of testUrls) {
        try {
            console.log(`\n🔍 Probando: ${url}`);
            const response = await makeRequest(url);
            
            if (response.statusCode === 200) {
                console.log(`✅ Carga directamente sin redirección (${response.statusCode})`);
            } else if (response.statusCode === 301 || response.statusCode === 302) {
                console.log(`⚠️  Redirección detectada (${response.statusCode})`);
                if (response.redirectLocation) {
                    console.log(`   Redirige a: ${response.redirectLocation}`);
                    
                    // Verificar si la redirección es problemática
                    if (response.redirectLocation.includes('/api-docs') && !response.redirectLocation.includes('/nfc_access/api-docs')) {
                        console.log('❌ Redirección problemática: pierde el prefijo /nfc_access');
                        allCorrect = false;
                    } else {
                        console.log('✅ Redirección aceptable');
                    }
                }
            } else {
                console.log(`❌ Error inesperado (${response.statusCode})`);
                allCorrect = false;
            }
            
        } catch (error) {
            console.log(`❌ Error: ${error.error || error.message}`);
            allCorrect = false;
        }
    }
    
    return allCorrect;
}

// Función principal
async function main() {
    console.log('🚀 Verificación específica de redirecciones de Swagger UI\n');
    
    const environment = process.argv[2] || 'production';
    const envConfig = config[environment];
    
    if (!envConfig) {
        console.log('❌ Entorno no válido. Use: production o development');
        process.exit(1);
    }
    
    console.log(`🌐 Verificando entorno: ${environment}`);
    console.log(`🔗 URL base: ${envConfig.baseUrl}\n`);
    
    // Verificaciones específicas
    const swaggerResult = await checkSwaggerRedirects(envConfig.baseUrl);
    const noRedirectResult = await checkNoAutoRedirects(envConfig.baseUrl);
    
    // Resumen
    console.log('\n📊 RESUMEN DE VERIFICACIÓN');
    console.log('========================');
    console.log(`Swagger UI sin redirecciones incorrectas: ${swaggerResult ? '✅ OK' : '❌ Error'}`);
    console.log(`Sin redirecciones automáticas problemáticas: ${noRedirectResult ? '✅ OK' : '❌ Error'}`);
    
    const totalPassed = (swaggerResult ? 1 : 0) + (noRedirectResult ? 1 : 0);
    const totalChecks = 2;
    
    console.log(`\n🎯 Total: ${totalPassed}/${totalChecks} verificaciones pasaron`);
    
    if (totalPassed === totalChecks) {
        console.log('\n🎉 ¡Swagger UI funciona correctamente sin redirecciones problemáticas!');
        console.log('✅ La documentación debería cargar correctamente en el navegador');
        process.exit(0);
    } else {
        console.log('\n⚠️  Se detectaron problemas con las redirecciones de Swagger UI');
        console.log('🔧 Revisa la configuración del proxy inverso y el backend');
        process.exit(1);
    }
}

// Manejo de errores
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Error no manejado:', reason);
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Excepción no capturada:', error.message);
    process.exit(1);
});

// Ejecutar si es llamado directamente
if (require.main === module) {
    main().catch((error) => {
        console.error('❌ Error en la verificación:', error.message);
        process.exit(1);
    });
}

module.exports = {
    checkSwaggerRedirects,
    checkNoAutoRedirects
};
