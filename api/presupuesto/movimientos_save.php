<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';

requireMethod('POST');
$user = JWT::requireAuth();
$pdo = Database::getConnection();

$id = $_POST['id'] ?? null;
$fecha = $_POST['fecha'] ?? '';
$tipo = $_POST['tipo'] ?? 'Egreso';
$rubro_id = $_POST['rubro_id'] ?? '';
$tercero_id = $_POST['tercero_id'] ?? '';
$detalle = $_POST['detalle'] ?? '';
$comprobante = $_POST['comprobante'] ?? '';
$valor = isset($_POST['valor']) ? (float)$_POST['valor'] : 0;

if (empty($fecha) || empty($rubro_id) || empty($tercero_id) || $valor <= 0) {
    jsonResponse(false, 'Faltan datos obligatorios o el valor es inválido.');
}

// Upload PDF if present
$soporte_pdf = null;
if (isset($_FILES['soporte']) && $_FILES['soporte']['error'] === UPLOAD_ERR_OK) {
    $fileTmpPath = $_FILES['soporte']['tmp_name'];
    $fileName = $_FILES['soporte']['name'];
    $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
    
    if ($fileExtension !== 'pdf') {
        jsonResponse(false, 'El soporte debe ser un archivo PDF.');
    }
    
    $uploadFileDir = __DIR__ . '/../../uploads/presupuesto/';
    $newFileName = md5(time() . $fileName) . '.pdf';
    $dest_path = $uploadFileDir . $newFileName;
    
    if (move_uploaded_file($fileTmpPath, $dest_path)) {
        $soporte_pdf = 'uploads/presupuesto/' . $newFileName;
    } else {
        jsonResponse(false, 'Error al subir el archivo PDF.');
    }
}

try {
    $pdo->beginTransaction();

    // Validar rubro Nivel 4
    $stmt = $pdo->prepare("SELECT nivel FROM presupuesto_rubros WHERE id = ? FOR UPDATE");
    $stmt->execute([$rubro_id]);
    $rubro = $stmt->fetch();
    if (!$rubro || $rubro['nivel'] != 4) {
        $pdo->rollBack();
        jsonResponse(false, 'El rubro seleccionado no es de Nivel 4 (Hoja).');
    }

    if ($id) {
        // Edit - First revert previous value
        $stmt = $pdo->prepare("SELECT valor, tipo, rubro_id FROM presupuesto_movimientos WHERE id = ?");
        $stmt->execute([$id]);
        $oldMov = $stmt->fetch();
        
        if ($oldMov) {
            $diff_valor = $oldMov['valor'];
            if ($oldMov['tipo'] === 'Egreso') {
                $pdo->exec("UPDATE presupuesto_rubros SET valor_ejecutado = valor_ejecutado - $diff_valor WHERE id = " . (int)$oldMov['rubro_id']);
            } else {
                $pdo->exec("UPDATE presupuesto_rubros SET valor_ejecutado = valor_ejecutado + $diff_valor WHERE id = " . (int)$oldMov['rubro_id']);
            }
        }

        // Apply new values
        if ($soporte_pdf) {
            $stmt = $pdo->prepare("UPDATE presupuesto_movimientos SET fecha=?, tipo=?, rubro_id=?, tercero_id=?, detalle=?, comprobante=?, soporte_pdf=?, valor=? WHERE id=?");
            $stmt->execute([$fecha, $tipo, $rubro_id, $tercero_id, $detalle, $comprobante, $soporte_pdf, $valor, $id]);
        } else {
            $stmt = $pdo->prepare("UPDATE presupuesto_movimientos SET fecha=?, tipo=?, rubro_id=?, tercero_id=?, detalle=?, comprobante=?, valor=? WHERE id=?");
            $stmt->execute([$fecha, $tipo, $rubro_id, $tercero_id, $detalle, $comprobante, $valor, $id]);
        }
        
    } else {
        // Create
        $stmt = $pdo->prepare("
            INSERT INTO presupuesto_movimientos (fecha, tipo, rubro_id, tercero_id, detalle, comprobante, soporte_pdf, valor, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([$fecha, $tipo, $rubro_id, $tercero_id, $detalle, $comprobante, $soporte_pdf, $valor, $user['sub'] ?? null]);
    }

    // Apply new value to rubro
    if ($tipo === 'Egreso') {
        $pdo->exec("UPDATE presupuesto_rubros SET valor_ejecutado = valor_ejecutado + $valor WHERE id = " . (int)$rubro_id);
    } else {
        $pdo->exec("UPDATE presupuesto_rubros SET valor_ejecutado = valor_ejecutado - $valor WHERE id = " . (int)$rubro_id);
    }

    $pdo->commit();
    jsonResponse(true, 'Movimiento registrado exitosamente.');
} catch (PDOException $e) {
    $pdo->rollBack();
    jsonResponse(false, 'Error al guardar el movimiento: ' . $e->getMessage());
}
