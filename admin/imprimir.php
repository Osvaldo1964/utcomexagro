<?php
require_once __DIR__ . '/../api/config/db.php';
$pdo = Database::getConnection();

$tipo = $_GET['tipo'] ?? '';
$id = $_GET['id'] ?? 0;

if (!$tipo || !$id) {
    die("Faltan parámetros.");
}

$documento = [];
$items = [];
$tercero = null;

if ($tipo === 'orden') {
    $stmt = $pdo->prepare("SELECT * FROM inv_ordenes_compra WHERE id = ?");
    $stmt->execute([$id]);
    $documento = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($documento) {
        $stmtTer = $pdo->prepare("SELECT * FROM terceros WHERE id = ?");
        $stmtTer->execute([$documento['tercero_id']]);
        $tercero = $stmtTer->fetch(PDO::FETCH_ASSOC);

        $stmtItems = $pdo->prepare("SELECT i.*, it.nombre as item_nombre, it.unidad FROM inv_ordenes_compra_items i LEFT JOIN inventario_items it ON i.item_id = it.id WHERE i.orden_id = ?");
        $stmtItems->execute([$id]);
        $items = $stmtItems->fetchAll(PDO::FETCH_ASSOC);
    }
} elseif ($tipo === 'movimiento') {
    $stmt = $pdo->prepare("SELECT * FROM inv_movimientos WHERE id = ?");
    $stmt->execute([$id]);
    $documento = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($documento) {
        if ($documento['tercero_id']) {
            $stmtTer = $pdo->prepare("SELECT * FROM terceros WHERE id = ?");
            $stmtTer->execute([$documento['tercero_id']]);
            $tercero = $stmtTer->fetch(PDO::FETCH_ASSOC);
        }

        $stmtItems = $pdo->prepare("SELECT i.*, it.nombre as item_nombre, it.unidad FROM inv_movimientos_items i LEFT JOIN inventario_items it ON i.item_id = it.id WHERE i.movimiento_id = ?");
        $stmtItems->execute([$id]);
        $items = $stmtItems->fetchAll(PDO::FETCH_ASSOC);
    }
}

if (!$documento) {
    die("Documento no encontrado.");
}

