<?php
// ============================================================
// api/config/usuarios.php
// GET: Listar usuarios | POST: Crear un nuevo usuario
// ============================================================
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/jwt.php';

$auth = JWT::requireAuth();
JWT::requirePermission($auth, 'configuracion', 'usuarios');

$pdo = Database::getConnection();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Listar usuarios
    $stmt = $pdo->query("
        SELECT u.id, u.nombre, u.apellidos, u.email, u.activo, u.ultimo_acceso, u.created_at,
               r.id AS rol_id, r.nombre AS rol_nombre
        FROM usuarios u
        LEFT JOIN roles r ON u.rol_id = r.id
        ORDER BY u.id DESC
    ");
    $usuarios = $stmt->fetchAll();
    jsonResponse(true, 'Usuarios cargados.', $usuarios);
} 
elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Crear usuario
    $nombre    = trim($_POST['nombre'] ?? '');
    $apellidos = trim($_POST['apellidos'] ?? '');
    $email     = trim($_POST['email'] ?? '');
    $password  = $_POST['password'] ?? '';
    $rol_id    = filter_var($_POST['rol_id'] ?? null, FILTER_VALIDATE_INT);
    $activo    = isset($_POST['activo']) ? (int)$_POST['activo'] : 1;

    if (!$nombre || !$email || !$password || !$rol_id) {
        jsonResponse(false, 'Nombre, email, contraseña y rol son obligatorios.', [], 422);
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        jsonResponse(false, 'Email inválido.', [], 422);
    }

    // Verificar si el email ya existe
    $check = $pdo->prepare("SELECT id FROM usuarios WHERE email = ? LIMIT 1");
    $check->execute([$email]);
    if ($check->fetch()) {
        jsonResponse(false, 'El correo electrónico ya está registrado.', [], 409);
    }

    // Verificar si el rol existe
    $checkRol = $pdo->prepare("SELECT id FROM roles WHERE id = ? LIMIT 1");
    $checkRol->execute([$rol_id]);
    if (!$checkRol->fetch()) {
        jsonResponse(false, 'El rol seleccionado no existe.', [], 422);
    }

    // Insertar usuario
    $hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
    $stmt = $pdo->prepare("
        INSERT INTO usuarios (nombre, apellidos, email, password_hash, rol_id, activo)
        VALUES (?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([$nombre, $apellidos, $email, $hash, $rol_id, $activo]);
    $newUserId = $pdo->lastInsertId();

    // Log
    $log = $pdo->prepare("INSERT INTO log_accesos (usuario_id, accion, modulo, ip_address, detalle) VALUES (?, 'crear_usuario', 'configuracion', ?, ?)");
    $log->execute([$auth['sub'], $_SERVER['REMOTE_ADDR'] ?? null, "Usuario creado: $email (ID: $newUserId)"]);

    jsonResponse(true, 'Usuario creado con éxito.', ['id' => $newUserId]);
} 
else {
    jsonResponse(false, 'Método no permitido.', [], 405);
}
