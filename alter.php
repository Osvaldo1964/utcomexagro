<?php
require_once __DIR__ . '/api/config/db.php';
$pdo = Database::getConnection();
try {
    $pdo->exec("ALTER TABLE postulados 
        ADD COLUMN organizacion_id INT UNSIGNED DEFAULT NULL AFTER id, 
        ADD COLUMN estado_civil VARCHAR(50) DEFAULT NULL AFTER sexo, 
        ADD COLUMN especialidad VARCHAR(300) DEFAULT NULL AFTER cargo_id;");
    echo "Exito";
} catch (Exception $e) {
    echo $e->getMessage();
}
