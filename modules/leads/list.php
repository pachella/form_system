<?php
// Buscar dados do banco
require_once("../core/db.php");
require_once("../core/PermissionManager.php");

// Criar instância do PermissionManager
$permissionManager = new PermissionManager(
    $_SESSION['user_role'],
    $_SESSION['user_id'] ?? null
);

// Parâmetros de filtro e paginação
$currentPage = isset($_GET['p']) ? max(1, intval($_GET['p'])) : 1;
$perPage = 20;
$offset = ($currentPage - 1) * $perPage;

$filterForm = $_GET['form_id'] ?? '';
$filterSearch = $_GET['search'] ?? '';
$filterDateFrom = $_GET['date_from'] ?? '';
$filterDateTo = $_GET['date_to'] ?? '';

try {
    // Filtro SQL baseado no role
    $sqlFilter = $permissionManager->getSQLFilter('forms');

    // Buscar estatísticas
    $stats = [
        'total' => 0,
        'today' => 0,
        'week' => 0
    ];

    $statsSql = "SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN DATE(fr.created_at) = CURDATE() THEN 1 END) as today,
        COUNT(CASE WHEN DATE(fr.created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 1 END) as week
        FROM form_responses fr
        INNER JOIN forms f ON fr.form_id = f.id
        " . str_replace('WHERE', 'WHERE 1=1 AND', $sqlFilter);

    $stats = $pdo->query($statsSql)->fetch(PDO::FETCH_ASSOC);

    // Buscar formulários para o filtro
    $formsSql = "SELECT id, title FROM forms " . $sqlFilter . " ORDER BY title ASC";
    $forms = $pdo->query($formsSql)->fetchAll(PDO::FETCH_ASSOC);

    // Construir query para leads
    $sql = "SELECT fr.*, f.title as form_title,
                   (SELECT ra.answer
                    FROM response_answers ra
                    INNER JOIN form_fields ff ON ra.field_id = ff.id
                    WHERE ra.response_id = fr.id
                    ORDER BY ff.order_index ASC
                    LIMIT 1) as first_answer
            FROM form_responses fr
            INNER JOIN forms f ON fr.form_id = f.id";

    // Se houver busca, fazer JOIN
    if (!empty($filterSearch)) {
        $sql .= " LEFT JOIN response_answers ra_search ON ra_search.response_id = fr.id";
    }

    $sql .= " " . str_replace('WHERE', 'WHERE 1=1 AND', $sqlFilter);

    $params = [];

    // Filtro por formulário
    if (!empty($filterForm)) {
        $sql .= " AND fr.form_id = :form_id";
        $params[':form_id'] = $filterForm;
    }

    // Filtro por busca
    if (!empty($filterSearch)) {
        $sql .= " AND ra_search.answer LIKE :search";
        $params[':search'] = '%' . $filterSearch . '%';
    }

    // Filtro por data
    if (!empty($filterDateFrom)) {
        $sql .= " AND DATE(fr.created_at) >= :date_from";
        $params[':date_from'] = $filterDateFrom;
    }
    if (!empty($filterDateTo)) {
        $sql .= " AND DATE(fr.created_at) <= :date_to";
        $params[':date_to'] = $filterDateTo;
    }

    // Se houver busca, agrupar
    if (!empty($filterSearch)) {
        $sql .= " GROUP BY fr.id";
    }

    // Contar total de registros
    $countSql = str_replace("SELECT fr.*, f.title as form_title", "SELECT COUNT(DISTINCT fr.id) as total", $sql);
    $countSql = preg_replace('/,\s*\(SELECT.*?\) as first_answer/', '', $countSql);

    $countStmt = $pdo->prepare($countSql);
    $countStmt->execute($params);
    $totalRecords = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];
    $totalPages = ceil($totalRecords / $perPage);

    // Buscar registros paginados
    $sql .= " ORDER BY fr.created_at DESC LIMIT :limit OFFSET :offset";
    $stmt = $pdo->prepare($sql);
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $leads = $stmt->fetchAll(PDO::FETCH_ASSOC);

} catch (PDOException $e) {
    $stats = ['total' => 0, 'today' => 0, 'week' => 0];
    $forms = [];
    $leads = [];
    $totalRecords = 0;
    $totalPages = 0;
}

// Função helper para construir URL de paginação
function buildPaginationUrl($page) {
    $params = $_GET;
    $params['p'] = $page;
    $params['page'] = 'leads/list';
    return '?' . http_build_query($params);
}
?>

<style>
    .stat-card {
        transition: transform 0.2s;
    }
    .stat-card:hover {
        transform: translateY(-2px);
    }
</style>

