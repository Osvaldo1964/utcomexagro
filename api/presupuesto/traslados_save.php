<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';

requireMethod('POST');
$user = JWT::requireAuth();
$pdo = Database::getConnection();

$input = getJsonInput();
$fecha = $input['fecha'] ?? date('Y-m-d');
$origen_id = $input['origen_id'] ?? null;
$destino_id = $input['destino_id'] ?? null;
$valor = isset($input['valor']) ? (float)$input['valor'] : 0;
$detalle = $input['detalle'] ?? '';

if (!$origen_id || !$destino_id || $valor <= 0 || $origen_id == $destino_id) {
    jsonResponse(false, 'Datos inválidos o el origen y destino son el mismo.');
}

try {
    $pdo->beginTransaction();

    // 1. Validar rubro origen
    $stmt = $pdo->prepare("SELECT id, nivel, valor_total, valor_ejecutado FROM presupuesto_rubros WHERE id = ? FOR UPDATE");
    $stmt->execute([$origen_id]);
    $rubro_origen = $stmt->fetch();

    if (!$rubro_origen || $rubro_origen['nivel'] != 4) {
        $pdo->rollBack();
        jsonResponse(false, 'El rubro origen no existe o no es de Nivel 4.');
    }

    $disponible_origen = $rubro_origen['valor_total'] - $rubro_origen['valor_ejecutado'];
    if ($disponible_origen < $valor) {
        $pdo->rollBack();
        jsonResponse(false, 'Saldo insuficiente en el rubro origen. Disponible: $' . number_format($disponible_origen, 2));
    }

    // 2. Validar rubro destino
    $stmt = $pdo->prepare("SELECT id, nivel FROM presupuesto_rubros WHERE id = ? FOR UPDATE");
    $stmt->execute([$destino_id]);
    $rubro_destino = $stmt->fetch();

    if (!$rubro_destino || $rubro_destino['nivel'] != 4) {
        $pdo->rollBack();
        jsonResponse(false, 'El rubro destino no existe o no es de Nivel 4.');
    }

    // 3. Obtener/Crear Tercero Interno
    $stmt = $pdo->query("SELECT nombre, nit FROM empresa_parametros LIMIT 1");
    $empresa = $stmt->fetch();
    $nombre_empresa = $empresa ? ($empresa['nombre'] ?: 'UT COMEXAGRO') : 'UT COMEXAGRO';
    $nit_empresa = $empresa ? ($empresa['nit'] ?: 'NIT-INTERNO') : 'NIT-INTERNO';

    $stmt = $pdo->prepare("SELECT id FROM terceros WHERE nombre_razon_social = ? LIMIT 1");
    $stmt->execute([$nombre_empresa]);
    $tercero = $stmt->fetch();

    if ($tercero) {
        $tercero_id = $tercero['id'];
    } else {
        $stmt = $pdo->prepare("INSERT INTO terceros (tipo_documento, numero_documento, nombre_razon_social, tipo_tercero, estado) VALUES ('NIT', ?, ?, 'Otro', 'Activo')");
        $stmt->execute([$nit_empresa, $nombre_empresa]);
        $tercero_id = $pdo->lastInsertId();
    }

    // 4. Generar código comprobante entrelazado
    $comprobante = 'TR-' . time() . '-' . rand(100, 999);

    // 5. Insertar Traslado Salida (Actúa como Egreso -> Aumenta valor_ejecutado)
    $stmt = $pdo->prepare("
        INSERT INTO presupuesto_movimientos (fecha, tipo, rubro_id, tercero_id, comprobante, detalle, valor, created_by)
        VALUES (?, 'Traslado Salida', ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([$fecha, $origen_id, $tercero_id, $comprobante, $detalle, $valor, $user['sub'] ?? null]);
    $pdo->exec("UPDATE presupuesto_rubros SET valor_ejecutado = valor_ejecutado + $valor WHERE id = " . (int)$origen_id);

    // 6. Insertar Traslado Entrada (Actúa como Ingreso -> Disminuye valor_ejecutado)
    $stmt = $pdo->prepare("
        INSERT INTO presupuesto_movimientos (fecha, tipo, rubro_id, tercero_id, comprobante, detalle, valor, created_by)
        VALUES (?, 'Traslado Entrada', ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([$fecha, $destino_id, $tercero_id, $comprobante, $detalle, $valor, $user['sub'] ?? null]);
    $pdo->exec("UPDATE presupuesto_rubros SET valor_ejecutado = valor_ejecutado - $valor WHERE id = " . (int)$destino_id);

    $pdo->commit();
    jsonResponse(true, 'Traslado registrado exitosamente. Comprobante: ' . $comprobante);
} catch (PDOException $e) {
    $pdo->rollBack();
    jsonResponse(false, 'Error al procesar el traslado: ' . $e->getMessage());
}
