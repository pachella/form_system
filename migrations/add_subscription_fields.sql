-- Adicionar campos de assinatura na tabela users
-- Execute este SQL apenas uma vez

-- Verificar se as colunas já existem antes de adicionar
ALTER TABLE users
ADD COLUMN IF NOT EXISTS subscription_id VARCHAR(255) DEFAULT NULL AFTER user_role,
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT NULL AFTER subscription_id,
ADD COLUMN IF NOT EXISTS subscription_expires_at DATETIME DEFAULT NULL AFTER subscription_status,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER subscription_expires_at;

-- Criar índice para melhorar performance em consultas de expiração
CREATE INDEX IF NOT EXISTS idx_subscription_expires ON users(subscription_expires_at);
CREATE INDEX IF NOT EXISTS idx_subscription_status ON users(subscription_status);
