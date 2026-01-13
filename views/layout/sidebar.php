<?php
// Incluir sistema de permissões
require_once __DIR__ . '/../../core/PermissionManager.php';
require_once __DIR__ . '/../../core/PlanService.php';

// Verificar se usuário está logado
if (!isset($_SESSION['user_role'])) {
    return;
}

// Verificar quantos formulários o usuário tem (para limite FREE)
$userFormsCount = 0;
if (isset($pdo) && isset($_SESSION['user_id'])) {
    try {
        $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM forms WHERE user_id = :user_id");
        $stmt->execute(['user_id' => $_SESSION['user_id']]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $userFormsCount = $result['total'] ?? 0;
    } catch (Exception $e) {
        error_log("Erro ao contar formulários: " . $e->getMessage());
    }
}

// Verificar se usuário atingiu limite FREE
$canCreateForm = true;
$limitMessage = '';
if (PlanService::isFree() && $userFormsCount >= 2) {
    $canCreateForm = false;
    $limitMessage = 'Usuários FREE podem ter apenas 2 formulários. Faça upgrade para PRO!';
}

// Criar instância do PermissionManager
$permissionManager = new PermissionManager(
    $_SESSION['user_role'],
    $_SESSION['user_id'] ?? null
);

$currentPage = $_GET['page'] ?? 'dashboard/home';

function isActive($page, $currentPage) {
    return strpos($currentPage, $page) === 0
        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-l-4 border-green-600'
        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700/50 hover:text-gray-900 dark:hover:text-zinc-100 border-l-4 border-transparent';
}

// Escanear módulos automaticamente
$modulesPath = __DIR__ . '/../../modules';
$moduleStructure = [];

if (is_dir($modulesPath)) {
    $modules = array_diff(scandir($modulesPath), ['.', '..']);

    foreach ($modules as $module) {
        $configFile = "$modulesPath/$module/config.php";

        if (file_exists($configFile)) {
            $config = require $configFile;

            // Verificar se o usuário tem permissão para acessar este módulo
            if (isset($config['roles']) && in_array($_SESSION['user_role'], $config['roles'])) {
                $moduleStructure[$config['order']] = $config;
            }
        }
    }

    // Ordenar por ordem
    ksort($moduleStructure);
}

// Definir label do perfil baseado no role
$roleLabel = 'Usuário';
if ($permissionManager->isAdmin()) {
    $roleLabel = 'Administrador';
} elseif ($permissionManager->isClient()) {
    $roleLabel = 'Cliente';
}
?>

<!-- Overlay (mobile) -->
<div id="sidebar-overlay" class="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden hidden" onclick="closeSidebar()"></div>

<!-- Sidebar SUPREMA -->
<aside id="sidebar"
       class="sidebar-expanded fixed inset-y-0 left-0 transform -translate-x-full lg:translate-x-0 bg-white dark:bg-zinc-800 shadow-xl transition-all duration-300 ease-in-out z-50 flex flex-col">

  <!-- Logo Section -->
  <div class="sidebar-header p-6 border-b border-gray-200 dark:border-zinc-700">
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <img src="/uploads/system/logo.png" alt="Logo" class="sidebar-logo h-8 dark:brightness-0 dark:invert">
        <span class="sidebar-text font-bold text-lg text-gray-800 dark:text-gray-100">FormTalk</span>
      </div>

      <!-- Botão de recolher (desktop only) -->
      <button id="sidebar-toggle"
              class="hidden lg:block p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
              title="Recolher menu">
        <i data-feather="chevrons-left" class="w-5 h-5 text-gray-600 dark:text-gray-400"></i>
      </button>
    </div>

    <!-- Botão Criar Formulário -->
    <div class="mt-4">
      <?php if ($canCreateForm): ?>
        <button id="btnNewFormSidebar" class="sidebar-btn-create w-full text-white px-4 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium bg-green-600 hover:bg-green-700 hover:shadow-lg flex items-center justify-center gap-2">
          <i data-feather="plus" class="w-4 h-4"></i>
          <span class="sidebar-text">Criar Formulário</span>
        </button>
      <?php else: ?>
        <button
          onclick="showUpgradeAlert()"
          class="sidebar-btn-create w-full text-white px-4 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 hover:shadow-lg flex items-center justify-center gap-2">
          <span class="sidebar-text">✨ Upgrade PRO</span>
        </button>
        <p class="sidebar-text text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
          Limite atingido
        </p>
      <?php endif; ?>
    </div>
  </div>

  <!-- Menu Navigation (com scroll) -->
  <nav class="flex-1 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-zinc-600">
    <ul class="space-y-1">
      <?php foreach ($moduleStructure as $config): ?>
        <li>
          <a href="<?= $config['url'] ?>"
             <?php if (isset($config['external']) && $config['external']): ?>
               target="_blank" rel="noopener noreferrer"
             <?php endif; ?>
             class="sidebar-link flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 <?= isActive($config['name'], $currentPage) ?>"
             title="<?= htmlspecialchars($config['label']) ?>">
            <i data-feather="<?= $config['icon'] ?>" class="sidebar-icon w-5 h-5 flex-shrink-0"></i>
            <span class="sidebar-text ml-3"><?= htmlspecialchars($config['label']) ?></span>
            <?php if (isset($config['badge'])): ?>
              <span class="sidebar-text ml-auto px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                <?= $config['badge'] ?>
              </span>
            <?php endif; ?>
            <?php if (isset($config['external']) && $config['external']): ?>
              <i data-feather="external-link" class="sidebar-text w-3.5 h-3.5 ml-auto opacity-50"></i>
            <?php endif; ?>
          </a>
        </li>
      <?php endforeach; ?>
    </ul>
  </nav>

  <!-- User Profile Section (BOTTOM FIXO) -->
  <div class="sidebar-user p-4 border-t border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
    <div class="flex items-center space-x-3">
      <div class="sidebar-avatar w-10 h-10 rounded-full flex items-center justify-center text-white font-bold bg-green-600 flex-shrink-0">
        <?= strtoupper(substr($_SESSION["user_name"] ?? 'U', 0, 1)) ?>
      </div>
      <div class="sidebar-text min-w-0 flex-1">
        <p class="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
          <?= htmlspecialchars($_SESSION["user_name"] ?? 'Usuário') ?>
        </p>
        <p class="text-xs text-gray-500 dark:text-gray-400"><?= $roleLabel ?></p>
      </div>
      <a href="/auth/logout.php"
         class="sidebar-text p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex-shrink-0"
         title="Sair">
        <i data-feather="log-out" class="w-4 h-4 text-red-500"></i>
      </a>
    </div>
  </div>
</aside>

<style>
/* Sidebar expandida (default) */
.sidebar-expanded {
  width: 280px;
}

/* Sidebar recolhida */
.sidebar-collapsed {
  width: 70px;
}

/* Esconder texto quando recolhida */
.sidebar-collapsed .sidebar-text {
  display: none;
}

/* Centralizar ícones quando recolhida */
.sidebar-collapsed .sidebar-link {
  justify-content: center;
  padding-left: 0;
  padding-right: 0;
}

.sidebar-collapsed .sidebar-icon {
  margin-left: 0;
  margin-right: 0;
}

/* Esconder logo text quando recolhida */
.sidebar-collapsed .sidebar-logo {
  margin: 0 auto;
}

/* Avatar centralizado quando recolhida */
.sidebar-collapsed .sidebar-avatar {
  margin: 0 auto;
}

/* Botão de criar centralizado quando recolhido */
.sidebar-collapsed .sidebar-btn-create {
  padding-left: 0.5rem;
  padding-right: 0.5rem;
}

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
// Estado da sidebar
let sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';

// Aplicar estado salvo ao carregar
document.addEventListener('DOMContentLoaded', function() {
  const sidebar = document.getElementById('sidebar');
  const toggleBtn = document.getElementById('sidebar-toggle');
  const toggleIcon = toggleBtn?.querySelector('i');

  // Aplicar estado inicial
  if (sidebarCollapsed) {
    sidebar.classList.remove('sidebar-expanded');
    sidebar.classList.add('sidebar-collapsed');
    if (toggleIcon) toggleIcon.setAttribute('data-feather', 'chevrons-right');
  }

  // Atualizar ícones feather
  if (typeof feather !== 'undefined') {
    feather.replace();
  }

  // Toggle sidebar (desktop)
  if (toggleBtn) {
    toggleBtn.addEventListener('click', function() {
      sidebarCollapsed = !sidebarCollapsed;

      if (sidebarCollapsed) {
        sidebar.classList.remove('sidebar-expanded');
        sidebar.classList.add('sidebar-collapsed');
        toggleIcon.setAttribute('data-feather', 'chevrons-right');
      } else {
        sidebar.classList.remove('sidebar-collapsed');
        sidebar.classList.add('sidebar-expanded');
        toggleIcon.setAttribute('data-feather', 'chevrons-left');
      }

      // Salvar estado
      localStorage.setItem('sidebarCollapsed', sidebarCollapsed);

      // Atualizar ícones
      if (typeof feather !== 'undefined') {
        feather.replace();
      }

      // Disparar evento personalizado para main content ajustar
      window.dispatchEvent(new CustomEvent('sidebar-toggle', {
        detail: { collapsed: sidebarCollapsed }
      }));
    });
  }

  // Botão criar formulário
  const btnNewFormSidebar = document.getElementById('btnNewFormSidebar');
  if (btnNewFormSidebar) {
    btnNewFormSidebar.addEventListener('click', () => {
      if (typeof showFormModal === 'function') {
        showFormModal();
      } else {
        console.error("Função showFormModal não encontrada.");
      }
    });
  }

  // Fechar sidebar ao clicar em links internos (mobile)
  const sidebarLinks = document.querySelectorAll('#sidebar a:not([target="_blank"])');
  sidebarLinks.forEach(link => {
    link.addEventListener('click', function() {
      if (window.innerWidth < 1024) {
        closeSidebar();
      }
    });
  });
});

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

// Mostrar alerta de upgrade
function showUpgradeAlert() {
  Swal.fire({
    title: '✨ Upgrade para PRO',
    html: '<?= $limitMessage ?><br><br>Com o plano PRO você terá:<br>• <strong>Formulários ilimitados</strong><br>• Suporte prioritário<br>• Recursos avançados',
    icon: 'info',
    confirmButtonText: 'Fazer Upgrade',
    cancelButtonText: 'Agora não',
    showCancelButton: true,
    confirmButtonColor: '#a855f7',
    cancelButtonColor: '#6b7280'
  }).then((result) => {
    if (result.isConfirmed) {
      window.location.href = '/upgrade';
    }
  });
}
</script>
