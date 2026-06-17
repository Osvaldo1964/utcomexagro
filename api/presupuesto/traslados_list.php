<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';

requireMethod('GET');
$user = JWT::requireAuth();
$pdo = Database::getConnection();

try {
    // We fetch all Traslado Salida and Traslado Entrada
    // A single 'Traslado' operation has two rows sharing the same 'comprobante'.
    // We group them in PHP to return a unified object for the DataTable.
    $stmt = $pdo->query("
        SELECT m.*, r.codigo as rubro_codigo, r.nombre as rubro_nombre
        FROM presupuesto_movimientos m
        JOIN presupuesto_rubros r ON m.rubro_id = r.id
        WHERE m.tipo IN ('Traslado Salida', 'Traslado Entrada')
        ORDER BY m.fecha DESC, m.id DESC
    ");
    $movimientos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $traslados = [];
    $grupos = [];

    foreach ($movimientos as $m) {
        $comp = $m['comprobante'];
        if (!$comp) continue;
        
        if (!isset($grupos[$comp])) {
            $grupos[$comp] = [
                'comprobante' => $comp,
                'fecha' => $m['fecha'],
                'detalle' => $m['detalle'],
                'valor' => $m['valor'], // both should have same valor
                'origen' => null,
                'destino' => null,
                // We'll use the id of the 'Salida' as the main ID for deletion purposes
                'id_principal' => $m['id'] 
            ];
        }

        if ($m['tipo'] === 'Traslado Salida') {
            $grupos[$comp]['origen'] = $m['rubro_codigo'] . ' - ' . $m['rubro_nombre'];
            $grupos[$comp]['id_principal'] = $m['id']; // preferida para eliminar
        } else {
            $grupos[$comp]['destino'] = $m['rubro_codigo'] . ' - ' . $m['rubro_nombre'];
        }
    }

    // Convert map to sequential array
    foreach ($grupos as $g) {
        $traslados[] = $g;
    }

    jsonResponse(true, 'Traslados listados.', $traslados);
} catch (PDOException $e) {
    jsonResponse(false, 'Error al listar traslados: ' . $e->getMessage());
}
