<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';

requireMethod('GET');
$user = JWT::requireAuth();
$pdo = Database::getConnection();

try {
    // Traer todos los rubros con la organizacion si la tiene
    $stmt = $pdo->query("
        SELECT r.*, o.nombre as organizacion_nombre 
        FROM presupuesto_rubros r
        LEFT JOIN organizaciones o ON r.organizacion_id = o.id
        ORDER BY r.codigo ASC
    ");
    $allRubros = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Build hierarchy
    $rubrosById = [];
    foreach ($allRubros as $r) {
        $r['children'] = [];
        $r['valor_total'] = (float)$r['valor_total'];
        $r['valor_ejecutado'] = (float)$r['valor_ejecutado'];
        $rubrosById[$r['id']] = $r;
    }

    $tree = [];
    foreach ($rubrosById as $id => &$r) {
        if ($r['parent_id']) {
            if (isset($rubrosById[$r['parent_id']])) {
                $rubrosById[$r['parent_id']]['children'][] = &$r;
            }
        } else {
            $tree[] = &$r;
        }
    }

    // Calcular valores desde las hojas (nivel 4) hacia arriba (nivel 1)
    function calculateTotals(&$node) {
        if ($node['nivel'] == 4) {
            // Es hoja, sus valores ya están definidos en la BD
            return [
                'total' => $node['valor_total'],
                'ejecutado' => $node['valor_ejecutado']
            ];
        }

        // Es agrupador, sumar hijos
        $sumTotal = 0;
        $sumEjecutado = 0;
        foreach ($node['children'] as &$child) {
            $childSums = calculateTotals($child);
            $sumTotal += $childSums['total'];
            $sumEjecutado += $childSums['ejecutado'];
        }

        $node['valor_total'] = $sumTotal;
        $node['valor_ejecutado'] = $sumEjecutado;

        return [
            'total' => $sumTotal,
            'ejecutado' => $sumEjecutado
        ];
    }

    foreach ($tree as &$rootNode) {
        calculateTotals($rootNode);
    }

    jsonResponse(true, 'Árbol de presupuesto', $tree);

} catch (PDOException $e) {
    jsonResponse(false, 'Error al obtener el presupuesto: ' . $e->getMessage());
}
