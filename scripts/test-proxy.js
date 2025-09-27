#!/usr/bin/env node

/**
 * Script para verificar que el proxy inverso funcione correctamente
 * con Swagger UI
 */

const https = require('https');
const http = require('http');

// Configuración
const config = {
    production: {
        baseUrl: 'https://api.bonaventurecclub.com/nfc_access',
        timeout: 10000
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
                'User-Agent': 'NFC-Access-Test-Script/1.0.0'
            }
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
                    url: url
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

// Función para verificar una URL
async function checkUrl(url, expectedStatus = 200) {
    try {
        console.log(`🔍 Verificando: ${url}`);
        const response = await makeRequest(url);
        
        if (response.statusCode === expectedStatus) {
            console.log(`✅ OK (${response.statusCode})`);
            return true;
        } else {
            console.log(`❌ Error (${response.statusCode}) - Esperado: ${expectedStatus}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ Error: ${error.error || error.message}`);
        return false;
    }
}

// Función para verificar Swagger UI específicamente
async function checkSwaggerUI(baseUrl) {
    console.log(`\n📚 Verificando Swagger UI en: ${baseUrl}`);
    
    const checks = [
        { url: `${baseUrl}/`, expectedStatus: 200, name: 'API Info' },
        { url: `${baseUrl}/health`, expectedStatus: 200, name: 'Health Check' },
        { url: `${baseUrl}/api-docs/swagger.json`, expectedStatus: 200, name: 'Swagger JSON' },
        { url: `${baseUrl}/api-docs/`, expectedStatus: 200, name: 'Swagger UI' }
    ];
    
    let passed = 0;
    let total = checks.length;
    
    for (const check of checks) {
        console.log(`\n🔍 ${check.name}:`);
        const result = await checkUrl(check.url, check.expectedStatus);
        if (result) passed++;
    }
    
    return { passed, total };
}

// Función para verificar recursos estáticos
async function checkStaticResources(baseUrl) {
    console.log(`\n📦 Verificando recursos estáticos en: ${baseUrl}`);
    
    try {
        const response = await makeRequest(`${baseUrl}/api-docs/`);
        
        if (response.statusCode === 200) {
            // Verificar que el HTML contenga referencias correctas
            const html = response.data;
            
            // Verificar que no haya redirecciones absolutas incorrectas
            const hasIncorrectRedirects = html.includes('href="/api-docs/') && !html.includes('href="/nfc_access/api-docs/');
            
            if (hasIncorrectRedirects) {
                console.log('❌ Se encontraron redirecciones absolutas incorrectas');
                return false;
            }
            
            // Verificar que los recursos estén referenciados correctamente
            const hasCorrectResources = html.includes('swagger-ui') || html.includes('swagger-ui-bundle');
            
            if (hasCorrectResources) {
                console.log('✅ Recursos estáticos configurados correctamente');
                return true;
            } else {
                console.log('⚠️  No se detectaron recursos de Swagger UI');
                return false;
            }
        } else {
            console.log(`❌ No se pudo cargar Swagger UI (${response.statusCode})`);
            return false;
        }
    } catch (error) {
        console.log(`❌ Error al verificar recursos estáticos: ${error.error || error.message}`);
        return false;
    }
}

// Función para verificar headers de proxy
async function checkProxyHeaders(baseUrl) {
    console.log(`\n🔧 Verificando headers de proxy en: ${baseUrl}`);
    
    try {
        const response = await makeRequest(`${baseUrl}/health`);
        
        if (response.statusCode === 200) {
            const headers = response.headers;
            
            // Verificar headers importantes
            const importantHeaders = [
                'x-forwarded-proto',
                'x-forwarded-for',
                'x-forwarded-host',
                'x-real-ip'
            ];
            
            let foundHeaders = 0;
            for (const header of importantHeaders) {
                if (headers[header]) {
                    console.log(`✅ ${header}: ${headers[header]}`);
                    foundHeaders++;
                } else {
                    console.log(`⚠️  ${header}: No encontrado`);
                }
            }
            
            if (foundHeaders > 0) {
                console.log(`✅ Se detectaron ${foundHeaders} headers de proxy`);
                return true;
            } else {
                console.log('⚠️  No se detectaron headers de proxy');
                return false;
            }
        } else {
            console.log(`❌ No se pudo verificar headers (${response.statusCode})`);
            return false;
        }
    } catch (error) {
        console.log(`❌ Error al verificar headers: ${error.error || error.message}`);
        return false;
    }
}

// Función principal
async function main() {
    console.log('🚀 Iniciando verificación del proxy inverso para NFC Access\n');
    
    const environment = process.argv[2] || 'production';
    const envConfig = config[environment];
    
    if (!envConfig) {
        console.log('❌ Entorno no válido. Use: production o development');
        process.exit(1);
    }
    
    console.log(`🌐 Verificando entorno: ${environment}`);
    console.log(`🔗 URL base: ${envConfig.baseUrl}\n`);
    
    // Verificaciones principales
    const swaggerResult = await checkSwaggerUI(envConfig.baseUrl);
    const staticResult = await checkStaticResources(envConfig.baseUrl);
    const proxyResult = await checkProxyHeaders(envConfig.baseUrl);
    
    // Resumen
    console.log('\n📊 RESUMEN DE VERIFICACIÓN');
    console.log('========================');
    console.log(`Swagger UI: ${swaggerResult.passed}/${swaggerResult.total} verificaciones pasaron`);
    console.log(`Recursos estáticos: ${staticResult ? '✅ OK' : '❌ Error'}`);
    console.log(`Headers de proxy: ${proxyResult ? '✅ OK' : '❌ Error'}`);
    
    const totalPassed = swaggerResult.passed + (staticResult ? 1 : 0) + (proxyResult ? 1 : 0);
    const totalChecks = swaggerResult.total + 2;
    
    console.log(`\n🎯 Total: ${totalPassed}/${totalChecks} verificaciones pasaron`);
    
    if (totalPassed === totalChecks) {
        console.log('\n🎉 ¡Todas las verificaciones pasaron! El proxy inverso está configurado correctamente.');
        process.exit(0);
    } else {
        console.log('\n⚠️  Algunas verificaciones fallaron. Revisa la configuración del proxy.');
        process.exit(1);
    }
}

// Manejo de errores no capturados
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
    checkUrl,
    checkSwaggerUI,
    checkStaticResources,
    checkProxyHeaders
};
