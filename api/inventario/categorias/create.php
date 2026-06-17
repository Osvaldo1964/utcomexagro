<?php
require_once __DIR__ . '/../../config/db.php';
$pdo = Database::getConnection();
header("Content-Type: application/json");
$data = json_decode(file_get_contents("php://input"), true);
try {
    $stmt = $pdo->prepare("INSERT INTO inventario_categorias (nombre, descripcion) VALUES (?, ?)");
    $stmt->execute([$data["nombre"], $data["descripcion"]]);
    echo json_encode(["success" => true]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}

