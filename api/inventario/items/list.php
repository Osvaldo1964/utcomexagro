<?php
require_once __DIR__ . '/../../config/db.php';
$pdo = Database::getConnection();
header("Content-Type: application/json");
try {
    $stmt = $pdo->query("SELECT i.*, c.nombre as categoria_nombre FROM inventario_items i LEFT JOIN inventario_categorias c ON i.categoria_id = c.id ORDER BY i.nombre ASC");
    $data = $stmt->fetchAll();
    echo json_encode(["success" => true, "data" => $data]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}

