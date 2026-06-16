<?php
// ============================================================
// api/config/mail.php
// Helper centralizado para envío de correos con PHPMailer
// ============================================================
require_once __DIR__ . '/../libs/phpmailer/Exception.php';
require_once __DIR__ . '/../libs/phpmailer/PHPMailer.php';
require_once __DIR__ . '/../libs/phpmailer/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

/**
 * Enviar un correo electrónico usando PHPMailer
 * 
 * @param string $toEmail Email destino
 * @param string $toName Nombre destino
 * @param string $subject Asunto
 * @param string $body Cuerpo del mensaje (HTML)
 * @param string|null $fromEmail Correo remitente (Si es null, usa gerencia)
 * @param string|null $fromName Nombre remitente (Si es null, usa UT Comexagro)
 * @param string|null $attachmentPath Ruta absoluta al archivo a adjuntar
 * @param string|null $fromPassword Contraseña SMTP del remitente (Si es null, usa la por defecto)
 * @return array ['success' => bool, 'error' => string]
 */
function sendMail(
    string $toEmail, 
    string $toName, 
    string $subject, 
    string $body, 
    ?string $fromEmail = 'gerencia@utcomexagro.com',
    ?string $fromName = 'UT Comexagro',
    ?string $attachmentPath = null,
    ?string $fromPassword = '^6s8ul!Fh9?'
): array {
    
    // Configuraciones específicas por alias (si aplica)
    if ($fromEmail === 'pqr@utcomexagro.com' && $fromPassword === '^6s8ul!Fh9?') {
        $fromPassword = 'U+YJHiiV^e8'; // Contraseña configurada para PQR
    }

    $mail = new PHPMailer(true);

    try {
        // Configuración del servidor
        $mail->isSMTP();
        $mail->CharSet    = 'UTF-8';
        $mail->Host       = 'smtp.hostinger.com'; 
        $mail->SMTPAuth   = true;
        $mail->Username   = $fromEmail; 
        $mail->Password   = $fromPassword; 
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = 587;

        // Remitente y Destinatario
        $mail->setFrom($fromEmail, $fromName);
        $mail->addAddress($toEmail, $toName);

        // Adjuntos
        if ($attachmentPath && file_exists($attachmentPath)) {
            $mail->addAttachment($attachmentPath);
        }

        // Contenido
        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body    = $body;

        $mail->send();
        return ['success' => true, 'error' => ''];
    } catch (Exception $e) {
        return ['success' => false, 'error' => $mail->ErrorInfo];
    }
}
