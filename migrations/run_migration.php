<?php
// Script para executar migration
// Acesse via navegador: /migrations/run_migration.php

session_start();
require_once(__DIR__ . '/../core/db.php');

// Apenas admin pode executar migrations
if (!isset($_SESSION['user_role']) || $_SESSION['user_role'] !== 'admin') {
    die('Acesso negado. Apenas administradores podem executar migrations.');
}

$migrationFile = __DIR__ . '/add_notes_to_form_responses.sql';

if (!file_exists($migrationFile)) {
    die('Arquivo de migration não encontrado.');
}

$sql = file_get_contents($migrationFile);

try {
    $pdo->exec($sql);
    echo '<h1>✓ Migration executada com sucesso!</h1>';
    echo '<p>Campo "notes" adicionado à tabela form_responses.</p>';
    echo '<p><a href="/dashboard">← Voltar ao Dashboard</a></p>';
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column') !== false) {
        echo '<h1>Migration já foi executada anteriormente</h1>';
        echo '<p>Campo "notes" já existe na tabela.</p>';
        echo '<p><a href="/dashboard">← Voltar ao Dashboard</a></p>';
    } else {
        echo '<h1>Erro ao executar migration</h1>';
        echo '<p>' . htmlspecialchars($e->getMessage()) . '</p>';
    }
}
