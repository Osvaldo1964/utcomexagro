<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';

requireMethod('POST');
$user = JWT::requireAuth();
$pdo = Database::getConnection();

$input = getJsonInput();
$id = $input['id'] ?? null;

if (!$id) {
    jsonResponse(false, 'ID de movimiento no proporcionado.');
}

try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare("SELECT valor, tipo, rubro_id, soporte_pdf, comprobante FROM presupuesto_movimientos WHERE id = ? FOR UPDATE");
    $stmt->execute([$id]);
    $mov = $stmt->fetch();
    
    if (!$mov) {
        $pdo->rollBack();
        jsonResponse(false, 'Movimiento no encontrado.');
    }

    $isTraslado = in_array($mov['tipo'], ['Traslado Salida', 'Traslado Entrada']);
    $movsToDelete = [$mov];

    // If it's a traslado, find its pair using the comprobante
    if ($isTraslado && $mov['comprobante']) {
        $stmt = $pdo->prepare("SELECT id, valor, tipo, rubro_id, soporte_pdf FROM presupuesto_movimientos WHERE comprobante = ? AND id != ? FOR UPDATE");
        $stmt->execute([$mov['comprobante'], $id]);
        while ($pair = $stmt->fetch()) {
            $movsToDelete[] = $pair;
        }
    }

    foreach ($movsToDelete as $m) {
        // Revertir valor
        $valor = $m['valor'];
        // Si fue un Egreso o un Traslado Salida, se había SUMADO a valor_ejecutado. Para revertir, RESTAMOS.
        if (in_array($m['tipo'], ['Egreso', 'Traslado Salida'])) {
            $pdo->exec("UPDATE presupuesto_rubros SET valor_ejecutado = valor_ejecutado - $valor WHERE id = " . (int)$m['rubro_id']);
        } 
        // Si fue Ingreso o Traslado Entrada, se había RESTADO a valor_ejecutado. Para revertir, SUMAMOS.
        else {
            $pdo->exec("UPDATE presupuesto_rubros SET valor_ejecutado = valor_ejecutado + $valor WHERE id = " . (int)$m['rubro_id']);
        }

        $stmt = $pdo->prepare("DELETE FROM presupuesto_movimientos WHERE id = ?");
        $stmt->execute([$m['id']]);

        // Eliminar archivo si existe
        if ($m['soporte_pdf'] && file_exists(__DIR__ . '/../../' . $m['soporte_pdf'])) {
            unlink(__DIR__ . '/../../' . $m['soporte_pdf']);
        }
    }

    $pdo->commit();
    jsonResponse(true, $isTraslado ? 'Traslado revertido exitosamente.' : 'Movimiento eliminado exitosamente.');
} catch (PDOException $e) {
    $pdo->rollBack();
    jsonResponse(false, 'Error al eliminar: ' . $e->getMessage());
}