function formatearMoneda($valor) {
    return "$" . number_format($valor, 0, ',', '.');
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Imprimir <?= ucfirst($tipo) ?> #<?= $documento['id'] ?></title>
    <style>
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 14px;
            color: #333;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #22c55e;
            padding-bottom: 20px;
            margin-bottom: 20px;
        }
        .header-left h1 {
            margin: 0;
            color: #166534;
            font-size: 24px;
        }
        .header-right {
            text-align: right;
        }
        .doc-title {
            font-size: 20px;
            font-weight: bold;
            color: #374151;
            margin-bottom: 5px;
            text-transform: uppercase;
        }
        .info-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            background: #f9fafb;
            padding: 15px;
            border-radius: 8px;
        }
        .info-block {
            flex: 1;
        }
        .info-block h3 {
            margin-top: 0;
            font-size: 14px;
            color: #4b5563;
            text-transform: uppercase;
            border-bottom: 1px solid #d1d5db;
            padding-bottom: 5px;
            margin-bottom: 10px;
        }
        .info-block p {
            margin: 5px 0;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        th, td {
            border: 1px solid #e5e7eb;
            padding: 10px;
            text-align: left;
        }
        th {
            background-color: #f3f4f6;
            font-weight: 600;
            color: #374151;
        }
        .text-right {
            text-align: right;
        }
        .totals {
            width: 300px;
            float: right;
        }
        .totals table {
            margin-bottom: 0;
        }
        .totals th, .totals td {
            border: none;
            border-bottom: 1px solid #e5e7eb;
            padding: 8px 10px;
        }
        .totals tr:last-child th, .totals tr:last-child td {
            border-bottom: none;
            font-size: 16px;
            font-weight: bold;
            color: #166534;
        }
        .notes {
            clear: both;
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px dashed #d1d5db;
            font-size: 12px;
            color: #6b7280;
        }
        @media print {
            body { padding: 0; }
            .container { max-width: 100%; }
            .no-print { display: none !important; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="no-print" style="margin-bottom: 20px;">
            <button onclick="window.print()" style="padding: 10px 20px; background: #22c55e; color: white; border: none; border-radius: 5px; cursor: pointer;">🖨️ Imprimir</button>
            <button onclick="window.close()" style="padding: 10px 20px; background: #6b7280; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">❌ Cerrar</button>
        </div>

        <div class="header">
            <div class="header-left">
                <h1>UT COMEXAGRO</h1>
                <p style="margin: 5px 0; color: #4b5563;">Sistema Integrado de Gestión</p>
                <p style="margin: 0; color: #4b5563;">NIT: 900.XXX.XXX-X</p>
            </div>
            <div class="header-right">
                <div class="doc-title">
                    <?= $tipo === 'orden' ? 'Orden de Compra' : 'Comprobante de ' . ucfirst($documento['tipo']) ?>
                </div>
                <div style="font-size: 16px; font-weight: bold; color: #1f2937;">
                    N° <?= $tipo === 'orden' ? $documento['numero'] : 'MOV-' . str_pad($documento['id'], 6, '0', STR_PAD_LEFT) ?>
                </div>
            </div>
        </div>

        <div class="info-section">
            <div class="info-block" style="margin-right: 20px;">
                <h3><?= $tipo === 'orden' ? 'Proveedor' : 'Tercero / Empleado' ?></h3>
                <?php if ($tercero): ?>
                    <p><strong>Razón Social:</strong> <?= htmlspecialchars($tercero['nombre_razon_social']) ?></p>
                    <p><strong>NIT/CC:</strong> <?= htmlspecialchars($tercero['numero_documento']) ?></p>
                    <?php if(!empty($tercero['telefono'])) echo "<p><strong>Tel:</strong> " . htmlspecialchars($tercero['telefono']) . "</p>"; ?>
                <?php else: ?>
                    <p><em>No aplica / Movimiento interno</em></p>
                <?php endif; ?>
            </div>
            <div class="info-block">
                <h3>Información del Documento</h3>
                <p><strong>Fecha:</strong> <?= htmlspecialchars($documento['fecha']) ?></p>
                <?php if ($tipo === 'orden' && !empty($documento['estado'])): ?>
                    <p><strong>Estado:</strong> <?= htmlspecialchars($documento['estado']) ?></p>
                <?php endif; ?>
                <?php if ($tipo === 'movimiento' && !empty($documento['comprobante_ref'])): ?>
                    <p><strong>Referencia:</strong> <?= htmlspecialchars($documento['comprobante_ref']) ?></p>
                <?php endif; ?>
                <p><strong>Impreso el:</strong> <?= date('Y-m-d H:i') ?></p>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>Código / Ítem</th>
                    <th class="text-right">Cantidad</th>
                    <?php if($tipo === 'orden' || ($tipo === 'movimiento' && in_array($documento['tipo'], ['entrada', 'ajuste_ingreso', 'salida', 'ajuste_egreso']))): ?>
                        <th class="text-right">V. Unitario</th>
                        <th class="text-right">IVA</th>
                        <th class="text-right">Subtotal</th>
                    <?php endif; ?>
                </tr>
            </thead>
            <tbody>
                <?php 
                $granSubtotal = 0;
                $granIva = 0;
                $granTotal = 0;

                foreach ($items as $i): 
                    $cant = floatval($i['cantidad']);
                    $vUnit = floatval($tipo === 'orden' ? $i['valor_unitario'] : $i['costo_unitario']);
                    $pctIva = floatval($i['iva_porcentaje']);
                    $vIva = floatval($i['iva_valor']);
                    
                    $subtotalLinea = $cant * $vUnit;
                    $totalLinea = $subtotalLinea + $vIva;

                    $granSubtotal += $subtotalLinea;
                    $granIva += $vIva;
                    $granTotal += $totalLinea;
                ?>
                <tr>
                    <td>
                        <strong><?= htmlspecialchars($i['item_nombre']) ?></strong><br>
                        <span style="font-size: 12px; color: #6b7280;">Unidad: <?= htmlspecialchars($i['unidad'] ?? 'Und') ?></span>
                    </td>
                    <td class="text-right"><?= number_format($cant, 2, ',', '.') ?></td>
                    <?php if($tipo === 'orden' || $tipo === 'movimiento'): ?>
                        <td class="text-right"><?= formatearMoneda($vUnit) ?></td>
                        <td class="text-right"><?= $pctIva ?>%<br><span style="font-size:11px; color:#6b7280;"><?= formatearMoneda($vIva) ?></span></td>
                        <td class="text-right"><?= formatearMoneda($totalLinea) ?></td>
                    <?php endif; ?>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>

        <?php if($tipo === 'orden' || $tipo === 'movimiento'): ?>
        <div class="totals">
            <table>
                <tr>
                    <th>Subtotal Base</th>
                    <td class="text-right"><?= formatearMoneda($granSubtotal) ?></td>
                </tr>
                <tr>
                    <th>Total IVA</th>
                    <td class="text-right"><?= formatearMoneda($granIva) ?></td>
                </tr>
                <tr>
                    <th>Gran Total</th>
                    <td class="text-right"><?= formatearMoneda($granTotal) ?></td>
                </tr>
            </table>
        </div>
        <?php endif; ?>

        <div class="notes">
            <?php 
            $obs = $tipo === 'orden' ? ($documento['notas'] ?? '') : ($documento['observaciones'] ?? '');
            if (!empty($obs)): ?>
                <strong>Observaciones:</strong><br>
                <?= nl2br(htmlspecialchars($obs)) ?><br><br>
            <?php endif; ?>
            <p style="text-align: center; margin-top: 30px;">
                Este documento es un soporte interno de inventario.<br>
                Generado por el Sistema de Administración UT COMEXAGRO.
            </p>
        </div>
    </div>

    <script>
        window.onload = function() {
            setTimeout(() => {
                window.print();
            }, 500);
        };
    </script>
</body>
</html>
