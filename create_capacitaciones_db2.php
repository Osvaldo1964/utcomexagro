<?php
require_once __DIR__ . '/api/config/db.php';

try {
    $pdo = Database::getConnection();
    
    // Create the second table without the foreign key for now, or just check the id of organizaciones
    $sql2 = "
    CREATE TABLE IF NOT EXISTS capacitacion_organizaciones (
        capacitacion_id INT NOT NULL,
        organizacion_id INT NOT NULL,
        PRIMARY KEY (capacitacion_id, organizacion_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ";

    $pdo->exec($sql2);
    echo "Tabla capacitacion_organizaciones creada sin foreign key para evitar problemas de engine.";
} catch(Exception $e) {
    echo "Error: " . $e->getMessage();
}
