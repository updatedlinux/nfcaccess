-- =====================================================
-- Script de creación de tablas para Sistema NFC Access
-- Compatible con MySQL 8.0.43
-- =====================================================

-- Crear tabla para tarjetas NFC
CREATE TABLE IF NOT EXISTS `condo360_nfc_cards` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `wp_user_id` BIGINT UNSIGNED NOT NULL COMMENT 'ID del usuario de WordPress',
    `card_uid` VARCHAR(32) NOT NULL UNIQUE COMMENT 'UID único de la tarjeta NFC',
    `label` VARCHAR(100) NULL COMMENT 'Descripción opcional de la tarjeta',
    `active` BOOLEAN DEFAULT TRUE COMMENT 'Estado activo/inactivo de la tarjeta',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de creación del registro',
    INDEX `idx_wp_user_id` (`wp_user_id`),
    INDEX `idx_card_uid` (`card_uid`),
    INDEX `idx_active` (`active`),
    FOREIGN KEY (`wp_user_id`) REFERENCES `wp_users`(`ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabla de tarjetas NFC asociadas a usuarios de WordPress';

-- Crear tabla para logs de acceso
CREATE TABLE IF NOT EXISTS `condo360_access_logs` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `card_id` BIGINT NOT NULL COMMENT 'ID de la tarjeta NFC',
    `access_type` ENUM('ingreso', 'salida') NOT NULL COMMENT 'Tipo de acceso: ingreso o salida',
    `timestamp` DATETIME NOT NULL COMMENT 'Fecha y hora del evento en GMT-4',
    `guard_user` VARCHAR(100) NULL COMMENT 'Nombre o ID del vigilante que registró el evento',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de creación del registro',
    INDEX `idx_card_id` (`card_id`),
    INDEX `idx_access_type` (`access_type`),
    INDEX `idx_timestamp` (`timestamp`),
    INDEX `idx_guard_user` (`guard_user`),
    FOREIGN KEY (`card_id`) REFERENCES `condo360_nfc_cards`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabla de logs de acceso vehicular';

-- Crear índices adicionales para optimizar consultas frecuentes
CREATE INDEX `idx_cards_user_active` ON `condo360_nfc_cards` (`wp_user_id`, `active`);
CREATE INDEX `idx_logs_card_timestamp` ON `condo360_access_logs` (`card_id`, `timestamp` DESC);

-- Insertar datos de ejemplo (opcional - comentar en producción)
-- INSERT INTO `condo360_nfc_cards` (`wp_user_id`, `card_uid`, `label`) VALUES 
-- (1, '12345678', 'Tarjeta vehículo principal'),
-- (1, '87654321', 'Tarjeta vehículo secundario');

-- Verificar que las tablas se crearon correctamente
SHOW TABLES LIKE 'condo360_%';

-- Mostrar estructura de las tablas creadas
DESCRIBE `condo360_nfc_cards`;
DESCRIBE `condo360_access_logs`;
