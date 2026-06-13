<?php
// ============================================================
// api/postulados/get.php
// GET: Obtener detalle completo de un postulado + sus documentos
// ============================================================
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';

requireMethod('GET');
$user = JWT::requireAuth();
JWT::requirePermission($user, 'postulados', 'leer');

$id = filter_var($_GET['id'] ?? null, FILTER_VALIDATE_INT);
if (!$id) {
    jsonResponse(false, 'ID de postulado inválido.', [], 422);
}

$pdo = Database::getConnection();

// Buscar postulado
$stmt = $pdo->prepare("
    SELECT po.*,
           org.nombre AS organizacion_nombre,
           u.nombre   AS evaluador_nombre, u.apellidos AS evaluador_apellidos
    FROM postulados po
    LEFT JOIN organizaciones org ON po.organizacion_id = org.id
    LEFT JOIN usuarios u   ON po.evaluado_por = u.id
    WHERE po.id = ?
    LIMIT 1
");
$stmt->execute([$id]);
$postulado = $stmt->fetch();

if (!$postulado) {
    jsonResponse(false, 'Postulado no encontrado.', [], 404);
}

// Buscar documentos adjuntos
$docStmt = $pdo->prepare("
    SELECT id, tipo_doc, nombre_original, nombre_archivo, ruta_relativa, tamano_bytes, mime_type, created_at
    FROM documentos_postulado
    WHERE postulado_id = ?
");
$docStmt->execute([$id]);
$documentos = $docStmt->fetchAll();

$postulado['documentos'] = $documentos;

jsonResponse(true, 'Postulado cargado.', $postulado);
