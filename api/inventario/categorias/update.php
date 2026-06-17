<?php
require_once __DIR__ . '/../../config/db.php';
$pdo = Database::getConnection();
header("Content-Type: application/json");
$data = json_decode(file_get_contents("php://input"), true);
try {
    $stmt = $pdo->prepare("UPDATE inventario_categorias SET nombre = ?, descripcion = ? WHERE id = ?");
    $stmt->execute([$data["nombre"], $data["descripcion"], $data["id"]]);
    echo json_encode(["success" => true]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}

