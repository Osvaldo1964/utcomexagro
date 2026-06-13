<?php
// ============================================================
// api/postulados/create.php
// Endpoint público: Registro de Postulados
// POST /api/postulados/create.php
// ============================================================
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/config.php';

requireMethod('POST');

// ---- Leer y sanitizar datos del formulario ----
function clean(string $value): string {
    return htmlspecialchars(strip_tags(trim($value)), ENT_QUOTES, 'UTF-8');
}

$tiposDocValidos   = ['CC','CE','TI','Pasaporte','PEP','PPT'];
$sexosValidos      = ['Masculino','Femenino','Otro','No informa'];
$estadoCivilValidos= ['Soltero(a)','Casado(a)','Unión Libre','Separado(a)','Viudo(a)'];
$rhValidos         = ['O+','O-','A+','A-','B+','B-','AB+','AB-'];
$tallaCamisaValida = ['XS','S','M','L','XL','XXL','XXXL'];
$tiposDocArchivo   = ['cedula','hoja_vida','cert_experiencia'];

// Campos requeridos
$requiredFields = ['tipo_doc','num_doc','p_apellido','p_nombre'];
foreach ($requiredFields as $field) {
    if (empty($_POST[$field])) {
        jsonResponse(false, "El campo '$field' es requerido.", [], 422);
    }
}

// Consentimiento es obligatorio (checkbox)
if (empty($_POST['consentimiento'])) {
    jsonResponse(false, "Debe aceptar la política de tratamiento de datos personales.", [], 422);
}

// Validar tipo de documento
$tipoDoc = clean($_POST['tipo_doc'] ?? '');
if (!in_array($tipoDoc, $tiposDocValidos, true)) {
    jsonResponse(false, 'Tipo de documento inválido.', [], 422);
}

$numDoc = preg_replace('/[^a-zA-Z0-9\-]/', '', $_POST['num_doc'] ?? '');
if (strlen($numDoc) < 5 || strlen($numDoc) > 30) {
    jsonResponse(false, 'Número de documento inválido.', [], 422);
}

// Validar email
$email = clean($_POST['email'] ?? '');
if ($email && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonResponse(false, 'El email no tiene un formato válido.', [], 422);
}

// Validar fecha de nacimiento
$fechaNac = $_POST['fecha_nacimiento'] ?? '';
if ($fechaNac && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $fechaNac)) {
    $fechaNac = null;
}

$sexo = clean($_POST['sexo'] ?? '');
if ($sexo && !in_array($sexo, $sexosValidos, true)) $sexo = null;

$estadoCivil = clean($_POST['estado_civil'] ?? '');
if ($estadoCivil && !in_array($estadoCivil, $estadoCivilValidos, true)) $estadoCivil = null;

$rh = clean($_POST['rh'] ?? '');
if ($rh && !in_array($rh, $rhValidos, true)) $rh = null;

$tallaCamisa = clean($_POST['talla_camisa'] ?? '');
if ($tallaCamisa && !in_array($tallaCamisa, $tallaCamisaValida, true)) $tallaCamisa = null;

$pdo = Database::getConnection();

// ---- Verificar duplicado por número de documento ----
$stmt = $pdo->prepare('SELECT id FROM postulados WHERE num_doc = ?');
$stmt->execute([$numDoc]);
if ($stmt->fetchColumn()) {
    jsonResponse(false, 'Ya existe un postulado registrado con ese número de documento.', [], 409);
}

