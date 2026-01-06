# Sistema de Webhook Ticto

## Configuração

### 1. Executar Migração do Banco de Dados

Execute o SQL de migração para adicionar os campos necessários:

```bash
mysql -u webformtalk_forms -p webformtalk_forms < /home/user/form_system/migrations/add_subscription_fields.sql
```

Ou execute manualmente no phpMyAdmin/MySQL:

```sql
ALTER TABLE users
ADD COLUMN IF NOT EXISTS subscription_id VARCHAR(255) DEFAULT NULL AFTER user_role,
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT NULL AFTER subscription_id,
ADD COLUMN IF NOT EXISTS subscription_expires_at DATETIME DEFAULT NULL AFTER subscription_status,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER subscription_expires_at;

CREATE INDEX IF NOT EXISTS idx_subscription_expires ON users(subscription_expires_at);
CREATE INDEX IF NOT EXISTS idx_subscription_status ON users(subscription_status);
```

### 2. Configurar Webhook na Ticto

**URL do Webhook:** `https://formtalk.app/webhooks/ticto.php`

**Eventos para configurar:**
- `subscription.created` - Nova assinatura criada
- `subscription.activated` - Assinatura ativada
- `subscription.renewed` - Assinatura renovada
- `charge.approved` - Cobrança aprovada
- `payment.approved` - Pagamento aprovado
- `subscription.cancelled` - Assinatura cancelada
- `subscription.expired` - Assinatura expirada
- `charge.failed` - Cobrança falhou
- `payment.failed` - Pagamento falhou

### 3. Testar Webhook

Você pode testar o webhook enviando um POST para a URL:

```bash
curl -X POST https://formtalk.app/webhooks/ticto.php \
  -H "Content-Type: application/json" \
  -d '{
    "event": "subscription.created",
    "email": "usuario@exemplo.com",
    "name": "Nome do Usuário",
    "subscription_id": "sub_123456",
    "status": "active"
  }'
```

### 4. Logs

Os logs do webhook são salvos em: `/home/user/form_system/webhooks/ticto_webhook.log`

Para visualizar os logs:

```bash
tail -f /home/user/form_system/webhooks/ticto_webhook.log
```

## Funcionamento

### Quando um usuário assina (eventos de ativação):
1. Webhook recebe o evento
2. Busca usuário pelo email
3. Atualiza `user_role` para `pro`
4. Define `subscription_expires_at` para +30 dias
5. Define `subscription_status` como `active`
6. Salva `subscription_id` da Ticto

### Quando uma assinatura é cancelada/expira:
1. Webhook recebe o evento
2. Busca usuário pelo email
3. Atualiza `user_role` para `free`
4. Define `subscription_status` como `cancelled`

### Sistema de Expiração Automática

Para garantir que assinaturas expirem automaticamente após 30 dias sem renovação, você pode criar um CRON job:

**Arquivo:** `/home/user/form_system/cron/check_expired_subscriptions.php`

```php
<?php
require_once(__DIR__ . "/../core/db.php");

// Buscar assinaturas expiradas
$stmt = $pdo->prepare("
    SELECT id, email, user_name
    FROM users
    WHERE subscription_expires_at < NOW()
    AND user_role = 'pro'
    AND subscription_status = 'active'
");
$stmt->execute();
$expiredUsers = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Atualizar usuários expirados para FREE
foreach ($expiredUsers as $user) {
    $updateStmt = $pdo->prepare("
        UPDATE users
        SET user_role = 'free',
            subscription_status = 'expired'
        WHERE id = :user_id
    ");
    $updateStmt->execute([':user_id' => $user['id']]);

    echo "Usuário {$user['email']} retornou para FREE (expirado)\n";
}

echo "Total de assinaturas expiradas: " . count($expiredUsers) . "\n";
```

**Configurar CRON (executar diariamente à meia-noite):**

```bash
crontab -e
```

Adicionar linha:

```
0 0 * * * /usr/bin/php /home/user/form_system/cron/check_expired_subscriptions.php
```

## Ajustes Necessários

⚠️ **IMPORTANTE:** O formato exato do payload da Ticto pode variar. Ajuste os campos no arquivo `ticto.php` conforme a documentação oficial da Ticto:

- Nomes dos eventos (`event`, `type`)
- Campos de email (`email`, `customer.email`)
- Campos de nome (`name`, `customer.name`)
- ID da assinatura (`subscription_id`, `id`)
- Status (`status`)

Verifique os logs em `ticto_webhook.log` para ver o formato real dos dados recebidos.
