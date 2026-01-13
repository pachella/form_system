<?php
/**
 * Upload de áudio para campos message
 */
session_start();
require_once(__DIR__ . "/../../../core/db.php");

header('Content-Type: application/json; charset=utf-8');

// Verificar autenticação
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Não autorizado']);
    exit();
}

// Verificar se o arquivo foi enviado
if (!isset($_FILES['audio_file']) || $_FILES['audio_file']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['error' => 'Nenhum arquivo enviado ou erro no upload']);
    exit();
}

$file = $_FILES['audio_file'];
$userId = $_SESSION['user_id'];

// Validar tipo de arquivo (áudio)
$allowedMimeTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/x-m4a', 'audio/aac'];
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mimeType = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);

if (!in_array($mimeType, $allowedMimeTypes)) {
    http_response_code(400);
    echo json_encode(['error' => 'Formato de arquivo não permitido. Use MP3, WAV, OGG ou M4A']);
    exit();
}

// Validar tamanho (máximo 10MB)
$maxSize = 10 * 1024 * 1024; // 10MB
if ($file['size'] > $maxSize) {
    http_response_code(400);
    echo json_encode(['error' => 'Arquivo muito grande. Tamanho máximo: 10MB']);
    exit();
}

// Definir diretório de upload
$uploadDir = __DIR__ . '/../../../uploads/audio/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// Gerar nome único para o arquivo
$extension = pathinfo($file['name'], PATHINFO_EXTENSION);
$fileName = 'audio_' . $userId . '_' . time() . '_' . uniqid() . '.' . $extension;
$uploadPath = $uploadDir . $fileName;

// Mover arquivo
if (!move_uploaded_file($file['tmp_name'], $uploadPath)) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro ao salvar o arquivo']);
    exit();
}

// Retornar URL do arquivo
$audioUrl = '/uploads/audio/' . $fileName;

echo json_encode([
    'success' => true,
    'url' => $audioUrl,
    'filename' => $fileName
]);
