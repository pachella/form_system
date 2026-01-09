<?php
// Este arquivo é carregado via dashboard.php, então session e db já estão disponíveis
require_once(__DIR__ . "/../../core/db.php");

// Verificar se está logado
if (!isset($_SESSION["user_id"])) {
    echo '<div class="p-6"><div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">Acesso negado</div></div>';
    return;
}

// Usar o permissionManager global ou criar novo
$permissionManager = $GLOBALS['permissionManager'] ?? new PermissionManager($_SESSION['user_role'], $_SESSION['client_id'] ?? null);

// Parâmetros de filtro e paginação
$currentPage = isset($_GET['p']) ? max(1, intval($_GET['p'])) : 1;
$perPage = 20;
$offset = ($currentPage - 1) * $perPage;

$filterForm = $_GET['form_id'] ?? '';
$filterSearch = $_GET['search'] ?? '';
$filterDateFrom = $_GET['date_from'] ?? '';
$filterDateTo = $_GET['date_to'] ?? '';

// Construir query base
$sql = "SELECT fr.*, f.title as form_title, f.user_id as form_user_id
        FROM form_responses fr
        INNER JOIN forms f ON fr.form_id = f.id
        WHERE 1=1";

$params = [];

// Filtro de permissão
if (!$permissionManager->canViewAllRecords()) {
    $sql .= " AND f.user_id = :user_id";
    $params[':user_id'] = $_SESSION['user_id'];
}

// Filtro por formulário
if (!empty($filterForm)) {
    $sql .= " AND fr.form_id = :form_id";
    $params[':form_id'] = $filterForm;
}

