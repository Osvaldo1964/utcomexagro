<?php
// ============================================================
// api/organizaciones/delete.php
// POST: Eliminar organización (soft delete o verificación de dependencias)
// ============================================================
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';

$auth = JWT::requireAuth();
$pdo = Database::getConnection();

requireMethod('POST');

$id = filter_var($_POST['id'] ?? null, FILTER_VALIDATE_INT);
if (!$id) jsonResponse(false, 'ID de organización inválido.', [], 422);

// Verificar dependencias (ej. si tiene beneficiarios o postulados activos)
$checkBen = $pdo->prepare("SELECT id FROM beneficiarios WHERE organizacion_id = ? LIMIT 1");
$checkBen->execute([$id]);
if ($checkBen->fetch()) {
    jsonResponse(false, 'No se puede eliminar la organización porque tiene beneficiarios asociados. En su lugar, puede cambiar su estado a inactivo.', [], 409);
}

// Opcional: chequear postulados
// $checkPost = $pdo->prepare("SELECT id FROM postulados WHERE organizacion_id = ? LIMIT 1");

$stmt = $pdo->prepare("DELETE FROM organizaciones WHERE id = ?");
$stmt->execute([$id]);

jsonResponse(true, 'Organización eliminada con éxito.');
