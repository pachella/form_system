<?php
/**
 * Serve arquivos de upload com headers otimizados
 * Uso: serve_image.php?file=forms/123/image.webp
 */

$filename = $_GET['file'] ?? '';

// Validar nome do arquivo (proteger contra path traversal)
if (empty($filename) || strpos($filename, '..') !== false) {
    http_response_code(404);
    exit('Arquivo não encontrado');
}

$filepath = __DIR__ . '/uploads/' . $filename;

// Verificar se arquivo existe e é legível
if (!file_exists($filepath) || !is_readable($filepath)) {
    http_response_code(404);
    exit('Arquivo não encontrado');
}

// Obter tipo MIME
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mimeType = finfo_file($finfo, $filepath);
finfo_close($finfo);

// Verificar se é um tipo de arquivo permitido
$allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
    'image/webp', 'image/svg+xml', 'image/svg'
];

if (!in_array($mimeType, $allowedTypes)) {
    http_response_code(403);
    exit('Tipo de arquivo não permitido');
}

// Headers otimizados para servir a imagem
$lastModified = filemtime($filepath);
$etag = md5_file($filepath);

// Verificar se o navegador já tem a versão em cache
$ifModifiedSince = isset($_SERVER['HTTP_IF_MODIFIED_SINCE']) ? strtotime($_SERVER['HTTP_IF_MODIFIED_SINCE']) : false;
$ifNoneMatch = isset($_SERVER['HTTP_IF_NONE_MATCH']) ? trim($_SERVER['HTTP_IF_NONE_MATCH']) : false;

if (($ifModifiedSince && $ifModifiedSince >= $lastModified) || ($ifNoneMatch && $ifNoneMatch === $etag)) {
    http_response_code(304);
    exit;
}

// Headers de cache
header('Content-Type: ' . $mimeType);
header('Content-Length: ' . filesize($filepath));
header('Cache-Control: public, max-age=31536000, immutable'); // Cache por 1 ano
header('Expires: ' . gmdate('D, d M Y H:i:s', time() + 31536000) . ' GMT');
header('Last-Modified: ' . gmdate('D, d M Y H:i:s', $lastModified) . ' GMT');
header('ETag: "' . $etag . '"');
header('Pragma: public');

// Servir o arquivo
readfile($filepath);
exit;