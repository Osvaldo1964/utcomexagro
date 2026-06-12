<?php
// api/contratacion/evaluar.php – Evaluar un postulado
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';

requireMethod('POST');
$user = JWT::requireAuth();
JWT::requirePermission($user, 'contratacion', 'evaluar');

$postulado_id = (int)($_POST['postulado_id'] ?? 0);
$estado       = trim($_POST['estado'] ?? '');
$obs          = trim($_POST['observaciones'] ?? '');

$estadosValidos = ['pendiente','aplica','no_aplica','seleccionado'];
if (!$postulado_id) jsonResponse(false, 'ID de postulado requerido.', [], 422);
if (!in_array($estado, $estadosValidos)) jsonResponse(false, 'Estado inválido.', [], 422);

$pdo = Database::getConnection();

// Verificar que existe
$check = $pdo->prepare("SELECT id FROM postulados WHERE id = ?");
$check->execute([$postulado_id]);
if (!$check->fetch()) jsonResponse(false, 'Postulado no encontrado.', [], 404);

// Actualizar evaluación
$stmt = $pdo->prepare("
    UPDATE postulados
    SET estado_evaluacion        = ?,
        observaciones_evaluacion = ?,
        evaluado_por             = ?,
        fecha_evaluacion         = NOW()
    WHERE id = ?
");
$stmt->execute([$estado, $obs, $user['sub'], $postulado_id]);

jsonResponse(true, 'Evaluación guardada correctamente.', ['estado' => $estado]);
