<?php
require_once __DIR__ . '/../../config/db.php';
$pdo = Database::getConnection();
header("Content-Type: application/json");
$data = json_decode(file_get_contents("php://input"), true);
try {
    $pdo->beginTransaction();
    $stmt1 = $pdo->prepare("DELETE FROM inv_ordenes_compra_items WHERE orden_id = ?");
    $stmt1->execute([$data["id"]]);
    $stmt2 = $pdo->prepare("DELETE FROM inv_ordenes_compra WHERE id = ?");
    $stmt2->execute([$data["id"]]);
    $pdo->commit();
    echo json_encode(["success" => true]);
} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}

