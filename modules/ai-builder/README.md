# 🤖 AI Builder - Criação de Formulários com IA

Módulo que permite criar formulários através de conversas com Inteligência Artificial.

## 📋 Funcionalidades

- **Chat interativo** com IA (Qwen)
- **Criação automática** de formulários baseada em conversas
- **Suporte a todos os tipos de campos** do sistema
- **Validação inteligente** de estrutura
- **Integração perfeita** com o sistema existente

## 🔧 Configuração

### 1. Obter API Key do Qwen

1. Acesse: https://dashscope.aliyun.com/
2. Crie uma conta (se necessário)
3. Acesse a seção de API Keys
4. Gere uma nova API key

### 2. Configurar API Key

Edite o arquivo: `/modules/ai-builder/api/chat.php`

Encontre a linha:

```php
$apiKey = getenv('QWEN_API_KEY') ?: 'SUA_API_KEY_AQUI';
```

**Opção 1 - Variável de Ambiente (Recomendado):**
```bash
export QWEN_API_KEY="sua_key_aqui"
```

**Opção 2 - Diretamente no código:**
```php
$apiKey = 'sk-xxxxxxxxxxxxx';
```

### 3. Escolher Modelo

No mesmo arquivo `chat.php`, você pode alterar o modelo:

```php
'model' => 'qwen-plus',  // Mais inteligente, mais caro
// ou
'model' => 'qwen-turbo',  // Mais rápido, mais barato
```

## 💰 Custos

- **qwen-turbo**: ~$0.0003 por 1K tokens (mais barato)
- **qwen-plus**: ~$0.002 por 1K tokens (melhor qualidade)

Uma conversa típica usa ~500-1000 tokens, custando menos de $0.002.

## 🎯 Como Usar

1. Acesse o menu lateral: **"Criar com IA"**
2. Descreva o formulário que precisa
3. A IA vai fazer perguntas para entender melhor
4. Confirme quando estiver pronto
5. O formulário será criado automaticamente!

## 🔄 Fluxo de Criação

```
Usuário: "Quero um formulário para captar leads de petshop"
   ↓
IA: "Que informações você quer coletar?"
   ↓
Usuário: "Nome, email, telefone, tipo de pet"
   ↓
IA: [Sugere estrutura completa]
   ↓
Usuário: "Pode criar!"
   ↓
✅ Formulário criado!
```

## 📁 Estrutura de Arquivos

```
modules/ai-builder/
├── config.php           # Configuração do módulo (menu)
├── index.php            # Interface do chat
├── README.md            # Esta documentação
├── api/
│   ├── chat.php         # Comunicação com Qwen API
│   └── create_form.php  # Criação do formulário no banco
└── assets/
    └── chat.js          # Lógica do chat (frontend)
```

## 🎨 Tipos de Campos Suportados

A IA pode criar formulários com todos os tipos:

- **Texto:** text, textarea, name, url
- **Dados pessoais:** email, phone, cpf, cnpj, rg
- **Datas e números:** date, number, money, slider, range
- **Escolha:** radio, select
- **Outros:** address, file, rating, terms, message, welcome

## 🔒 Segurança

- ✅ Validação de autenticação
- ✅ Sanitização de inputs
- ✅ Validação de tipos de campos
- ✅ Prevenção de XSS
- ✅ Transações de banco de dados

## 🐛 Troubleshooting

### Erro: "Resposta inválida da API"
- Verifique se a API key está correta
- Verifique sua conexão com internet
- Verifique se tem créditos na conta Qwen

### Formulário não foi criado
- Verifique os logs do navegador (F12)
- Verifique o error_log do PHP
- Confirme que a estrutura JSON está válida

### IA não entende o pedido
- Seja mais específico
- Mencione os tipos de campos que precisa
- Peça sugestões: "Me dê sugestões de campos"

## 📝 Changelog

### v1.0.0 (2025-01-07)
- 🎉 Lançamento inicial
- ✨ Chat interativo com IA
- 🤖 Integração com Qwen API
- 📋 Criação automática de formulários
- 🎨 Interface moderna e responsiva

## 💡 Próximas Features

- [ ] Suporte a templates pré-definidos
- [ ] Edição de formulários via IA
- [ ] Histórico de conversas
- [ ] Sugestões inteligentes baseadas no nicho
- [ ] Multi-idioma

## 👨‍💻 Desenvolvido por

Claude AI + Pachella
