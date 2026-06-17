<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';

requireMethod('GET');
$user = JWT::requireAuth();
$pdo = Database::getConnection();

try {
    $stmt = $pdo->query("
        SELECT m.*, r.codigo as rubro_codigo, r.nombre as rubro_nombre, 
               t.nombre_razon_social as tercero_nombre, t.numero_documento as tercero_documento
        FROM presupuesto_movimientos m
        JOIN presupuesto_rubros r ON m.rubro_id = r.id
        JOIN terceros t ON m.tercero_id = t.id
        ORDER BY m.fecha DESC, m.id DESC
    ");
    $movimientos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    jsonResponse(true, 'Movimientos listados.', $movimientos);
} catch (PDOException $e) {
    jsonResponse(false, 'Error al listar movimientos: ' . $e->getMessage());
}
