<?php
// ============================================================
// api/pqrs/create.php
// Endpoint público: Radicación de PQRs
// POST /api/pqrs/create.php
// ============================================================
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/config.php';

requireMethod('POST');

$tiposValidos = ['Peticion','Queja','Reclamo','Sugerencia','Denuncia'];

function cleanStr(string $v): string {
    return htmlspecialchars(strip_tags(trim($v)), ENT_QUOTES, 'UTF-8');
}

// Validaciones
$tipo       = cleanStr($_POST['tipo'] ?? '');
$nombre     = cleanStr($_POST['nombre'] ?? '');
$descripcion= cleanStr($_POST['descripcion'] ?? '');

if (!in_array($tipo, $tiposValidos, true)) {
    jsonResponse(false, 'Tipo de PQR inválido.', [], 422);
}
if (strlen($nombre) < 3) {
    jsonResponse(false, 'El nombre es requerido.', [], 422);
}
if (strlen($descripcion) < 20) {
    jsonResponse(false, 'La descripción debe tener al menos 20 caracteres.', [], 422);
}

$email = cleanStr($_POST['email'] ?? '');
if ($email && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonResponse(false, 'El email no tiene un formato válido.', [], 422);
}

// Generar número de radicado único: PQR-YYYYMM-XXXXXX
$radicado = 'PQR-' . date('Ym') . '-' . strtoupper(substr(uniqid(), -6));

$pdo = Database::getConnection();

// Manejar adjunto opcional
$adjuntoRuta = null;
if (!empty($_FILES['adjunto']) && $_FILES['adjunto']['error'] === UPLOAD_ERR_OK) {
    $file     = $_FILES['adjunto'];
    $maxSize  = MAX_FILE_SIZE;
    $allowMimes = unserialize(ALLOWED_MIME_TYPES);

    if ($file['size'] > $maxSize) {
        jsonResponse(false, 'El adjunto supera el tamaño máximo de 3MB.', [], 422);
    }

    $finfo    = new finfo(FILEINFO_MIME_TYPE);
    $mimeType = $finfo->file($file['tmp_name']);
    if (!in_array($mimeType, $allowMimes, true)) {
        jsonResponse(false, 'El adjunto debe ser PDF, JPG o PNG.', [], 422);
    }

    $uploadDir = UPLOAD_BASE_PATH . 'pqrs/';
    if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

    $ext      = pathinfo($file['name'], PATHINFO_EXTENSION);
    $safeFile = 'pqr_' . $radicado . '_' . time() . '.' . strtolower($ext);
    $destPath = $uploadDir . $safeFile;

    if (move_uploaded_file($file['tmp_name'], $destPath)) {
        $adjuntoRuta = 'pqrs/' . $safeFile;
    }
}

try {
    $stmt = $pdo->prepare("INSERT INTO pqrs
        (radicado, tipo, nombre, documento, email, telefono, descripcion, adjunto, ip_registro)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");

    $stmt->execute([
        $radicado,
        $tipo,
        $nombre,
        cleanStr($_POST['documento'] ?? '') ?: null,
        $email ?: null,
        cleanStr($_POST['telefono'] ?? '') ?: null,
        $descripcion,
        $adjuntoRuta,
        $_SERVER['REMOTE_ADDR'] ?? null,
    ]);

    jsonResponse(true, "Su $tipo ha sido radicada exitosamente. Guarde su número de radicado para hacer seguimiento.", [
        'radicado'  => $radicado,
        'tipo'      => $tipo,
        'fecha'     => date('d/m/Y H:i'),
        'estado'    => 'recibido',
    ]);

} catch (PDOException $e) {
    jsonResponse(false, 'Error al radicar la PQR. Intente nuevamente.', [
        'error' => APP_ENV === 'development' ? $e->getMessage() : null
    ], 500);
}
