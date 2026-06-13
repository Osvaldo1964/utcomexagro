<?php
// api/postulados/list.php – Listado de postulados para el admin
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';

requireMethod('GET');
$user = JWT::requireAuth();
JWT::requirePermission($user, 'postulados', 'leer');

$pdo = Database::getConnection();

// Filtros opcionales
$estado    = $_GET['estado']     ?? '';
$programaId= $_GET['programa_id']?? '';
$search    = $_GET['q']          ?? '';

$where  = ['1=1'];
$params = [];

if ($estado)     { $where[] = 'po.estado_evaluacion = ?'; $params[] = $estado; }
if ($programaId) { $where[] = 'po.programa_id = ?';       $params[] = $programaId; }
if ($search) {
    $w = '%' . $search . '%';
    $where[] = '(po.p_nombre LIKE ? OR po.p_apellido LIKE ? OR po.num_doc LIKE ?)';
    $params = array_merge($params, [$w, $w, $w]);
}

$sql = "
    SELECT po.id, po.tipo_doc, po.num_doc,
           po.p_nombre, po.p_apellido, po.s_nombre, po.s_apellido,
           po.email, po.telefono, po.especialidad,
           po.estado_evaluacion, po.observaciones_evaluacion,
           po.created_at,
           org.nombre AS organizacion_nombre
    FROM postulados po
    LEFT JOIN organizaciones org ON po.organizacion_id = org.id
    WHERE " . implode(' AND ', $where) . "
    ORDER BY po.created_at DESC
";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$data = $stmt->fetchAll();

jsonResponse(true, 'OK', $data);
