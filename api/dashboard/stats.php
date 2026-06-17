<?php
// api/dashboard/stats.php – Estadísticas para el dashboard admin
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';

requireMethod('GET');
$user = JWT::requireAuth();

$pdo = Database::getConnection();

$stats = [];

// Beneficiarios
$stats['beneficiarios_activos'] = (int)$pdo->query("SELECT COUNT(*) FROM beneficiarios WHERE estado='activo'")->fetchColumn();

// Organizaciones
$stats['organizaciones'] = (int)$pdo->query("SELECT COUNT(*) FROM organizaciones")->fetchColumn();

// Terceros
$stats['terceros'] = (int)$pdo->query("SELECT COUNT(*) FROM terceros")->fetchColumn();

// Presupuesto Oficial (Sumamos los nodos hoja para evitar doble conteo)
$presupuesto = $pdo->query("SELECT SUM(valor_total) as total, SUM(valor_ejecutado) as ejecutado FROM presupuesto_rubros WHERE id NOT IN (SELECT DISTINCT parent_id FROM presupuesto_rubros WHERE parent_id IS NOT NULL)")->fetch();
$stats['presupuesto_total'] = (float)($presupuesto['total'] ?? 0);
$stats['presupuesto_ejecutado'] = (float)($presupuesto['ejecutado'] ?? 0);

// PQRS
$stats['pqrs_total'] = (int)$pdo->query("SELECT COUNT(*) FROM pqrs")->fetchColumn();
$stats['pqrs_resueltas'] = (int)$pdo->query("SELECT COUNT(*) FROM pqrs WHERE estado IN ('resuelto', 'cerrado')")->fetchColumn();

// Contratos (Si aún se usan, los mantenemos en el backend por compatibilidad)
$stats['contratos'] = (int)$pdo->query("SELECT COUNT(*) FROM contratos WHERE estado='activo'")->fetchColumn();

// Capacitaciones
$stats['capacitaciones'] = (int)$pdo->query("SELECT COUNT(*) FROM capacitaciones")->fetchColumn();

// Encuestas
$stats['encuestas'] = (int)$pdo->query("SELECT COUNT(*) FROM encuestas")->fetchColumn();

// Inventarios
$stats['inventario_items'] = (int)$pdo->query("SELECT COUNT(*) FROM inventario_items")->fetchColumn();

jsonResponse(true, 'OK', $stats);
