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
        $stmtGetItem = $pdo->prepare("SELECT cantidad, costo_promedio FROM inventario_items WHERE id = ? FOR UPDATE");
        $stmtItem = $pdo->prepare("INSERT INTO inv_movimientos_items (movimiento_id, item_id, cantidad, costo_unitario, iva_porcentaje, iva_valor) VALUES (?, ?, ?, ?, ?, ?)");
        $stmtStock = $pdo->prepare("UPDATE inventario_items SET cantidad = ?, costo_promedio = ? WHERE id = ?");
        
        foreach ($data["items"] as $item) {
            $cantidad_movimiento = floatval($item["cantidad"]);
            $item_id = $item["item_id"];
            
            $stmtGetItem->execute([$item_id]);
            $row = $stmtGetItem->fetch();
            if (!$row) throw new Exception("El ítem con ID $item_id no existe.");
            
            $stock_actual = floatval($row["cantidad"]);
            $costo_actual = floatval($row["costo_promedio"]);
            
            $costo_unitario_movimiento = floatval($item["costo_unitario"] ?? 0);
            $iva_porcentaje = floatval($item["iva_porcentaje"] ?? 0);
            $iva_valor = floatval($item["iva_valor"] ?? 0);
            
            $nuevo_stock = $stock_actual + ($cantidad_movimiento * $factor);
            $nuevo_costo = $costo_actual;
            
            if ($factor > 0) {
                // Entrada: Recalcular CPP
                $total_valor_actual = $stock_actual * $costo_actual;
                $total_valor_entrante = $cantidad_movimiento * $costo_unitario_movimiento;
                
                if ($nuevo_stock > 0) {
                    if ($stock_actual < 0) {
                        $nuevo_costo = $costo_unitario_movimiento; // Si venía negativo, asume el nuevo costo
                    } else {
                        $nuevo_costo = ($total_valor_actual + $total_valor_entrante) / $nuevo_stock;
                    }
                } else {
                    $nuevo_costo = $costo_unitario_movimiento;
                }
            } else {
                // Salida: Usar obligatoriamente el CPP actual de la Base de Datos
                $costo_unitario_movimiento = $costo_actual;
                $iva_porcentaje = 0;
                $iva_valor = 0;
            }
            
            $stmtItem->execute([
                $movimiento_id,
                $item_id,
                $cantidad_movimiento,
                $costo_unitario_movimiento,
                $iva_porcentaje,
                $iva_valor
            ]);
            
            $stmtStock->execute([$nuevo_stock, $nuevo_costo, $item_id]);
        }
    }
    
    // Si viene de una orden de compra, marcamos la orden como Recibida
    if (!empty($data["orden_compra_id"]) && $tipo === "entrada") {
        $stmtOrd = $pdo->prepare("UPDATE inv_ordenes_compra SET estado = 'Recibida' WHERE id = ?");
        $stmtOrd->execute([$data["orden_compra_id"]]);
    }
    
    $pdo->commit();
    echo json_encode(["success" => true, "id" => $movimiento_id]);
} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}

