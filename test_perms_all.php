<?php
require_once __DIR__ . '/api/config/db.php';
try {
    $pdo = Database::getConnection();
    $stmt = $pdo->query("SELECT DISTINCT modulo FROM permisos ORDER BY modulo");
    $db_modules = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo "Modulos en DB:\n";
    print_r($db_modules);
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
