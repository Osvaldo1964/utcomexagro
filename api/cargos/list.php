<?php
// api/cargos/list.php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';

requireMethod('GET');
// Opcionalmente podemos requerir autenticación para el CRUD, pero para la vista pública no, 
// o podemos tener un parámetro público vs admin.
// Verificamos si hay token para roles administrativos, si no, es público y solo devolvemos los activos.
$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? '';

$isAdmin = false;
if (strpos($authHeader, 'Bearer ') === 0) {
    try {
        $token = substr($authHeader, 7);
        $payload = JWT::validate($token);
        if ($payload) {
            $isAdmin = true;
        }
    } catch(Exception $e) {}
}

$pdo = Database::getConnection();

try {
    $where = [];
    $params = [];

    // Si no es admin o si se pide explicitamente activos, filtramos
    if (!$isAdmin || (isset($_GET['activos']) && $_GET['activos'] == '1')) {
        $where[] = "activo = 1";
    }

    $sql = "SELECT * FROM cargos";
    if (count($where) > 0) {
        $sql .= " WHERE " . implode(" AND ", $where);
    }
    $sql .= " ORDER BY nombre ASC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $cargos = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'data' => $cargos
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al obtener los cargos.',
        'error' => APP_ENV === 'development' ? $e->getMessage() : null
    ]);
}
