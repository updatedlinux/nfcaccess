const swaggerJSDoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Sistema NFC Access - Condo360',
            version: '1.0.0',
            description: 'API para gestión de acceso vehicular mediante tarjetas NFC MIFARE Classic',
            contact: {
                name: 'Condo360',
                email: 'soporte@condo360.com'
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT'
            }
        },
        servers: [
            {
                url: 'https://api.bonaventurecclub.com/nfc_access',
                description: 'Servidor de producción'
            },
            {
                url: 'http://localhost:5000',
                description: 'Servidor de desarrollo'
            }
        ],
        components: {
            schemas: {
                Error: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false
                        },
                        message: {
                            type: 'string',
                            example: 'Mensaje de error'
                        }
                    }
                },
                Success: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: true
                        },
                        message: {
                            type: 'string',
                            example: 'Operación exitosa'
                        }
                    }
                }
            },
            responses: {
                BadRequest: {
                    description: 'Solicitud incorrecta',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error'
                            }
                        }
                    }
                },
                NotFound: {
                    description: 'Recurso no encontrado',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error'
                            }
                        }
                    }
                },
                InternalServerError: {
                    description: 'Error interno del servidor',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error'
                            }
                        }
                    }
                }
            }
        },
        tags: [
            {
                name: 'Tarjetas',
                description: 'Operaciones relacionadas con tarjetas NFC'
            },
            {
                name: 'Accesos',
                description: 'Operaciones relacionadas con logs de acceso'
            },
            {
                name: 'Sistema',
                description: 'Operaciones del sistema'
            }
        ]
    },
    apis: [
        './routes/*.js',
        './controllers/*.js'
    ]
};

const specs = swaggerJSDoc(options);

module.exports = specs;
