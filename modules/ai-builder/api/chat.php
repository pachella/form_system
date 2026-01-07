<?php
session_start();
require_once __DIR__ . '/../../../core/db.php';

header('Content-Type: application/json; charset=utf-8');

// Verificar autenticação
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Não autorizado']);
    exit();
}

// Receber dados
$input = json_decode(file_get_contents('php://input'), true);
$userMessage = $input['message'] ?? '';
$history = $input['history'] ?? [];

if (empty($userMessage)) {
    echo json_encode(['success' => false, 'error' => 'Mensagem vazia']);
    exit();
}

// System prompt - instruções para a IA
$systemPrompt = <<<PROMPT
Você é um assistente especializado em criar formulários online. Seu objetivo é ajudar o usuário a definir a estrutura perfeita do formulário que ele precisa.

## TIPOS DE CAMPOS DISPONÍVEIS:
- text: Campo de texto simples
- textarea: Texto longo (múltiplas linhas)
- email: Email com validação
- phone: Telefone brasileiro (máscara automática)
- cpf: CPF brasileiro (máscara + validação)
- cnpj: CNPJ brasileiro (máscara + validação)
- rg: RG brasileiro
- name: Nome completo
- date: Data (com opção de hora)
- money: Valor monetário (R$)
- number: Número genérico
- url: URL/Link
- address: Endereço completo (CEP, rua, número, etc)
- radio: Múltipla escolha (uma opção)
- select: Lista dropdown
- file: Upload de arquivo
- slider: Escala numérica deslizante
- rating: Avaliação por estrelas
- range: Intervalo de valores
- terms: Aceite de termos
- message: Mensagem informativa (não coleta dados)
- welcome: Tela de boas-vindas

## SUA MISSÃO:
1. Fazer perguntas para entender a necessidade do usuário
2. Sugerir campos apropriados
3. Perguntar sobre obrigatoriedade dos campos
4. Quando o usuário confirmar, retornar a estrutura em JSON

## QUANDO CRIAR O FORMULÁRIO:
Quando o usuário disser algo como: "cria", "criar", "pode criar", "gerar", "confirmar", "isso mesmo", "perfeito, cria"

## FORMATO DE RESPOSTA PARA CRIAR:
Quando for criar, sua resposta DEVE ter exatamente este formato:

[CRIAR_FORMULARIO]
{
  "title": "Nome do Formulário",
  "description": "Descrição opcional",
  "fields": [
    {
      "type": "text",
      "label": "Seu nome completo",
      "description": "Digite seu nome",
      "required": true
    },
    {
      "type": "email",
      "label": "Seu e-mail",
      "required": true
    }
  ]
}
[/CRIAR_FORMULARIO]

## DICAS:
- Seja conversacional e amigável
- Faça uma pergunta por vez
- Sugira melhorias
- Para campos radio/select, perguntar as opções
- Sempre confirme antes de criar

## EXEMPLO DE CONVERSA:
Usuário: "Quero um formulário para captar leads de petshop"
Você: "Ótimo! Vou te ajudar. Para um formulário de captação de leads de petshop, geralmente coletamos:

- Nome do cliente
- Email
- Telefone
- Tipo de pet (cachorro, gato, etc)
- Serviços de interesse

Gostaria de adicionar algum outro campo ou modificar algo?"

Usuário: "Perfeito, pode criar"
Você: "Ótimo! Vou criar o formulário agora.

[CRIAR_FORMULARIO]
{
  "title": "Cadastro de Leads - Petshop",
  "description": "Preencha seus dados para receber novidades e promoções",
  "fields": [...]
}
[/CRIAR_FORMULARIO]"

Agora converse com o usuário e ajude-o a criar o formulário perfeito!
PROMPT;

// Preparar mensagens para a API do Qwen
$messages = [
    [
        'role' => 'system',
        'content' => $systemPrompt
    ]
];

// Adicionar histórico (limitado aos últimos 10 para economizar tokens)
$recentHistory = array_slice($history, -10);
foreach ($recentHistory as $msg) {
    $messages[] = [
        'role' => $msg['role'],
        'content' => $msg['content']
    ];
}

try {
    // Chamar API do Groq
    $response = callGroqAPI($messages);

    // Verificar se a IA sinalizou criação de formulário
    $shouldCreate = false;
    $formStructure = null;

    if (preg_match('/\[CRIAR_FORMULARIO\](.*?)\[\/CRIAR_FORMULARIO\]/s', $response, $matches)) {
        $shouldCreate = true;
        $jsonStr = trim($matches[1]);
        $formStructure = json_decode($jsonStr, true);

        // Remover o JSON da resposta visível
        $response = trim(preg_replace('/\[CRIAR_FORMULARIO\].*?\[\/CRIAR_FORMULARIO\]/s', '', $response));
    }

    echo json_encode([
        'success' => true,
        'message' => $response,
        'shouldCreate' => $shouldCreate,
        'formStructure' => $formStructure
    ]);

} catch (Exception $e) {
    error_log("Erro na API do Groq: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'error' => 'Erro ao processar sua mensagem. Tente novamente.'
    ]);
}

/**
 * Chamar API do Groq
 *
 * Para obter sua API key:
 * 1. Acesse: https://console.groq.com/
 * 2. Faça login (pode usar Google)
 * 3. Vá em "API Keys"
 * 4. Clique em "Create API Key"
 * 5. Cole a key abaixo onde diz 'SUA_API_KEY_AQUI'
 */
function callGroqAPI($messages) {
    // Carregar API key do arquivo de configuração local
    $configFile = __DIR__ . '/../config.local.php';
    if (file_exists($configFile)) {
        require_once($configFile);
        $apiKey = GROQ_API_KEY;
    } else {
        throw new Exception('Arquivo de configuração não encontrado. Crie o arquivo config.local.php com sua API key.');
    }

    $ch = curl_init('https://api.groq.com/openai/v1/chat/completions');

    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $apiKey
        ],
        CURLOPT_POSTFIELDS => json_encode([
            'model' => 'llama-3.1-70b-versatile',  // Modelo mais inteligente (GRATUITO!)
            'messages' => $messages,
            'temperature' => 0.7,
            'max_tokens' => 2000
        ])
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

    if (curl_errno($ch)) {
        throw new Exception('Erro cURL: ' . curl_error($ch));
    }

    curl_close($ch);

    if ($httpCode !== 200) {
        error_log("Groq API Error - HTTP $httpCode: $response");
        throw new Exception("Erro na API (HTTP $httpCode)");
    }

    $data = json_decode($response, true);

    if (!isset($data['choices'][0]['message']['content'])) {
        throw new Exception('Resposta inválida da API');
    }

    return $data['choices'][0]['message']['content'];
}
