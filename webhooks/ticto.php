<?php
/**
 * Webhook da Ticto para processar eventos de assinatura
 * Formtalk - Sistema de Formulários
 */

// Log de debug (opcional - remover em produção)
$logFile = __DIR__ . '/ticto_webhook.log';

// Capturar dados do webhook
$rawPayload = file_get_contents('php://input');
$payload = json_decode($rawPayload, true);

// Log do payload recebido
file_put_contents($logFile, date('[Y-m-d H:i:s] ') . "Webhook recebido:\n" . print_r($payload, true) . "\n\n", FILE_APPEND);

// Verificar se é um JSON válido
if (!$payload) {
    http_response_code(400);
    echo json_encode(['error' => 'Payload inválido']);
    file_put_contents($logFile, date('[Y-m-d H:i:s] ') . "ERRO: Payload inválido\n\n", FILE_APPEND);
    exit;
}

// Conectar ao banco de dados
require_once(__DIR__ . "/../core/db.php");

try {
    // Extrair dados do webhook
    // IMPORTANTE: Ajustar campos conforme formato real da Ticto
    $event = $payload['event'] ?? $payload['type'] ?? '';
    $customerEmail = $payload['email'] ?? $payload['customer']['email'] ?? '';
    $customerName = $payload['name'] ?? $payload['customer']['name'] ?? '';
    $subscriptionId = $payload['subscription_id'] ?? $payload['id'] ?? '';
    $status = $payload['status'] ?? '';

    file_put_contents($logFile, date('[Y-m-d H:i:s] ') . "Processando evento: {$event} para {$customerEmail}\n", FILE_APPEND);

    // Buscar usuário pelo email
    $stmt = $pdo->prepare("SELECT id, email, user_role FROM users WHERE email = :email LIMIT 1");
    $stmt->execute([':email' => $customerEmail]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        // Usuário não encontrado - pode ser um novo cadastro
        file_put_contents($logFile, date('[Y-m-d H:i:s] ') . "AVISO: Usuário não encontrado: {$customerEmail}\n\n", FILE_APPEND);
        http_response_code(404);
        echo json_encode(['error' => 'Usuário não encontrado', 'email' => $customerEmail]);
        exit;
    }

    // Processar evento
    switch ($event) {
        case 'subscription.created':
        case 'subscription.activated':
        case 'subscription.renewed':
        case 'charge.approved':
        case 'payment.approved':
            // Ativar plano PRO por 30 dias
            $expiresAt = date('Y-m-d H:i:s', strtotime('+30 days'));

            $updateStmt = $pdo->prepare("
                UPDATE users
                SET user_role = 'pro',
                    subscription_id = :subscription_id,
                    subscription_status = 'active',
                    subscription_expires_at = :expires_at,
                    updated_at = NOW()
                WHERE id = :user_id
            ");

            $updateStmt->execute([
                ':subscription_id' => $subscriptionId,
                ':expires_at' => $expiresAt,
                ':user_id' => $user['id']
            ]);

            file_put_contents($logFile, date('[Y-m-d H:i:s] ') . "✓ Usuário #{$user['id']} atualizado para PRO até {$expiresAt}\n\n", FILE_APPEND);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Assinatura ativada',
                'user_id' => $user['id'],
                'expires_at' => $expiresAt
            ]);
            break;

        case 'subscription.cancelled':
        case 'subscription.expired':
        case 'charge.failed':
        case 'payment.failed':
            // Desativar plano PRO
            $updateStmt = $pdo->prepare("
                UPDATE users
                SET user_role = 'free',
                    subscription_status = 'cancelled',
                    updated_at = NOW()
                WHERE id = :user_id
            ");

            $updateStmt->execute([':user_id' => $user['id']]);

            file_put_contents($logFile, date('[Y-m-d H:i:s] ') . "✓ Usuário #{$user['id']} retornou para FREE\n\n", FILE_APPEND);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Assinatura cancelada',
                'user_id' => $user['id']
            ]);
            break;

        default:
            file_put_contents($logFile, date('[Y-m-d H:i:s] ') . "AVISO: Evento não processado: {$event}\n\n", FILE_APPEND);
            http_response_code(200);
            echo json_encode(['message' => 'Evento não processado', 'event' => $event]);
            break;
    }

} catch (Exception $e) {
    file_put_contents($logFile, date('[Y-m-d H:i:s] ') . "ERRO: " . $e->getMessage() . "\n\n", FILE_APPEND);
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
