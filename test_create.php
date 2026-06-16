<?php
$ch = curl_init('http://localhost/utcomexagro/api/postulados/create.php');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
$data = [
    'tipo_doc' => 'CC',
    'num_doc' => '1234567890',
    'p_apellido' => 'Perez',
    'p_nombre' => 'Juan',
    'consentimiento' => '1',
    'email' => 'juan@example.com',
    'telefono' => '1234567',
    'especialidad' => 'Test',
    'cedula' => new CURLFile(__FILE__, 'text/php', 'test.php'),
    'hoja_vida' => new CURLFile(__FILE__, 'text/php', 'test.php')
];
curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
$response = curl_exec($ch);
$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
echo "HTTP: $httpcode\n";
echo $response;
