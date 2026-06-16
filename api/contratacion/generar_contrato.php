<?php
// api/contratacion/generar_contrato.php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';

requireMethod('POST');
$user = JWT::requireAuth();
JWT::requirePermission($user, 'contratacion', 'evaluar');

$postulado_id = $_POST['postulado_id'] ?? null;
$fecha_inicio = $_POST['fecha_inicio'] ?? null;
$fecha_fin = $_POST['fecha_fin'] ?? null;
$valor_mensual = $_POST['valor_mensual'] ?? null;
$forma_pago = $_POST['forma_pago'] ?? null;
$cargo = $_POST['cargo'] ?? null;

if (!$postulado_id || !$fecha_inicio || !$valor_mensual || !$cargo) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Faltan datos obligatorios para el contrato.']);
    exit;
}

$pdo = Database::getConnection();

try {
    $pdo->beginTransaction();

    // 1. Obtener datos del postulado
    $stmt = $pdo->prepare("SELECT * FROM postulados WHERE id = ? AND estado_evaluacion = 'seleccionado'");
    $stmt->execute([$postulado_id]);
    $postulado = $stmt->fetch();

    if (!$postulado) {
        throw new Exception("Postulado no encontrado o no está en estado seleccionado.");
    }

    // 2. Generar Número de Contrato: CONT-PER-{AÑO}-{000}
    $year = date('Y');
    $prefix = "CONT-PER-{$year}-";
    $stmtCount = $pdo->prepare("SELECT numero_contrato FROM contratos WHERE numero_contrato LIKE ? ORDER BY numero_contrato DESC LIMIT 1");
    $stmtCount->execute(["{$prefix}%"]);
    $lastContract = $stmtCount->fetchColumn();

    $nextNum = 1;
    if ($lastContract) {
        $parts = explode('-', $lastContract);
        $lastNum = (int)end($parts);
        $nextNum = $lastNum + 1;
    }
    $numero_contrato = $prefix . str_pad($nextNum, 3, '0', STR_PAD_LEFT);

    // 3. Crear el Contrato
    $stmtInsertContrato = $pdo->prepare("
        INSERT INTO contratos (postulado_id, numero_contrato, cargo, fecha_inicio, fecha_fin, valor_mensual, forma_pago, estado, generado_por)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'generado', ?)
    ");
    $stmtInsertContrato->execute([
        $postulado_id,
        $numero_contrato,
        $cargo,
        $fecha_inicio,
        $fecha_fin ?: null,
        $valor_mensual,
        $forma_pago,
        $user['sub']
    ]);
    $contrato_id = $pdo->lastInsertId();

    // 4. Crear Empleado (Copiando datos del postulado)
    $stmtInsertEmpleado = $pdo->prepare("
        INSERT INTO empleados (
            postulado_id, contrato_id, organizacion_id, tipo_doc, num_doc, 
            nombres, apellidos, cargo, salario, fecha_inicio, fecha_fin, 
            email, telefono, departamento, municipio
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $nombres = trim($postulado['p_nombre'] . ' ' . $postulado['s_nombre']);
    $apellidos = trim($postulado['p_apellido'] . ' ' . $postulado['s_apellido']);

    $stmtInsertEmpleado->execute([
        $postulado_id,
        $contrato_id,
        $postulado['organizacion_id'],
        $postulado['tipo_doc'],
        $postulado['num_doc'],
        $nombres,
        $apellidos,
        $cargo,
        $valor_mensual,
        $fecha_inicio,
        $fecha_fin ?: null,
        $postulado['email'],
        $postulado['telefono'],
        $postulado['departamento'],
        $postulado['municipio']
    ]);

    // 5. Actualizar estado del postulado a 'contratado'
    $stmtUpdatePostulado = $pdo->prepare("UPDATE postulados SET estado_evaluacion = 'contratado' WHERE id = ?");
    $stmtUpdatePostulado->execute([$postulado_id]);

    // 6. Generar PDF (Minuta)
    require_once __DIR__ . '/../libs/fpdf/fpdf.php';
    $pdf = new FPDF();
    $pdf->AddPage();
    $pdf->SetFont('Arial', 'B', 16);
    $pdf->Cell(0, 10, mb_convert_encoding('CONTRATO DE PRESTACIÓN DE SERVICIOS', 'ISO-8859-1', 'UTF-8'), 0, 1, 'C');
    $pdf->Ln(10);
    $pdf->SetFont('Arial', '', 12);
    
    $minuta = "Entre los suscritos a saber, de una parte UT COMEXAGRO, y de la otra parte {$nombres} {$apellidos}, identificado con documento {$postulado['tipo_doc']} número {$postulado['num_doc']}, se ha celebrado el presente contrato para desempeñar el cargo de {$cargo}. \n\n";
    $minuta .= "El contrato iniciará el {$fecha_inicio} ";
    if ($fecha_fin) {
        $minuta .= "y finalizará el {$fecha_fin}. \n\n";
    } else {
        $minuta .= "y será a término indefinido. \n\n";
    }
    $minuta .= "El valor a pagar será de $" . number_format((float)$valor_mensual, 0, ',', '.') . " pagaderos de forma {$forma_pago}.\n\n";
    
    $pdf->MultiCell(0, 8, mb_convert_encoding($minuta, 'ISO-8859-1', 'UTF-8'));
    
    $pdf->Ln(20);
    $pdf->Cell(0, 10, mb_convert_encoding('__________________________________', 'ISO-8859-1', 'UTF-8'), 0, 1, 'L');
    $pdf->Cell(0, 10, mb_convert_encoding("Firma: {$nombres} {$apellidos}", 'ISO-8859-1', 'UTF-8'), 0, 1, 'L');
    
    $pdfFile = __DIR__ . "/../../uploads/contratos/{$numero_contrato}.pdf";
    $pdf->Output('F', $pdfFile);

    // 7. Enviar Email con PHPMailer
    require_once __DIR__ . '/../libs/phpmailer/Exception.php';
    require_once __DIR__ . '/../libs/phpmailer/PHPMailer.php';
    require_once __DIR__ . '/../libs/phpmailer/SMTP.php';

    $mail = new PHPMailer\PHPMailer\PHPMailer(true);
    $email_enviado = false;
    $email_error = '';
    
    try {
        $mail->isSMTP();
        $mail->Host       = 'smtp.hostinger.com'; 
        $mail->SMTPAuth   = true;
        // NOTA: Configura aquí tu correo y contraseña (app password)
        $mail->Username   = 'gerencia@utcomexagro.com'; 
        $mail->Password   = '^6s8ul!Fh9?'; 
        $mail->SMTPSecure = PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS;
        $mail->Port       = 465;

        $mail->setFrom('no-reply@utcomexagro.com', 'UT Comexagro');
        $mail->addAddress($postulado['email'], "{$nombres} {$apellidos}");

        // Adjunto
        $mail->addAttachment($pdfFile);

        // Contenido
        $mail->isHTML(true);
        $mail->Subject = mb_convert_encoding("Tu Contrato con UT Comexagro: {$numero_contrato}", 'ISO-8859-1', 'UTF-8');
        $mail->Body    = "Hola <b>{$nombres}</b>,<br><br>Adjunto enviamos tu contrato número <b>{$numero_contrato}</b>. Por favor revísalo, fírmalo y entrégalo en nuestras oficinas.<br><br>Atentamente,<br>Equipo UT Comexagro";

        // Intenta enviar el correo
        $mail->send();
        $email_enviado = true; 
    } catch (Exception $e) {
        $email_enviado = false;
        $email_error = $mail->ErrorInfo;
    }

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Contrato generado exitosamente. ' . ($email_enviado ? 'Correo enviado.' : 'Revisa la config SMTP para enviar correos.'),
        'numero_contrato' => $numero_contrato
    ]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al generar el contrato: ' . $e->getMessage()
    ]);
}
