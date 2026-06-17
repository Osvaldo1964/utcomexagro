<?php
require_once __DIR__ . '/../../config/db.php';
$pdo = Database::getConnection();
header('Content-Type: application/json');

try {
    $stmt = $pdo->query("SELECT * FROM inventario_categorias ORDER BY nombre ASC");
    $data = $stmt->fetchAll();
    echo json_encode(['success' => true, 'data' => $data]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

