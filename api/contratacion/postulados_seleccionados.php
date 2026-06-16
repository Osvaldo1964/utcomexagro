<?php
// api/contratacion/postulados_seleccionados.php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';

requireMethod('GET');
$user = JWT::requireAuth();
JWT::requirePermission($user, 'contratacion', 'evaluar');

$pdo = Database::getConnection();

try {
    $stmt = $pdo->prepare("
        SELECT 
            p.id, p.num_doc, p.p_nombre, p.s_nombre, p.p_apellido, p.s_apellido,
            p.especialidad, p.telefono, p.email, p.departamento, p.municipio,
            o.nombre AS organizacion_nombre,
            pr.nombre AS programa_nombre
        FROM postulados p
        LEFT JOIN organizaciones o ON p.organizacion_id = o.id
        LEFT JOIN programas pr ON p.programa_id = pr.id
        WHERE p.estado_evaluacion = 'seleccionado'
        ORDER BY p.updated_at DESC
    ");
    $stmt->execute();
    $postulados = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'data' => $postulados
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al obtener los postulados seleccionados.',
        'error' => APP_ENV === 'development' ? $e->getMessage() : null
    ]);
}
