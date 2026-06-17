<?php
require_once __DIR__ . '/../../config/db.php';
$pdo = Database::getConnection();
header("Content-Type: application/json");
$data = json_decode(file_get_contents("php://input"), true);
try {
    $stmt = $pdo->prepare("INSERT INTO inventario_items (categoria_id, codigo, nombre, descripcion, unidad, cantidad, cantidad_minima, ubicacion, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $data["categoria_id"] ?: null,
        $data["codigo"],
        $data["nombre"],
        $data["descripcion"],
        $data["unidad"],
        $data["cantidad"] ?? 0,
        $data["cantidad_minima"] ?? 0,
        $data["ubicacion"],
        $data["estado"] ?? "disponible"
    ]);
    echo json_encode(["success" => true]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}

