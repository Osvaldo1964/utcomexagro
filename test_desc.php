<?php
require_once __DIR__ . '/api/config/db.php';

try {
    $pdo = Database::getConnection();
    
    $stmt = $pdo->query("DESCRIBE capacitaciones");
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    print_r($data);
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
