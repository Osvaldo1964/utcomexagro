<?php
require_once __DIR__ . '/../../config/db.php';
$pdo = Database::getConnection();
header("Content-Type: application/json");
try {
    $stmt = $pdo->query("SELECT m.*, t.nombre_razon_social as tercero_nombre, o.numero as orden_numero FROM inv_movimientos m LEFT JOIN terceros t ON m.tercero_id = t.id LEFT JOIN inv_ordenes_compra o ON m.orden_compra_id = o.id ORDER BY m.fecha DESC, m.id DESC");
    $movimientos = $stmt->fetchAll();
    
    foreach ($movimientos as &$mov) {
        $stmtItems = $pdo->prepare("SELECT i.*, it.nombre as item_nombre FROM inv_movimientos_items i LEFT JOIN inventario_items it ON i.item_id = it.id WHERE i.movimiento_id = ?");
        $stmtItems->execute([$mov["id"]]);
        $mov["items"] = $stmtItems->fetchAll();
    }
    
    echo json_encode(["success" => true, "data" => $movimientos]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}

