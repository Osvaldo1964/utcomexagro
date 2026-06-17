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
    SELECT o.*, pt.nombre AS poblacion_nombre, t.nombre AS tipo_nombre
    FROM organizaciones o
    LEFT JOIN poblacion_tipos pt ON o.poblacion_tipo_id = pt.id
    LEFT JOIN tipos_organizacion t ON o.tipo_id = t.id
    ORDER BY o.nombre ASC
");
$orgs = $stmt->fetchAll();

jsonResponse(true, 'Organizaciones cargadas.', $orgs);
