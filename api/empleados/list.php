<?php
// api/empleados/list.php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';

requireMethod('GET');
$user = JWT::requireAuth();
JWT::requirePermission($user, 'contratacion', 'evaluar');

$pdo = Database::getConnection();

try {
    $sql = "
        SELECT e.*, c.estado as estado_contrato
        FROM empleados e
        LEFT JOIN contratos c ON e.contrato_id = c.id
        ORDER BY e.cargo ASC, e.nombres ASC
    ";
    
    $stmt = $pdo->query($sql);
    $data = $stmt->fetchAll();
    
    jsonResponse(true, 'OK', $data);
} catch (Exception $e) {
    jsonResponse(false, 'Error al obtener empleados: ' . $e->getMessage(), [], 500);
}
