<?php
session_start();
require_once __DIR__ . '/../../core/db.php';
require_once __DIR__ . '/../../core/PermissionManager.php';

// Verificar se o usuário está logado
if (!isset($_SESSION['user_id'])) {
    header('Location: /login.php');
    exit();
}

$pageTitle = "Criar com IA";
require_once __DIR__ . '/../../views/layout/header.php';
require_once __DIR__ . '/../../views/layout/sidebar.php';
?>

<div class="max-w-5xl mx-auto">
    <!-- Header -->
    <div class="mb-6">
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-bold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                    🤖 Criar Formulário com IA
                </h1>
                <p class="text-sm text-gray-600 dark:text-zinc-400 mt-1">
                    Descreva o formulário que você precisa e deixe a IA criar para você
                </p>
            </div>
            <button onclick="resetChat()" class="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors flex items-center gap-2">
                <i class="fas fa-redo"></i>
                Nova Conversa
            </button>
        </div>
    </div>

    <!-- Chat Container -->
    <div class="bg-white dark:bg-zinc-800 rounded-lg shadow-lg overflow-hidden flex flex-col" style="height: calc(100vh - 220px);">
        <!-- Messages Area -->
        <div id="chatMessages" class="flex-1 overflow-y-auto p-6 space-y-4">
            <!-- Mensagem inicial da IA -->
            <div class="flex gap-3">
                <div class="flex-shrink-0 w-8 h-8 rounded-full bg-[#4EA44B] flex items-center justify-center text-white font-semibold">
                    AI
                </div>
                <div class="flex-1">
                    <div class="bg-gray-100 dark:bg-zinc-700 rounded-lg p-4">
                        <p class="text-gray-900 dark:text-zinc-100">
                            Olá! 👋 Sou seu assistente de criação de formulários.
                        </p>
                        <p class="text-gray-900 dark:text-zinc-100 mt-2">
                            Descreva o tipo de formulário que você precisa e vou te ajudar a criar a estrutura perfeita!
                        </p>
                        <p class="text-sm text-gray-600 dark:text-zinc-400 mt-2">
                            <strong>Exemplo:</strong> "Preciso de um formulário para captar leads de uma loja de roupas"
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Input Area -->
        <div class="border-t border-gray-200 dark:border-zinc-700 p-4">
            <form id="chatForm" class="flex gap-2">
                <input
                    type="text"
                    id="userInput"
                    placeholder="Digite sua mensagem aqui..."
                    class="flex-1 px-4 py-3 border border-gray-300 dark:border-zinc-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4EA44B] dark:bg-zinc-700 dark:text-zinc-100"
                    autocomplete="off"
                >
                <button
                    type="submit"
                    id="sendBtn"
                    class="px-6 py-3 bg-[#4EA44B] hover:bg-[#45943f] text-white rounded-lg font-semibold transition-all flex items-center gap-2"
                >
                    <i class="fas fa-paper-plane"></i>
                    Enviar
                </button>
            </form>
            <div class="mt-2 text-xs text-gray-500 dark:text-zinc-400">
                💡 Dica: Seja específico sobre o tipo de informação que precisa coletar
            </div>
        </div>
    </div>
</div>

<script src="/modules/ai-builder/assets/chat.js?v=11.0.3"></script>

<?php
require_once __DIR__ . '/../../views/layout/footer.php';
?>
