<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';

requireMethod('POST');
$user = JWT::requireAuth();
$pdo = Database::getConnection();

$input = getJsonInput();

$id = $input['id'] ?? null;
$estado = $input['estado'] ?? '';
$respuesta = trim($input['respuesta'] ?? '');
$enviar_correo = isset($input['enviar_correo']) ? (bool)$input['enviar_correo'] : false;

if (!$id || empty($estado)) {
    jsonResponse(false, 'Datos obligatorios incompletos.');
}

try {
    // Check if PQR exists and get email
    $stmtPqr = $pdo->prepare("SELECT * FROM pqrs WHERE id = ?");
    $stmtPqr->execute([$id]);
    $pqr = $stmtPqr->fetch(PDO::FETCH_ASSOC);

    if (!$pqr) {
        jsonResponse(false, 'PQR no encontrado.');
    }

    $stmt = $pdo->prepare("
        UPDATE pqrs 
        SET estado = ?, 
            respuesta = ?, 
            gestionado_por = ?, 
            fecha_gestion = NOW() 
        WHERE id = ?
    ");

    $stmt->execute([
        $estado,
        $respuesta,
        $user['sub'],
        $id
    ]);

    $email_enviado = false;
    $email_error = '';

    if ($enviar_correo && !empty($pqr['email'])) {
        require_once __DIR__ . '/../config/mail.php';

        $subject = "Actualización de tu {$pqr['tipo']} - Radicado {$pqr['radicado']}";
        
        $body = "Hola <b>{$pqr['nombre']}</b>,<br><br>";
        $body .= "Queremos informarte que el estado de tu <b>{$pqr['tipo']}</b> (Radicado: {$pqr['radicado']}) ha cambiado a: <b>" . strtoupper($estado) . "</b>.<br><br>";
        
        if (!empty($respuesta)) {
            $body .= "<b>Mensaje de respuesta:</b><br>";
            $body .= "<i>" . nl2br($respuesta) . "</i><br><br>";
        }
        
        $body .= "Atentamente,<br>Equipo de Control y Seguimiento<br>UT Comexagro";

        $mailResult = sendMail(
            $pqr['email'],
            $pqr['nombre'],
            $subject,
            $body,
            'pqr@utcomexagro.com',
            'PQR UT Comexagro'
        );

        $email_enviado = $mailResult['success'];
        $email_error = $mailResult['error'];
    }

    jsonResponse(true, 'PQR actualizado correctamente.', [
        'email_enviado' => $email_enviado,
        'email_error' => $email_error
    ]);

} catch (PDOException $e) {
    jsonResponse(false, 'Error al actualizar PQR: ' . $e->getMessage());
}
