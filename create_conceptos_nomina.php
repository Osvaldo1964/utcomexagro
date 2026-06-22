<?php
require_once __DIR__ . '/api/config/db.php';

try {
    $pdo = Database::getConnection();
    $sql = "
    CREATE TABLE IF NOT EXISTS conceptos_nomina (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(150) NOT NULL,
        tipo ENUM('DEVENGADO', 'DEDUCCION') NOT NULL,
        estado TINYINT(1) NOT NULL DEFAULT 1,
        deleted TINYINT(1) NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ";
    
    $pdo->exec($sql);

    // Insert some defaults to get started
    $insert = "INSERT IGNORE INTO conceptos_nomina (nombre, tipo, estado, deleted) VALUES 
        ('Sueldo Básico', 'DEVENGADO', 1, 0),
        ('Auxilio de Transporte', 'DEVENGADO', 1, 0),
        ('Bonificación', 'DEVENGADO', 1, 0),
        ('Horas Extras', 'DEVENGADO', 1, 0),
        ('Salud (EPS)', 'DEDUCCION', 1, 0),
        ('Pensión (AFP)', 'DEDUCCION', 1, 0),
        ('Fondo de Solidaridad Pensional', 'DEDUCCION', 1, 0),
        ('Retención en la Fuente', 'DEDUCCION', 1, 0),
        ('Libranza', 'DEDUCCION', 1, 0),
        ('Préstamos', 'DEDUCCION', 1, 0)
    ";
    // We can't easily do INSERT IGNORE without a UNIQUE constraint, so let's just check if empty
    $check = $pdo->query("SELECT COUNT(*) FROM conceptos_nomina")->fetchColumn();
    if ($check == 0) {
        $pdo->exec($insert);
    }

    echo "Tabla conceptos_nomina creada exitosamente.";
} catch(Exception $e) {
    echo "Error: " . $e->getMessage();
}
