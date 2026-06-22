<?php
require_once __DIR__ . '/api/config/db.php';

try {
    $pdo = Database::getConnection();
    $sql = "
    CREATE TABLE IF NOT EXISTS parametros_nomina (
        id INT AUTO_INCREMENT PRIMARY KEY,
        anio INT NOT NULL UNIQUE,
        salario_minimo DECIMAL(12,2) NOT NULL DEFAULT 0,
        auxilio_transporte DECIMAL(12,2) NOT NULL DEFAULT 0,
        aplica_exoneracion TINYINT(1) NOT NULL DEFAULT 0,
        estado TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ";
    
    $pdo->exec($sql);
    echo "Tabla parametros_nomina creada exitosamente.";
} catch(Exception $e) {
    echo "Error: " . $e->getMessage();
}