// Filtro por busca (nome/email)
if (!empty($filterSearch)) {
    $sql .= " AND (fr.answers LIKE :search)";
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

// Contar total de registros
$countSql = "SELECT COUNT(*) as total FROM ($sql) as filtered";
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

// Buscar estatísticas
$statsSql = "SELECT
    COUNT(*) as total,
    COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as today,
    COUNT(CASE WHEN DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 1 END) as week
    FROM form_responses fr
    INNER JOIN forms f ON fr.form_id = f.id";

if (!$permissionManager->canViewAllRecords()) {
    $statsSql .= " WHERE f.user_id = :user_id";
}

$statsStmt = $pdo->prepare($statsSql);
if (!$permissionManager->canViewAllRecords()) {
    $statsStmt->bindValue(':user_id', $_SESSION['user_id']);
}
$statsStmt->execute();
$stats = $statsStmt->fetch(PDO::FETCH_ASSOC);

// Buscar formulários para o filtro
$formsSql = "SELECT id, title FROM forms WHERE 1=1";
if (!$permissionManager->canViewAllRecords()) {
    $formsSql .= " AND user_id = :user_id";
}
$formsSql .= " ORDER BY title ASC";

$formsStmt = $pdo->prepare($formsSql);
if (!$permissionManager->canViewAllRecords()) {
    $formsStmt->bindValue(':user_id', $_SESSION['user_id']);
}
$formsStmt->execute();
$forms = $formsStmt->fetchAll(PDO::FETCH_ASSOC);
?>

<style>
    .stat-card {
        transition: transform 0.2s;
    }
    .stat-card:hover {
        transform: translateY(-2px);
    }
</style>

<div class="container mx-auto px-4 py-6">
    <!-- Cabeçalho -->
    <div class="flex items-center justify-between mb-6">
        <div>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
                <i class="fas fa-users text-[#4EA44B]"></i> Meus Leads
            </h1>
            <p class="text-gray-600 dark:text-gray-400 mt-1">Gerencie todos os leads capturados pelos seus formulários</p>
        </div>
        <a href="/modules/leads/export.php?<?= http_build_query(array_diff_key($_GET, ['page' => ''])) ?>"
           class="bg-[#4EA44B] hover:bg-[#5dcf91] text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
            <i class="fas fa-download"></i> Exportar CSV
        </a>
    </div>

    <!-- Cards de Estatísticas -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div class="stat-card bg-white dark:bg-zinc-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-zinc-700">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Leads</p>
                    <p class="text-3xl font-bold text-gray-900 dark:text-white mt-2"><?= number_format($stats['total']) ?></p>
                </div>
                <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                    <i class="fas fa-users text-2xl text-blue-600 dark:text-blue-400"></i>
                </div>
            </div>
        </div>

        <div class="stat-card bg-white dark:bg-zinc-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-zinc-700">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Novos Hoje</p>
                    <p class="text-3xl font-bold text-gray-900 dark:text-white mt-2"><?= number_format($stats['today']) ?></p>
                </div>
                <div class="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                    <i class="fas fa-user-plus text-2xl text-green-600 dark:text-green-400"></i>
                </div>
            </div>
        </div>

        <div class="stat-card bg-white dark:bg-zinc-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-zinc-700">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Últimos 7 Dias</p>
                    <p class="text-3xl font-bold text-gray-900 dark:text-white mt-2"><?= number_format($stats['week']) ?></p>
                </div>
                <div class="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                    <i class="fas fa-chart-line text-2xl text-purple-600 dark:text-purple-400"></i>
                </div>
            </div>
        </div>
    </div>

    <!-- Filtros -->
    <div class="bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700 p-4 mb-6">
        <form method="GET" class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input type="hidden" name="page" value="leads/list">
            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Formulário</label>
                <select name="form_id" class="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg dark:bg-zinc-700 dark:text-white">
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
                       class="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg dark:bg-zinc-700 dark:text-white">
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data Início</label>
                <input type="date" name="date_from" value="<?= htmlspecialchars($filterDateFrom) ?>"
                       class="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg dark:bg-zinc-700 dark:text-white">
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data Fim</label>
                <input type="date" name="date_to" value="<?= htmlspecialchars($filterDateTo) ?>"
                       class="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg dark:bg-zinc-700 dark:text-white">
            </div>

            <div class="md:col-span-4 flex gap-2">
                <button type="submit" class="bg-[#4EA44B] hover:bg-[#5dcf91] text-white px-6 py-2 rounded-lg transition-colors">
                    <i class="fas fa-filter mr-2"></i> Filtrar
                </button>
                <a href="/leads/list" class="bg-gray-200 dark:bg-zinc-700 hover:bg-gray-300 dark:hover:bg-zinc-600 text-gray-700 dark:text-gray-300 px-6 py-2 rounded-lg transition-colors">
                    <i class="fas fa-times mr-2"></i> Limpar
                </a>
            </div>
        </form>
    </div>

    <!-- Tabela de Leads -->
    <div class="bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700 overflow-hidden">
        <div class="overflow-x-auto">
            <table class="w-full">
                <thead class="bg-gray-50 dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-700">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Formulário</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Preview</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pontuação</th>
                        <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ações</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 dark:divide-zinc-700">
                    <?php if (empty($leads)): ?>
                        <tr>
                            <td colspan="6" class="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                <i class="fas fa-inbox text-4xl mb-3 opacity-50"></i>
                                <p>Nenhum lead encontrado</p>
                            </td>
                        </tr>
                    <?php else: ?>
                        <?php foreach ($leads as $lead):
                            $answers = json_decode($lead['answers'] ?? '{}', true);
                            $firstAnswer = !empty($answers) ? array_values($answers)[0] : 'Sem resposta';
                            if (is_array($firstAnswer)) {
                                $firstAnswer = implode(', ', $firstAnswer);
                            }
                            $firstAnswer = substr($firstAnswer, 0, 50) . (strlen($firstAnswer) > 50 ? '...' : '');
                        ?>
                            <tr class="hover:bg-gray-50 dark:hover:bg-zinc-700/50 transition-colors">
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <span class="text-sm font-medium text-gray-900 dark:text-white">#<?= $lead['id'] ?></span>
                                </td>
                                <td class="px-6 py-4">
                                    <div class="text-sm font-medium text-gray-900 dark:text-white"><?= htmlspecialchars($lead['form_title']) ?></div>
                                </td>
                                <td class="px-6 py-4">
                                    <div class="text-sm text-gray-600 dark:text-gray-400"><?= htmlspecialchars($firstAnswer) ?></div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="text-sm text-gray-600 dark:text-gray-400">
                                        <?= date('d/m/Y H:i', strtotime($lead['created_at'])) ?>
                                    </div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <?php if ($lead['score']): ?>
                                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                                            <i class="fas fa-star text-xs mr-1"></i> <?= $lead['score'] ?>
                                        </span>
                                    <?php else: ?>
                                        <span class="text-sm text-gray-400">-</span>
                                    <?php endif; ?>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <a href="/modules/leads/view.php?id=<?= $lead['id'] ?>"
                                       class="text-[#4EA44B] hover:text-[#5dcf91] mr-3" title="Ver detalhes">
                                        <i class="fas fa-eye"></i>
                                    </a>
                                    <a href="/forms/<?= $lead['form_id'] ?>/responses/<?= $lead['id'] ?>"
                                       class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300" title="Ver resposta completa">
                                        <i class="fas fa-file-alt"></i>
                                    </a>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>

        <!-- Paginação -->
        <?php if ($totalPages > 1): ?>
            <div class="bg-gray-50 dark:bg-zinc-900 px-6 py-4 border-t border-gray-200 dark:border-zinc-700">
                <div class="flex items-center justify-between">
                    <div class="text-sm text-gray-600 dark:text-gray-400">
                        Mostrando <?= min($offset + 1, $totalRecords) ?> a <?= min($offset + $perPage, $totalRecords) ?> de <?= $totalRecords ?> leads
                    </div>
                    <div class="flex gap-2">
                        <?php if ($currentPage > 1): ?>
                            <a href="?page=leads/list&p=<?= $currentPage - 1 ?>&<?= http_build_query(array_diff_key($_GET, ['page' => '', 'p' => ''])) ?>"
                               class="px-4 py-2 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-600 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors">
                                <i class="fas fa-chevron-left"></i>
                            </a>
                        <?php endif; ?>

                        <?php for ($i = max(1, $currentPage - 2); $i <= min($totalPages, $currentPage + 2); $i++): ?>
                            <a href="?page=leads/list&p=<?= $i ?>&<?= http_build_query(array_diff_key($_GET, ['page' => '', 'p' => ''])) ?>"
                               class="px-4 py-2 <?= $i === $currentPage ? 'bg-[#4EA44B] text-white' : 'bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-300' ?> border border-gray-300 dark:border-zinc-600 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors">
                                <?= $i ?>
                            </a>
                        <?php endfor; ?>

                        <?php if ($currentPage < $totalPages): ?>
                            <a href="?page=leads/list&p=<?= $currentPage + 1 ?>&<?= http_build_query(array_diff_key($_GET, ['page' => '', 'p' => ''])) ?>"
                               class="px-4 py-2 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-600 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors">
                                <i class="fas fa-chevron-right"></i>
                            </a>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
        <?php endif; ?>
    </div>
</div>
