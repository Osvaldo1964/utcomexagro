<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';

$user = JWT::requireAuth();
$pdo = Database::getConnection();

try {
    $sql = "SELECT c.*, 
            (SELECT GROUP_CONCAT(o.nombre SEPARATOR ', ') 
             FROM capacitacion_organizaciones co 
             JOIN organizaciones o ON co.organizacion_id = o.id 
             WHERE co.capacitacion_id = c.id) as organizaciones_nombres,
            (SELECT GROUP_CONCAT(co.organizacion_id) 
             FROM capacitacion_organizaciones co 
             WHERE co.capacitacion_id = c.id) as organizaciones_ids
            FROM capacitaciones c 
            ORDER BY c.fecha_inicio DESC";
    $stmt = $pdo->query($sql);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Formatear arrays
    foreach ($data as &$row) {
        $row['organizaciones'] = $row['organizaciones_ids'] ? explode(',', $row['organizaciones_ids']) : [];
        $row['fecha_hora'] = $row['fecha_inicio'];
        $row['sala_url'] = $row['enlace_reunion'];
    }

    jsonResponse(true, 'OK', $data);
} catch (Exception $e) {
    jsonResponse(false, 'Error al obtener capacitaciones: ' . $e->getMessage(), [], 500);
}
