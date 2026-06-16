<?php
// api/dashboard/stats.php – Estadísticas para el dashboard admin
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';

requireMethod('GET');
$user = JWT::requireAuth();

$pdo = Database::getConnection();

$stats = [];

// Total postulados
$stats['postulados'] = (int)$pdo->query("SELECT COUNT(*) FROM postulados")->fetchColumn();

// Seleccionados
$stats['seleccionados'] = (int)$pdo->query("SELECT COUNT(*) FROM postulados WHERE estado_evaluacion='seleccionado'")->fetchColumn();

// Contratos activos
$stats['contratos'] = (int)$pdo->query("SELECT COUNT(*) FROM contratos WHERE estado='activo'")->fetchColumn();

// PQRS
$stats['pqrs_total'] = (int)$pdo->query("SELECT COUNT(*) FROM pqrs")->fetchColumn();
$stats['pqrs_resueltas'] = (int)$pdo->query("SELECT COUNT(*) FROM pqrs WHERE estado IN ('resuelto', 'cerrado')")->fetchColumn();

// Postulados por estado (para gráfico)
$stmt = $pdo->query("SELECT estado_evaluacion, COUNT(*) as total FROM postulados GROUP BY estado_evaluacion");
$stats['por_estado'] = $stmt->fetchAll();

// Postulados por programa
$stmt = $pdo->query("
    SELECT p.nombre AS programa, COUNT(po.id) AS total
    FROM programas p
    LEFT JOIN postulados po ON po.programa_id = p.id
    GROUP BY p.id
");
$stats['por_programa'] = $stmt->fetchAll();

jsonResponse(true, 'OK', $stats);
