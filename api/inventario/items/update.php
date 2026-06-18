<?php
require_once __DIR__ . '/../../config/db.php';
$pdo = Database::getConnection();
header("Content-Type: application/json");
$data = json_decode(file_get_contents("php://input"), true);
try {
    $stmt = $pdo->prepare("UPDATE inventario_items SET categoria_id=?, codigo=?, nombre=?, descripcion=?, unidad=?, cantidad_minima=?, ubicacion=?, iva_porcentaje=? WHERE id=?");
    $stmt->execute([
        $data["categoria_id"] ?: null,
        $data["codigo"],
        $data["nombre"],
        $data["descripcion"],
        $data["unidad"],
        $data["cantidad_minima"],
        $data["ubicacion"],
        $data["iva_porcentaje"] ?? 0.00,
        $data["id"]
    ]);
    echo json_encode(["success" => true]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}

