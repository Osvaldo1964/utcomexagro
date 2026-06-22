<?php
require_once __DIR__ . '/api/config/db.php';

$modules_in_app = [
    // key => permiso requerido en app.js
    'dashboard'              => null,  // sin permiso
    'configuracion'          => 'configuracion',
    'contratacion'           => 'contratacion',
    'beneficiarios'          => 'beneficiarios',
    'presupuesto'            => 'presupuesto',
    'inventarios'            => 'inventarios',
    'capacitaciones'         => 'capacitaciones',
    'encuestas'              => 'encuestas',
    'pqrs'                   => 'pqrs',
    'informes'               => 'informes',
    'postulados'             => 'postulados',
    // Módulos ocultos pero funcionales
    'terceros'               => 'presupuesto',  // hereda
    'presupuesto_rubros'     => 'presupuesto',
    'presupuesto_movimientos'=> 'presupuesto',
    'presupuesto_traslados'  => 'presupuesto',
];

try {
    $pdo = Database::getConnection();
    $stmt = $pdo->query("SELECT DISTINCT modulo FROM permisos ORDER BY modulo");
    $db_modules = $stmt->fetchAll(PDO::FETCH_COLUMN);

    echo "=== MÓDULOS CON PERMISOS EN DB ===\n";
    print_r($db_modules);

    echo "\n=== MÓDULOS REQUERIDOS QUE FALTAN EN DB ===\n";
    $missing = [];
    foreach ($modules_in_app as $key => $modulo) {
        if ($modulo === null) continue;
        if (!in_array($modulo, $db_modules)) {
            $missing[] = $modulo;
            echo "FALTA: $modulo (módulo: $key)\n";
        }
    }

    if (empty($missing)) {
        echo "¡Todos los módulos tienen permisos en la DB!\n";
    }

    echo "\n=== TODOS LOS PERMISOS REGISTRADOS ===\n";
    $stmt2 = $pdo->query("SELECT id, modulo, accion, descripcion FROM permisos ORDER BY modulo, accion");
    $all = $stmt2->fetchAll(PDO::FETCH_ASSOC);
    foreach ($all as $p) {
        echo "[{$p['id']}] {$p['modulo']}.{$p['accion']} - {$p['descripcion']}\n";
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