<div class="w-full max-w-full overflow-x-hidden">
    <!-- Cabeçalho -->
    <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-2">
        <div>
            <h1 class="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
                <i data-feather="users" class="w-6 h-6 inline text-green-600"></i> Meus Leads
            </h1>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Gerencie todos os leads capturados pelos seus formulários
            </p>
        </div>
        <a href="/modules/leads/export.php?<?= http_build_query(array_diff_key($_GET, ['page' => ''])) ?>"
           class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
            <i data-feather="download" class="w-4 h-4"></i> Exportar CSV
        </a>
    </div>

    <!-- Cards de estatísticas -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div class="stat-card bg-white dark:bg-zinc-800 shadow rounded-lg p-4 border-l-4 border-blue-500">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total de Leads</p>
                    <p class="text-3xl font-bold text-gray-900 dark:text-gray-100"><?= number_format($stats['total']) ?></p>
                </div>
                <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <i data-feather="users" class="w-6 h-6 text-blue-600 dark:text-blue-300"></i>
                </div>
            </div>
        </div>

        <div class="stat-card bg-white dark:bg-zinc-800 shadow rounded-lg p-4 border-l-4 border-green-500">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Novos Hoje</p>
                    <p class="text-3xl font-bold text-gray-900 dark:text-gray-100"><?= number_format($stats['today']) ?></p>
                </div>
                <div class="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <i data-feather="user-plus" class="w-6 h-6 text-green-600 dark:text-green-300"></i>
                </div>
            </div>
        </div>

        <div class="stat-card bg-white dark:bg-zinc-800 shadow rounded-lg p-4 border-l-4 border-purple-500">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Últimos 7 Dias</p>
                    <p class="text-3xl font-bold text-gray-900 dark:text-gray-100"><?= number_format($stats['week']) ?></p>
                </div>
                <div class="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                    <i data-feather="trending-up" class="w-6 h-6 text-purple-600 dark:text-purple-300"></i>
                </div>
            </div>
        </div>
    </div>

    <!-- Filtros -->
    <div class="bg-white dark:bg-zinc-800 shadow rounded-lg p-4 mb-6">
        <form method="GET" action="/index.php" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <input type="hidden" name="page" value="leads/list">
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Formulário</label>
                <select name="form_id" class="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg dark:bg-zinc-700 dark:text-white text-sm">
                    <option value="">Todos os formulários</option>
                    <?php foreach ($forms as $form): ?>
                        <option value="<?= $form['id'] ?>" <?= $filterForm == $form['id'] ? 'selected' : '' ?>>
                            <?= htmlspecialchars($form['title']) ?>
                        </option>
                    <?php endforeach; ?>
                </select>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Buscar</label>
                <input type="text" name="search" value="<?= htmlspecialchars($filterSearch) ?>"
                       placeholder="Nome, email..."
                       class="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg dark:bg-zinc-700 dark:text-white text-sm">
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data Início</label>
                <input type="date" name="date_from" value="<?= htmlspecialchars($filterDateFrom) ?>"
                       class="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg dark:bg-zinc-700 dark:text-white text-sm">
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data Fim</label>
                <input type="date" name="date_to" value="<?= htmlspecialchars($filterDateTo) ?>"
                       class="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg dark:bg-zinc-700 dark:text-white text-sm">
            </div>

            <div class="sm:col-span-2 lg:col-span-4 flex gap-2">
                <button type="submit" class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors text-sm">
                    <i data-feather="filter" class="w-4 h-4 inline mr-1"></i> Filtrar
                </button>
                <a href="?page=leads/list" class="bg-gray-200 dark:bg-zinc-700 hover:bg-gray-300 dark:hover:bg-zinc-600 text-gray-700 dark:text-gray-300 px-6 py-2 rounded-lg transition-colors text-sm">
                    <i data-feather="x" class="w-4 h-4 inline mr-1"></i> Limpar
                </a>
            </div>
        </form>
    </div>

    <!-- Tabela de Leads -->
    <div class="bg-white dark:bg-zinc-800 shadow rounded-lg p-4">
        <h3 class="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
            <i data-feather="list" class="w-5 h-5 mr-2"></i>
            Todos os Leads
        </h3>
        <div class="overflow-x-auto">
            <table class="w-full min-w-full">
                <thead class="border-b border-gray-200 dark:border-zinc-700">
                    <tr>
                        <th class="text-left py-2 px-2 text-sm font-medium text-gray-500 dark:text-gray-400">ID</th>
                        <th class="text-left py-2 px-2 text-sm font-medium text-gray-500 dark:text-gray-400">Formulário</th>
                        <th class="text-left py-2 px-2 text-sm font-medium text-gray-500 dark:text-gray-400 hidden md:table-cell">Preview</th>
                        <th class="text-left py-2 px-2 text-sm font-medium text-gray-500 dark:text-gray-400 hidden sm:table-cell">Data</th>
                        <th class="text-center py-2 px-2 text-sm font-medium text-gray-500 dark:text-gray-400 hidden lg:table-cell">Pontuação</th>
                        <th class="text-right py-2 px-2 text-sm font-medium text-gray-500 dark:text-gray-400">Ações</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 dark:divide-zinc-700">
                    <?php if ($leads): ?>
                        <?php foreach ($leads as $lead):
                            $firstAnswer = $lead['first_answer'] ?? 'Sem resposta';
                            if (is_string($firstAnswer) && (substr($firstAnswer, 0, 1) === '[' || substr($firstAnswer, 0, 1) === '{')) {
                                $decoded = json_decode($firstAnswer, true);
                                if (is_array($decoded)) {
                                    $firstAnswer = implode(', ', $decoded);
                                }
                            }
                            if (strlen($firstAnswer) > 50) {
                                $firstAnswer = substr($firstAnswer, 0, 50) . '...';
                            }
                        ?>
                            <tr class="hover:bg-gray-50 dark:hover:bg-zinc-700">
                                <td class="py-3 px-2 text-sm">
                                    <span class="font-medium text-gray-900 dark:text-gray-100">#<?= $lead['id'] ?></span>
                                </td>
                                <td class="py-3 px-2 text-sm">
                                    <div class="font-medium text-gray-900 dark:text-gray-100">
                                        <?= htmlspecialchars($lead['form_title']) ?>
                                    </div>
                                </td>
                                <td class="py-3 px-2 text-sm text-gray-600 dark:text-gray-400 hidden md:table-cell">
                                    <?= htmlspecialchars($firstAnswer) ?>
                                </td>
                                <td class="py-3 px-2 text-sm text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                                    <?= date('d/m/Y H:i', strtotime($lead['created_at'])) ?>
                                </td>
                                <td class="py-3 px-2 text-sm text-center hidden lg:table-cell">
                                    <?php if ($lead['score']): ?>
                                        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                                            <i data-feather="star" class="w-3 h-3 mr-1"></i> <?= $lead['score'] ?>
                                        </span>
                                    <?php else: ?>
                                        <span class="text-gray-400">-</span>
                                    <?php endif; ?>
                                </td>
                                <td class="py-3 px-2 text-sm text-right">
                                    <div class="flex justify-end gap-2">
                                        <a href="/modules/leads/view.php?id=<?= $lead['id'] ?>"
                                           class="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                                           title="Ver detalhes">
                                            <i data-feather="eye" class="w-4 h-4 inline"></i>
                                        </a>
                                        <a href="/forms/<?= $lead['form_id'] ?>/responses/<?= $lead['id'] ?>"
                                           class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                                           title="Ver resposta completa">
                                            <i data-feather="file-text" class="w-4 h-4 inline"></i>
                                        </a>
                                    </div>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    <?php else: ?>
                        <tr>
                            <td colspan="6" class="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                                <i data-feather="inbox" class="w-12 h-12 mx-auto mb-2 text-gray-400 dark:text-gray-600"></i>
                                <p>Nenhum lead encontrado</p>
                            </td>
                        </tr>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>

        <!-- Paginação -->
        <?php if ($totalPages > 1): ?>
            <div class="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-zinc-700">
                <div class="text-sm text-gray-600 dark:text-gray-400">
                    Mostrando <?= min($offset + 1, $totalRecords) ?> a <?= min($offset + $perPage, $totalRecords) ?> de <?= $totalRecords ?> leads
                </div>
                <div class="flex gap-2">
                    <?php if ($currentPage > 1): ?>
                        <a href="<?= buildPaginationUrl($currentPage - 1) ?>"
                           class="px-3 py-1 bg-white dark:bg-zinc-700 border border-gray-300 dark:border-zinc-600 rounded hover:bg-gray-50 dark:hover:bg-zinc-600 text-sm">
                            <i data-feather="chevron-left" class="w-4 h-4 inline"></i>
                        </a>
                    <?php endif; ?>

                    <?php for ($i = max(1, $currentPage - 2); $i <= min($totalPages, $currentPage + 2); $i++): ?>
                        <a href="<?= buildPaginationUrl($i) ?>"
                           class="px-3 py-1 <?= $i === $currentPage ? 'bg-green-600 text-white' : 'bg-white dark:bg-zinc-700 text-gray-700 dark:text-gray-300' ?> border border-gray-300 dark:border-zinc-600 rounded hover:bg-gray-50 dark:hover:bg-zinc-600 text-sm">
                            <?= $i ?>
                        </a>
                    <?php endfor; ?>

                    <?php if ($currentPage < $totalPages): ?>
                        <a href="<?= buildPaginationUrl($currentPage + 1) ?>"
                           class="px-3 py-1 bg-white dark:bg-zinc-700 border border-gray-300 dark:border-zinc-600 rounded hover:bg-gray-50 dark:hover:bg-zinc-600 text-sm">
                            <i data-feather="chevron-right" class="w-4 h-4 inline"></i>
                        </a>
                    <?php endif; ?>
                </div>
            </div>
        <?php endif; ?>
    </div>
</div>
