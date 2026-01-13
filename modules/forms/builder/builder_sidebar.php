<?php
// Verificar se usuário está logado
if (!isset($_SESSION['user_id'])) {
    header("Location: /auth/login");
    exit;
}

// Verificar se temos o ID do formulário
$formId = $_GET['id'] ?? null;
if (!$formId) {
    header("Location: /modules/forms/list.php");
    exit;
}

// Definir página atual
$currentPath = $_SERVER['REQUEST_URI'];
$currentFile = basename($_SERVER['PHP_SELF']);

function isActiveBuilder($page, $currentFile) {
    return $currentFile === $page
        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-l-4 border-green-600'
        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700/50 hover:text-gray-900 dark:hover:text-zinc-100 border-l-4 border-transparent';
}

// Definir label do perfil baseado no role
$roleLabel = 'Usuário';
if (isset($_SESSION['user_role'])) {
    $roleLabel = $_SESSION['user_role'] === 'admin' ? 'Administrador' : 'Cliente';
}
?>

<!-- Overlay (mobile) -->
<div id="sidebar-overlay" class="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden hidden" onclick="closeSidebar()"></div>

<!-- Sidebar SUPREMA do Builder -->
<aside id="sidebar" class="fixed inset-y-0 left-0 transform -translate-x-full lg:translate-x-0 w-64 bg-white dark:bg-zinc-800 shadow-xl transition-transform duration-300 ease-in-out z-50 flex flex-col">

  <!-- Header da sidebar -->
  <div class="p-6 border-b border-gray-200 dark:border-zinc-700">
    <a href="/forms/list" class="text-sm text-gray-600 dark:text-gray-400 hover:underline inline-flex items-center mb-4">
      <i data-feather="arrow-left" class="w-4 h-4 mr-1"></i> Voltar para formulários
    </a>
    <h2 class="text-lg font-bold text-gray-800 dark:text-gray-200">Editor de Formulário</h2>
  </div>

  <!-- Navigation (com scroll) -->
  <nav class="flex-1 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-zinc-600">
    <ul class="space-y-1">

      <!-- Editar Perguntas -->
      <li>
        <a href="/modules/forms/builder/?id=<?= $formId ?>"
           class="flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 <?= isActiveBuilder('index.php', $currentFile) ?>">
          <i data-feather="edit-3" class="w-5 h-5 flex-shrink-0"></i>
          <span class="ml-3">Editar Perguntas</span>
        </a>
      </li>

      <!-- Ver Respostas -->
      <li>
        <a href="/forms/<?= $formId ?>/responses"
           class="flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 <?= isActiveBuilder('list.php', $currentFile) ?>">
          <i data-feather="inbox" class="w-5 h-5 flex-shrink-0"></i>
          <span class="ml-3">Ver Respostas</span>
        </a>
      </li>

      <!-- Visualizar Formulário -->
      <li>
        <a href="<?php
             // Carregar config se não estiver carregado
             if (!function_exists('getPublicFormUrl')) {
                 require_once(__DIR__ . '/../../../core/config.php');
             }
             echo getPublicFormUrl($formId);
           ?>"
           target="_blank"
           class="flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700/50 hover:text-gray-900 dark:hover:text-zinc-100 border-l-4 border-transparent">
          <i data-feather="eye" class="w-5 h-5 flex-shrink-0"></i>
          <span class="ml-3">Visualizar Formulário</span>
          <i data-feather="external-link" class="w-3.5 h-3.5 ml-auto opacity-50"></i>
        </a>
      </li>

      <!-- Configurações -->
      <li>
        <button onclick="openFormSettings(<?= $formId ?>)"
           class="w-full flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700/50 hover:text-gray-900 dark:hover:text-zinc-100 border-l-4 border-transparent">
          <i data-feather="settings" class="w-5 h-5 flex-shrink-0"></i>
          <span class="ml-3">Configurações</span>
        </button>
      </li>

      <!-- Personalização -->
      <li>
        <button onclick="openCustomization(<?= $formId ?>)"
           class="w-full flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700/50 hover:text-gray-900 dark:hover:text-zinc-100 border-l-4 border-transparent">
          <i data-feather="sliders" class="w-5 h-5 flex-shrink-0"></i>
          <span class="ml-3">Personalização</span>
        </button>
      </li>

      <!-- Opções de envio -->
      <li>
        <button onclick="openSendOptions(<?= $formId ?>)"
           class="w-full flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700/50 hover:text-gray-900 dark:hover:text-zinc-100 border-l-4 border-transparent">
          <i data-feather="send" class="w-5 h-5 flex-shrink-0"></i>
          <span class="ml-3">Opções de envio</span>
        </button>
      </li>

      <!-- Integrações -->
      <li>
        <button onclick="openIntegrations(<?= $formId ?>)"
           class="w-full flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700/50 hover:text-gray-900 dark:hover:text-zinc-100 border-l-4 border-transparent">
          <i data-feather="link" class="w-5 h-5 flex-shrink-0"></i>
          <span class="ml-3">Integrações</span>
        </button>
      </li>

      <!-- Divisor -->
      <li class="border-t border-gray-200 dark:border-zinc-700 my-3"></li>

      <!-- Excluir Formulário -->
      <li>
        <button onclick="deleteForm(<?= $formId ?>)"
           class="w-full flex items-center justify-center px-3 py-2.5 rounded-lg transition-all duration-200 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 hover:bg-red-100 dark:hover:bg-red-900/30">
          <i data-feather="trash-2" class="w-5 h-5 mr-2"></i> Excluir Formulário
        </button>
      </li>

    </ul>
  </nav>

  <!-- User Profile Section (BOTTOM FIXO) -->
  <div class="p-4 border-t border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
    <div class="flex items-center space-x-3">
      <div class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold bg-green-600 flex-shrink-0">
        <?= strtoupper(substr($_SESSION["user_name"] ?? 'U', 0, 1)) ?>
      </div>
      <div class="min-w-0 flex-1">
        <p class="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
          <?= htmlspecialchars($_SESSION["user_name"] ?? 'Usuário') ?>
        </p>
        <p class="text-xs text-gray-500 dark:text-gray-400"><?= $roleLabel ?></p>
      </div>
      <a href="/auth/logout.php"
         class="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex-shrink-0"
         title="Sair">
        <i data-feather="log-out" class="w-4 h-4 text-red-500"></i>
      </a>
    </div>
  </div>
</aside>

<style>
/* Scrollbar customizado */
.scrollbar-thin::-webkit-scrollbar {
  width: 6px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background: #cbd5e0;
  border-radius: 3px;
}

.dark .scrollbar-thin::-webkit-scrollbar-thumb {
  background: #52525b;
}

.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background: #a0aec0;
}

.dark .scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background: #71717a;
}
</style>

<script>
// Abrir sidebar (mobile)
function openSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    sidebar.classList.remove('-translate-x-full');
    overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

// Fechar sidebar (mobile)
function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    sidebar.classList.add('-translate-x-full');
    overlay.classList.add('hidden');
    document.body.style.overflow = '';
}

// Fechar sidebar ao clicar em links (mobile)
document.addEventListener('DOMContentLoaded', function() {
    const sidebarLinks = document.querySelectorAll('#sidebar a');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth < 1024) {
                closeSidebar();
            }
        });
    });
});
</script>
