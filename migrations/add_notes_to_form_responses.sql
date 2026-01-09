-- Migration: Adicionar campo notes para observações sobre leads
-- Data: 2026-01-09

ALTER TABLE form_responses
ADD COLUMN notes TEXT NULL,
ADD COLUMN notes_updated_at DATETIME NULL,
ADD COLUMN notes_updated_by INT NULL;

-- Índice para busca rápida
ALTER TABLE form_responses
ADD INDEX idx_notes_updated (notes_updated_at);
