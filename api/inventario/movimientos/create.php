<?php
require_once __DIR__ . '/../../config/db.php';
$pdo = Database::getConnection();
header("Content-Type: application/json");
$data = json_decode(file_get_contents("php://input"), true);
try {
    $pdo->beginTransaction();
    $stmt = $pdo->prepare("INSERT INTO inv_movimientos (tipo, fecha, comprobante_ref, tercero_id, orden_compra_id, observaciones) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $data["tipo"],
        $data["fecha"],
        $data["comprobante_ref"] ?? "",
        $data["tercero_id"] ?: null,
        $data["orden_compra_id"] ?: null,
        $data["observaciones"] ?? ""
    ]);
    $movimiento_id = $pdo->lastInsertId();
    
    $tipo = $data["tipo"];
    $factor = ($tipo === "entrada" || $tipo === "ajuste_ingreso") ? 1 : -1;

    if (isset($data["items"]) && is_array($data["items"])) {
        $stmtItem = $pdo->prepare("INSERT INTO inv_movimientos_items (movimiento_id, item_id, cantidad, costo_unitario) VALUES (?, ?, ?, ?)");
        $stmtStock = $pdo->prepare("UPDATE inventario_items SET cantidad = cantidad + (?) WHERE id = ?");
        
        foreach ($data["items"] as $item) {
            $cantidad_movimiento = floatval($item["cantidad"]);
            
            $stmtItem->execute([
                $movimiento_id,
                $item["item_id"],
                $cantidad_movimiento,
                $item["costo_unitario"] ?? 0
            ]);
            
            $delta = $cantidad_movimiento * $factor;
            $stmtStock->execute([$delta, $item["item_id"]]);
        }
    }
    
    // Si viene de una orden de compra, marcamos la orden como Recibida
    if (!empty($data["orden_compra_id"]) && $tipo === "entrada") {
        $stmtOrd = $pdo->prepare("UPDATE inv_ordenes_compra SET estado = 'Recibida' WHERE id = ?");
        $stmtOrd->execute([$data["orden_compra_id"]]);
    }
    
    $pdo->commit();
    echo json_encode(["success" => true]);
} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}

