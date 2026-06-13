<?php
// ============================================================
// api/organizaciones/list.php
// GET: Listar organizaciones autorizadas
// ============================================================
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';

$auth = JWT::requireAuth();
$pdo = Database::getConnection();

requireMethod('GET');

$stmt = $pdo->query("
    SELECT *
    FROM organizaciones
    ORDER BY nombre ASC
");
$orgs = $stmt->fetchAll();

jsonResponse(true, 'Organizaciones cargadas.', $orgs);
