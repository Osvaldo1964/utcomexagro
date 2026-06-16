<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';

requireMethod('POST');
$user = JWT::requireAuth();
$pdo = Database::getConnection();

$input = json_decode(file_get_contents('php://input'), true);

$titulo = trim($input['titulo'] ?? '');
$fecha_inicio = trim($input['fecha_inicio'] ?? '');
$fecha_fin = trim($input['fecha_fin'] ?? '');
$preguntas = $input['preguntas'] ?? [];

if (empty($titulo)) {
    echo json_encode(['success' => false, 'message' => 'El título de la encuesta es obligatorio.']);
    exit;
}

if (!is_array($preguntas)) {
    echo json_encode(['success' => false, 'message' => 'Las preguntas deben tener un formato válido.']);
    exit;
}

if (count($preguntas) > 10) {
    echo json_encode(['success' => false, 'message' => 'El máximo permitido es de 10 preguntas por encuesta.']);
    exit;
}

// Basic validation for questions
foreach ($preguntas as $p) {
    if (empty($p['texto'])) {
        echo json_encode(['success' => false, 'message' => 'Todas las preguntas deben tener texto.']);
        exit;
    }
    if (!in_array($p['tipo'], ['fecha', 'texto', 'opcion', 'seleccion_multiple'])) {
        echo json_encode(['success' => false, 'message' => 'Tipo de respuesta inválido en una de las preguntas.']);
        exit;
    }
}

try {
    $stmt = $pdo->prepare("
        INSERT INTO encuestas (titulo, fecha_inicio, fecha_fin, preguntas, activa, created_by)
        VALUES (?, ?, ?, ?, 1, ?)
    ");

    $preguntasJson = json_encode($preguntas, JSON_UNESCAPED_UNICODE);
    
    $fechaInicioVal = empty($fecha_inicio) ? null : $fecha_inicio;
    $fechaFinVal = empty($fecha_fin) ? null : $fecha_fin;

    $stmt->execute([
        $titulo,
        $fechaInicioVal,
        $fechaFinVal,
        $preguntasJson,
        $user['sub'] ?? null
    ]);

    echo json_encode([
        'success' => true,
        'message' => 'Encuesta creada exitosamente.',
        'id' => $pdo->lastInsertId()
    ]);

} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error al guardar la encuesta: ' . $e->getMessage()
    ]);
}
