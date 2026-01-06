#!/usr/bin/env php
<?php
/**
 * CRON Job: Verificar e expirar assinaturas PRO vencidas
 * Executar diariamente à meia-noite
 *
 * Configurar no crontab:
 * 0 0 * * * /usr/bin/php /home/user/form_system/cron/check_expired_subscriptions.php
 */

require_once(__DIR__ . "/../core/db.php");

$logFile = __DIR__ . '/subscriptions_check.log';
$now = date('Y-m-d H:i:s');

file_put_contents($logFile, "\n" . str_repeat('=', 80) . "\n", FILE_APPEND);
file_put_contents($logFile, "[{$now}] Verificando assinaturas expiradas...\n", FILE_APPEND);

try {
    // Buscar assinaturas expiradas que ainda estão como PRO
    $stmt = $pdo->prepare("
        SELECT id, email, user_name, subscription_expires_at
        FROM users
        WHERE subscription_expires_at < NOW()
        AND user_role = 'pro'
        AND subscription_status = 'active'
    ");
    $stmt->execute();
    $expiredUsers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (count($expiredUsers) === 0) {
        file_put_contents($logFile, "[{$now}] Nenhuma assinatura expirada encontrada.\n", FILE_APPEND);
        echo "Nenhuma assinatura expirada.\n";
        exit(0);
    }

    // Atualizar usuários expirados para FREE
    foreach ($expiredUsers as $user) {
        $updateStmt = $pdo->prepare("
            UPDATE users
            SET user_role = 'free',
                subscription_status = 'expired',
                updated_at = NOW()
            WHERE id = :user_id
        ");
        $updateStmt->execute([':user_id' => $user['id']]);

        $message = "✓ Usuário #{$user['id']} ({$user['email']}) retornou para FREE - expirado em {$user['subscription_expires_at']}";
        file_put_contents($logFile, "[{$now}] {$message}\n", FILE_APPEND);
        echo "{$message}\n";
    }

    $total = count($expiredUsers);
    file_put_contents($logFile, "[{$now}] Total de assinaturas expiradas: {$total}\n", FILE_APPEND);
    echo "\nTotal: {$total} assinaturas expiradas.\n";

} catch (Exception $e) {
    $error = "ERRO: " . $e->getMessage();
    file_put_contents($logFile, "[{$now}] {$error}\n", FILE_APPEND);
    echo "{$error}\n";
    exit(1);
}
