<?php
require_once __DIR__ . '/api/config/db.php';

try {
    $pdo = Database::getConnection();

    $sql1 = "
    CREATE TABLE IF NOT EXISTS capacitaciones (
        id INT AUTO_INCREMENT PRIMARY KEY,
        titulo VARCHAR(200) NOT NULL,
        descripcion TEXT,
        fecha_hora DATETIME NOT NULL,
        sala_url VARCHAR(100) NOT NULL,
        grabacion_url VARCHAR(500) DEFAULT NULL,
        estado ENUM('programada', 'en_curso', 'finalizada') NOT NULL DEFAULT 'programada',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ";
    
    $sql2 = "
    CREATE TABLE IF NOT EXISTS capacitacion_organizaciones (
        capacitacion_id INT NOT NULL,
        organizacion_id INT NOT NULL,
        PRIMARY KEY (capacitacion_id, organizacion_id),
        FOREIGN KEY (capacitacion_id) REFERENCES capacitaciones(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ";

    $pdo->exec($sql1);
    $pdo->exec($sql2);

    echo "Tablas de capacitaciones creadas exitosamente.";
} catch(Exception $e) {
    echo "Error: " . $e->getMessage();
}
