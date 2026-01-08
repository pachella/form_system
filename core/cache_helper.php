<?php
/**
 * Cache Helper
 * Gera versões automáticas de cache baseadas no timestamp do arquivo
 * Atualiza automaticamente quando o arquivo é modificado
 */

/**
 * Gera versão de cache para um arquivo
 * @param string $filePath Caminho absoluto ou relativo a partir da raiz
 * @return string Timestamp do arquivo ou fallback
 */
function getCacheVersion($filePath) {
    // Se o caminho for relativo, converter para absoluto
    if ($filePath[0] !== '/') {
        $filePath = $_SERVER['DOCUMENT_ROOT'] . '/' . ltrim($filePath, '/');
    }

    // Se arquivo existe, retornar filemtime
    if (file_exists($filePath)) {
        return filemtime($filePath);
    }

    // Fallback: usar timestamp atual (força refresh)
    return time();
}

/**
 * Gera URL completa com cache busting
 * @param string $url URL relativa do recurso
 * @return string URL com parâmetro de versão
 */
function assetUrl($url) {
    $filePath = $_SERVER['DOCUMENT_ROOT'] . $url;
    $version = getCacheVersion($filePath);
    return $url . '?v=' . $version;
}
