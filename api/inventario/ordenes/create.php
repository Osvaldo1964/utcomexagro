<?php
require_once __DIR__ . '/../../config/db.php';
$pdo = Database::getConnection();
header("Content-Type: application/json");
$data = json_decode(file_get_contents("php://input"), true);
try {
    $pdo->beginTransaction();
    $stmt = $pdo->prepare("INSERT INTO inv_ordenes_compra (tercero_id, fecha, numero, estado, total, notas) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $data["tercero_id"],
        $data["fecha"],
        $data["numero"],
        $data["estado"] ?? "Borrador",
        $data["total"] ?? 0,
        $data["notas"] ?? ""
    ]);
    $orden_id = $pdo->lastInsertId();
    
    if (isset($data["items"]) && is_array($data["items"])) {
        $stmtItem = $pdo->prepare("INSERT INTO inv_ordenes_compra_items (orden_id, item_id, cantidad, valor_unitario, valor_total) VALUES (?, ?, ?, ?, ?)");
        foreach ($data["items"] as $item) {
            $stmtItem->execute([
                $orden_id,
                $item["item_id"],
                $item["cantidad"],
                $item["valor_unitario"],
                $item["valor_total"]
            ]);
        }
    }
    
    $pdo->commit();
    echo json_encode(["success" => true]);
} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}

