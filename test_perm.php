<?php
require_once __DIR__ . '/api/config/db.php';
try {
    $pdo = Database::getConnection();
    $stmt = $pdo->query("SELECT * FROM permisos LIMIT 5");
    print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
