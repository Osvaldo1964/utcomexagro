<?php
// ============================================================
// api/config/parametros.php
// GET: Obtener parámetros de la empresa | POST: Guardar/actualizar
// ============================================================
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/jwt.php';

$auth = JWT::requireAuth();
$pdo  = Database::getConnection();

// Asegurarse de que la tabla existe (creación lazy)
$pdo->exec("
    CREATE TABLE IF NOT EXISTS empresa_parametros (
        id          INT           NOT NULL DEFAULT 1,
        nit         VARCHAR(20)   DEFAULT NULL,
        nombre      VARCHAR(200)  DEFAULT NULL,
        direccion   VARCHAR(300)  DEFAULT NULL,
        telefono    VARCHAR(20)   DEFAULT NULL,
        email       VARCHAR(150)  DEFAULT NULL,
        rep_legal   VARCHAR(200)  DEFAULT NULL,
        updated_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
");

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    JWT::requirePermission($auth, 'configuracion', 'usuarios');

    $stmt = $pdo->query("SELECT * FROM empresa_parametros WHERE id = 1 LIMIT 1");
    $row  = $stmt->fetch();

    if (!$row) {
        // Devolver un objeto vacío con valores predeterminados
        $row = [
            'id'        => 1,
            'nit'       => '',
            'nombre'    => '',
            'direccion' => '',
            'telefono'  => '',
            'email'     => '',
            'rep_legal' => '',
            'updated_at'=> null,
        ];
    }

    jsonResponse(true, 'Parámetros cargados.', $row);

} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    JWT::requirePermission($auth, 'configuracion', 'usuarios');

    $nit       = trim($_POST['nit']       ?? '');
    $nombre    = trim($_POST['nombre']    ?? '');
    $direccion = trim($_POST['direccion'] ?? '');
    $telefono  = trim($_POST['telefono']  ?? '');
    $email     = trim($_POST['email']     ?? '');
    $rep_legal = trim($_POST['rep_legal'] ?? '');

    if (!$nombre) {
        jsonResponse(false, 'El nombre de la empresa es obligatorio.', [], 422);
    }

    if ($email && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        jsonResponse(false, 'El correo electrónico no tiene un formato válido.', [], 422);
    }

    // UPSERT: siempre usamos id=1 (fila única de configuración)
    $stmt = $pdo->prepare("
        INSERT INTO empresa_parametros (id, nit, nombre, direccion, telefono, email, rep_legal)
        VALUES (1, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            nit       = VALUES(nit),
            nombre    = VALUES(nombre),
            direccion = VALUES(direccion),
            telefono  = VALUES(telefono),
            email     = VALUES(email),
            rep_legal = VALUES(rep_legal)
    ");
    $stmt->execute([$nit, $nombre, $direccion, $telefono, $email, $rep_legal]);

    // Log de auditoría
    $log = $pdo->prepare("
        INSERT INTO log_accesos (usuario_id, accion, modulo, ip_address, detalle)
        VALUES (?, 'actualizar_parametros', 'configuracion', ?, ?)
    ");
    $log->execute([
        $auth['sub'],
        $_SERVER['REMOTE_ADDR'] ?? null,
        "Parámetros de empresa actualizados por usuario ID: " . $auth['sub']
    ]);

    jsonResponse(true, 'Parámetros guardados correctamente.');

} else {
    jsonResponse(false, 'Método no permitido.', [], 405);
}
