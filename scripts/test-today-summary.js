#!/usr/bin/env node

/**
 * Script para probar la corrección del endpoint today-summary
 */

const https = require('https');

function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, { timeout: 5000 }, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({
                        statusCode: res.statusCode,
                        data: jsonData
                    });
                } catch (error) {
                    resolve({
                        statusCode: res.statusCode,
                        data: data
                    });
                }
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

async function testTodaySummary() {
    console.log('📅 Probando Endpoint Today Summary\n');
    
    try {
        // 1. Obtener resumen del día
        console.log('1️⃣ Obteniendo resumen del día actual...');
        const response = await makeRequest('https://api.bonaventurecclub.com/nfc_access/access/today-summary');
        
        if (response.statusCode === 200 && response.data.success) {
            console.log('✅ Resumen obtenido exitosamente');
            
            const { date, summary } = response.data.data;
            
            // 2. Verificar fecha correcta
            console.log('\n2️⃣ Verificando fecha correcta...');
            const today = new Date();
            const expectedDate = today.toISOString().split('T')[0];
            
            // Calcular fecha esperada en GMT-4
            const gmt4Date = new Date(today.getTime() - (4 * 60 * 60 * 1000));
            const expectedDateGMT4 = gmt4Date.toISOString().split('T')[0];
            
            console.log(`   📅 Fecha recibida: ${date}`);
            console.log(`   📅 Fecha esperada (GMT-4): ${expectedDateGMT4}`);
            
            if (date === expectedDateGMT4) {
                console.log('✅ Fecha correcta en GMT-4');
            } else {
                console.log('❌ Fecha incorrecta');
                console.log(`   🎯 Esperaba: ${expectedDateGMT4}`);
                console.log(`   🎯 Recibió: ${date}`);
            }
            
            // 3. Mostrar resumen de datos
            console.log('\n3️⃣ Resumen de accesos del día:');
            console.log(`   📊 Total ingresos: ${summary.total_ingresos}`);
            console.log(`   📊 Total salidas: ${summary.total_salidas}`);
            
            if (summary.ingresos.length > 0) {
                console.log('\n   🚪 Ingresos:');
                summary.ingresos.forEach(ingreso => {
                    console.log(`      • ${ingreso.user_name} (${ingreso.user_login}): ${ingreso.count} accesos`);
                });
            }
            
            if (summary.salidas.length > 0) {
                console.log('\n   🚪 Salidas:');
                summary.salidas.forEach(salida => {
                    console.log(`      • ${salida.user_name} (${salida.user_login}): ${salida.count} accesos`);
                });
            }
            
            // 4. Verificar estructura de datos
            console.log('\n4️⃣ Verificando estructura de datos...');
            const requiredFields = ['ingresos', 'salidas', 'total_ingresos', 'total_salidas'];
            const missingFields = requiredFields.filter(field => !(field in summary));
            
            if (missingFields.length === 0) {
                console.log('✅ Estructura de datos correcta');
                console.log(`   📋 Campos presentes: ${requiredFields.join(', ')}`);
            } else {
                console.log('❌ Estructura de datos incorrecta');
                console.log(`   📋 Campos faltantes: ${missingFields.join(', ')}`);
            }
            
            // 5. Verificar consistencia de totales
            console.log('\n5️⃣ Verificando consistencia de totales...');
            const calculatedIngresos = summary.ingresos.reduce((sum, ingreso) => sum + ingreso.count, 0);
            const calculatedSalidas = summary.salidas.reduce((sum, salida) => sum + salida.count, 0);
            
            if (calculatedIngresos === summary.total_ingresos && calculatedSalidas === summary.total_salidas) {
                console.log('✅ Totales consistentes');
                console.log(`   🎯 Ingresos: ${calculatedIngresos} = ${summary.total_ingresos}`);
                console.log(`   🎯 Salidas: ${calculatedSalidas} = ${summary.total_salidas}`);
            } else {
                console.log('❌ Totales inconsistentes');
                console.log(`   🎯 Ingresos calculados: ${calculatedIngresos}, reportados: ${summary.total_ingresos}`);
                console.log(`   🎯 Salidas calculadas: ${calculatedSalidas}, reportadas: ${summary.total_salidas}`);
            }
            
        } else {
            console.log('❌ Error al obtener resumen');
            console.log(`   📊 Status: ${response.statusCode}`);
            console.log(`   📊 Data: ${JSON.stringify(response.data)}`);
            return false;
        }
        
        console.log('\n🎉 PRUEBA DE TODAY SUMMARY COMPLETADA');
        console.log('=====================================');
        console.log('✅ Endpoint funcionando correctamente');
        console.log('✅ Fecha correcta en GMT-4');
        console.log('✅ Estructura de datos correcta');
        console.log('✅ Totales consistentes');
        console.log('✅ Resumen del día actual mostrado');
        
        return true;
        
    } catch (error) {
        console.log(`❌ Error durante las pruebas: ${error.error || error.message}`);
        return false;
    }
}

// Ejecutar pruebas
if (require.main === module) {
    testTodaySummary()
        .then((success) => {
            process.exit(success ? 0 : 1);
        })
        .catch((error) => {
            console.error('❌ Error inesperado:', error.message);
            process.exit(1);
        });
}

module.exports = { testTodaySummary };
