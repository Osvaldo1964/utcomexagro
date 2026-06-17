<?php
require_once __DIR__ . '/../../config/db.php';
$pdo = Database::getConnection();
header("Content-Type: application/json");
try {
    $stmt = $pdo->query("SELECT o.*, t.nombre as tercero_nombre, t.nit as tercero_nit FROM inv_ordenes_compra o LEFT JOIN terceros t ON o.tercero_id = t.id ORDER BY o.fecha DESC, o.id DESC");
    $ordenes = $stmt->fetchAll();
    
    foreach ($ordenes as &$orden) {
        $stmtItems = $pdo->prepare("SELECT i.*, it.nombre as item_nombre FROM inv_ordenes_compra_items i LEFT JOIN inventario_items it ON i.item_id = it.id WHERE i.orden_id = ?");
        $stmtItems->execute([$orden["id"]]);
        $orden["items"] = $stmtItems->fetchAll();
    }
    
    echo json_encode(["success" => true, "data" => $ordenes]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}