// ---- Insertar postulado ----
try {
    $pdo->beginTransaction();

    $sql = "INSERT INTO postulados (
        organizacion_id,
        tipo_doc, num_doc,
        p_apellido, s_apellido, p_nombre, s_nombre,
        direccion, email, telefono,
        sexo, estado_civil, rh, fecha_nacimiento,
        especialidad,
        talla_camisa, talla_pantalon,
        eps, afp, arl, discapacidad,
        pais_origen, departamento, municipio,
        ip_registro
    ) VALUES (
        :organizacion_id,
        :tipo_doc, :num_doc,
        :p_apellido, :s_apellido, :p_nombre, :s_nombre,
        :direccion, :email, :telefono,
        :sexo, :estado_civil, :rh, :fecha_nacimiento,
        :especialidad,
        :talla_camisa, :talla_pantalon,
        :eps, :afp, :arl, :discapacidad,
        :pais_origen, :departamento, :municipio,
        :ip_registro
    )";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':organizacion_id'  => filter_var($_POST['organizacion_id'] ?? null, FILTER_VALIDATE_INT) ?: null,
        ':tipo_doc'         => $tipoDoc,
        ':num_doc'          => $numDoc,
        ':p_apellido'       => clean($_POST['p_apellido'] ?? ''),
        ':s_apellido'       => clean($_POST['s_apellido'] ?? '') ?: null,
        ':p_nombre'         => clean($_POST['p_nombre'] ?? ''),
        ':s_nombre'         => clean($_POST['s_nombre'] ?? '') ?: null,
        ':direccion'        => clean($_POST['direccion'] ?? '') ?: null,
        ':email'            => $email ?: null,
        ':telefono'         => clean($_POST['telefono'] ?? '') ?: null,
        ':sexo'             => $sexo ?: null,
        ':estado_civil'     => $estadoCivil ?: null,
        ':rh'               => $rh ?: null,
        ':fecha_nacimiento' => $fechaNac ?: null,
        ':especialidad'     => clean($_POST['especialidad'] ?? '') ?: null,
        ':talla_camisa'     => $tallaCamisa ?: null,
        ':talla_pantalon'   => clean($_POST['talla_pantalon'] ?? '') ?: null,
        ':eps'              => clean($_POST['eps'] ?? '') ?: null,
        ':afp'              => clean($_POST['afp'] ?? '') ?: null,
        ':arl'              => clean($_POST['arl'] ?? '') ?: null,
        ':discapacidad'     => clean($_POST['discapacidad'] ?? '') ?: null,
        ':pais_origen'      => clean($_POST['pais_origen'] ?? 'Colombia'),
        ':departamento'     => clean($_POST['departamento'] ?? '') ?: null,
        ':municipio'        => clean($_POST['municipio'] ?? '') ?: null,
        ':ip_registro'      => $_SERVER['REMOTE_ADDR'] ?? null,
    ]);

    $postuladoId = (int)$pdo->lastInsertId();

    // ---- Procesar archivos adjuntos ----
    $allowedMimes = unserialize(ALLOWED_MIME_TYPES);
    $uploadedFiles = [];

    foreach ($tiposDocArchivo as $tipoArchivo) {
        if (empty($_FILES[$tipoArchivo]) || $_FILES[$tipoArchivo]['error'] === UPLOAD_ERR_NO_FILE) {
            continue;
        }

        $file = $_FILES[$tipoArchivo];

        // Validar error de subida
        if ($file['error'] !== UPLOAD_ERR_OK) {
            continue;
        }

        // Validar tamaño
        if ($file['size'] > MAX_FILE_SIZE) {
            $pdo->rollBack();
            jsonResponse(false, "El archivo '$tipoArchivo' supera el tamaño máximo de 3MB.", [], 422);
        }

        // Validar tipo MIME
        $finfo    = new finfo(FILEINFO_MIME_TYPE);
        $mimeType = $finfo->file($file['tmp_name']);
        if (!in_array($mimeType, $allowedMimes, true)) {
            $pdo->rollBack();
            jsonResponse(false, "El archivo '$tipoArchivo' debe ser PDF, JPG, PNG o WEBP.", [], 422);
        }

        // Crear directorio si no existe
        $uploadDir = UPLOAD_BASE_PATH . "postulados/$postuladoId/";
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        // Generar nombre seguro
        $ext          = pathinfo($file['name'], PATHINFO_EXTENSION);
        $safeFilename = $tipoArchivo . '_' . time() . '_' . uniqid() . '.' . strtolower($ext);
        $destPath     = $uploadDir . $safeFilename;

        if (!move_uploaded_file($file['tmp_name'], $destPath)) {
            $pdo->rollBack();
            jsonResponse(false, "Error al guardar el archivo '$tipoArchivo'.", [], 500);
        }

        // Guardar en BD
        $stmtDoc = $pdo->prepare("INSERT INTO documentos_postulado
            (postulado_id, tipo_doc, nombre_original, nombre_archivo, ruta_relativa, tamano_bytes, mime_type)
            VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmtDoc->execute([
            $postuladoId,
            $tipoArchivo,
            $file['name'],
            $safeFilename,
            "postulados/$postuladoId/$safeFilename",
            $file['size'],
            $mimeType,
        ]);

        $uploadedFiles[] = $tipoArchivo;
    }

    $pdo->commit();

    jsonResponse(true, '¡Registro exitoso! Tu postulación ha sido recibida. Nos pondremos en contacto contigo.', [
        'postulado_id'    => $postuladoId,
        'num_doc'         => $numDoc,
        'nombre'          => clean($_POST['p_nombre'] ?? '') . ' ' . clean($_POST['p_apellido'] ?? ''),
        'archivos_subidos'=> $uploadedFiles,
    ]);

} catch (PDOException $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    jsonResponse(false, 'Error interno del servidor. Intente nuevamente.', [
        'error' => APP_ENV === 'development' ? $e->getMessage() : null
    ], 500);
}
