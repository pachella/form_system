<?php
session_start();
require_once(__DIR__ . "/../../../core/db.php");
require_once(__DIR__ . "/../../../core/config.php");
require_once __DIR__ . '/../../../core/PermissionManager.php';
require_once __DIR__ . '/../../../core/PlanService.php';

if (!isset($_SESSION["user_id"])) {
    header("Location: /auth/login");
    exit;
}

$formId = $_GET['id'] ?? null;

if (!$formId) {
    header("Location: /modules/forms/list.php");
    exit;
}

$permissionManager = new PermissionManager($_SESSION['user_role'], $_SESSION['user_id'] ?? null);

// Buscar dados do formulário
$sql = "SELECT * FROM forms WHERE id = :id";
if (!$permissionManager->canViewAllRecords()) {
    $sql .= " AND user_id = :user_id";
}

$stmt = $pdo->prepare($sql);
$stmt->bindValue(':id', $formId, PDO::PARAM_INT);
if (!$permissionManager->canViewAllRecords()) {
    $stmt->bindValue(':user_id', $_SESSION['user_id'], PDO::PARAM_INT);
}

$stmt->execute();
$form = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$form) {
    header("Location: /modules/forms/list.php");
    exit;
}

// Buscar respostas parciais (não completadas)
$partialResponsesStmt = $pdo->prepare("
    SELECT pr.*
    FROM partial_responses pr
    WHERE pr.form_id = :form_id AND pr.completed = 0
    ORDER BY pr.last_updated DESC
");
$partialResponsesStmt->execute([':form_id' => $formId]);
$partialResponses = $partialResponsesStmt->fetchAll(PDO::FETCH_ASSOC);

// Buscar total de campos para calcular % de preenchimento (excluindo campos informativos)
$fieldsStmt = $pdo->prepare("SELECT COUNT(*) as total FROM form_fields WHERE form_id = :form_id AND type NOT IN ('welcome', 'message')");
$fieldsStmt->execute([':form_id' => $formId]);
$totalFields = $fieldsStmt->fetch(PDO::FETCH_ASSOC)['total'];

// Total de respostas parciais
$totalPartialResponses = count($partialResponses);

// Incluir o layout
require_once __DIR__ . '/../../../views/layout/header.php';
require_once __DIR__ . '/../builder/builder_sidebar.php';
?>

<!-- Font Awesome -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

<!-- SweetAlert2 -->
<link href="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>

<style>
    .dark .swal2-popup { background: #27272a !important; color: #e4e4e7 !important; }
    .dark .swal2-title { color: #e4e4e7 !important; }
    .dark .swal2-html-container { color: #d4d4d8 !important; }

    /* PRO Feature Restriction */
    .pro-blur {
        filter: blur(8px);
        pointer-events: none;
        user-select: none;
    }

    .pro-overlay-container {
        position: relative;
    }

    .pro-overlay {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 10;
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        color: white;
        padding: 2rem 3rem;
        border-radius: 1rem;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
        text-align: center;
    }

    .pro-overlay i {
        font-size: 3rem;
        margin-bottom: 1rem;
    }

    .pro-overlay h3 {
        font-size: 1.5rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
        color: white !important;
    }

    .pro-overlay p {
        margin-bottom: 1.5rem;
        opacity: 0.9;
        color: white !important;
    }

    .pro-overlay .upgrade-btn {
        display: inline-block;
        background: white;
        color: #6366f1;
        padding: 0.75rem 2rem;
        border-radius: 0.5rem;
        font-weight: 600;
        text-decoration: none;
        transition: transform 0.2s;
    }

    .pro-overlay .upgrade-btn:hover {
        transform: scale(1.05);
    }
</style>

<div class="max-w-7xl mx-auto">
    <!-- Header -->
    <div class="mb-6">
        <a href="/forms/<?= $formId ?>/responses" class="text-sm text-indigo-600 dark:text-indigo-400 hover:underline mb-2 inline-block">
            <i class="fas fa-arrow-left mr-1"></i> Voltar para respostas completas
        </a>
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-bold text-gray-900 dark:text-zinc-100">
                    <i class="fas fa-hourglass-half mr-2 text-yellow-600"></i>
                    Respostas Parciais
                </h1>
                <p class="text-sm text-gray-600 dark:text-zinc-400 mt-1">
                    Formulários iniciados mas não concluídos
                </p>
            </div>
            <?php if (PlanService::hasProAccess()): ?>
            <div class="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-lg">
                <i class="fas fa-crown text-yellow-500"></i>
                <span class="text-sm font-medium text-green-700 dark:text-green-300">Recurso PRO Ativo</span>
            </div>
            <?php endif; ?>
        </div>
    </div>

    <!-- Container com gate PRO -->
    <div class="<?= !PlanService::hasProAccess() ? 'pro-overlay-container' : '' ?>">
        <?php if (!PlanService::hasProAccess()): ?>
        <!-- Overlay PRO -->
        <div class="pro-overlay">
            <i class="fas fa-crown"></i>
            <h3>Recurso PRO</h3>
            <p>Acesse respostas parciais e recupere leads que abandonaram seu formulário</p>
            <a href="/pricing" class="upgrade-btn">
                <i class="fas fa-arrow-up mr-2"></i>
                Fazer Upgrade
            </a>
        </div>
        <?php endif; ?>

        <!-- Tabela de respostas parciais -->
        <div class="bg-white dark:bg-zinc-800 rounded-lg shadow overflow-hidden <?= !PlanService::hasProAccess() ? 'pro-blur' : '' ?>">
            <?php if (empty($partialResponses)): ?>
                <!-- Estado vazio -->
                <div class="p-12 text-center">
                    <i class="fas fa-inbox text-6xl text-gray-300 dark:text-zinc-600 mb-4"></i>
                    <h2 class="text-xl font-semibold text-gray-900 dark:text-zinc-100 mb-2">Nenhuma resposta parcial</h2>
                    <p class="text-gray-600 dark:text-zinc-400">Quando alguém começar a preencher o formulário mas não concluir, aparecerá aqui.</p>
                </div>
            <?php else: ?>
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200 dark:divide-zinc-700">
                        <thead class="bg-gray-50 dark:bg-zinc-900">
                            <tr>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                                    #
                                </th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                                    Primeira Resposta
                                </th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider hidden md:table-cell">
                                    Última Atualização
                                </th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider hidden lg:table-cell">
                                    Progresso
                                </th>
                                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                                    Ações
                                </th>
                            </tr>
                        </thead>
                        <tbody class="bg-white dark:bg-zinc-800 divide-y divide-gray-200 dark:divide-zinc-700">
                            <?php foreach ($partialResponses as $index => $partial): ?>
                                <?php
                                $answersData = json_decode($partial['answers_data'], true);
                                $firstAnswer = 'Sem dados';
                                if (!empty($answersData)) {
                                    $firstAnswer = reset($answersData);
                                    if (is_array($firstAnswer)) {
                                        $firstAnswer = implode(', ', $firstAnswer);
                                    }
                                    $firstAnswer = mb_strlen($firstAnswer) > 50 ? mb_substr($firstAnswer, 0, 50) . '...' : $firstAnswer;
                                }

                                $progress = intval($partial['progress']);
                                $progressColor = $progress < 30 ? 'text-red-600 dark:text-red-400' : ($progress < 70 ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400');
                                ?>
                                <tr class="hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors">
                                    <td class="px-4 py-3 text-sm font-medium text-gray-900 dark:text-zinc-100">
                                        #<?= $totalPartialResponses - $index ?>
                                    </td>
                                    <td class="px-4 py-3">
                                        <div class="text-sm text-gray-900 dark:text-zinc-100">
                                            <?= htmlspecialchars($firstAnswer) ?>
                                        </div>
                                        <div class="text-xs text-gray-500 dark:text-zinc-500">
                                            <?= count($answersData) ?> campo(s) preenchido(s)
                                        </div>
                                    </td>
                                    <td class="px-4 py-3 hidden md:table-cell">
                                        <div class="text-sm text-gray-900 dark:text-zinc-100">
                                            <?= date('d/m/Y', strtotime($partial['last_updated'])) ?>
                                        </div>
                                        <div class="text-xs text-gray-500 dark:text-zinc-400">
                                            <?= date('H:i', strtotime($partial['last_updated'])) ?>
                                        </div>
                                    </td>
                                    <td class="px-4 py-3 hidden lg:table-cell">
                                        <div class="flex items-center gap-2">
                                            <div class="flex-1 bg-gray-200 dark:bg-zinc-700 rounded-full h-2 max-w-[100px]">
                                                <div class="h-2 rounded-full" style="width: <?= $progress ?>%; background-color: #f59e0b;"></div>
                                            </div>
                                            <span class="text-sm font-medium <?= $progressColor ?>">
                                                <?= $progress ?>%
                                            </span>
                                        </div>
                                    </td>
                                    <td class="px-4 py-3 text-right text-sm space-x-2">
                                        <button onclick="viewPartialResponse(<?= $partial['id'] ?>)"
                                                class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                                title="Ver detalhes">
                                            <i class="fas fa-eye"></i>
                                        </button>

                                        <?php if ($permissionManager->canDeleteRecord($form['user_id'])): ?>
                                            <button onclick="deletePartialResponse(<?= $partial['id'] ?>)"
                                                    class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                    title="Excluir">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        <?php endif; ?>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            <?php endif; ?>
        </div>
    </div>

    <!-- Info Card -->
    <div class="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div class="flex items-start gap-3">
            <i class="fas fa-info-circle text-blue-600 dark:text-blue-400 mt-0.5"></i>
            <div>
                <h3 class="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                    Como funciona?
                </h3>
                <p class="text-sm text-blue-800 dark:text-blue-200">
                    O sistema salva automaticamente o progresso do usuário enquanto ele preenche o formulário.
                    Se ele sair sem concluir, as respostas parciais ficam aqui para que você possa recuperar esses leads.
                </p>
            </div>
        </div>
    </div>
</div>

<script>
function viewPartialResponse(partialId) {
    // Buscar detalhes da resposta parcial
    fetch(`/modules/forms/responses/get_partial.php?id=${partialId}`)
        .then(res => res.json())
        .then(data => {
            if (!data.success) {
                Swal.fire('Erro', data.error || 'Erro ao carregar resposta', 'error');
                return;
            }

            const partial = data.partial;
            const answers = JSON.parse(partial.answers_data);

            let answersHtml = '<div class="text-left space-y-3">';
            for (const [field, answer] of Object.entries(answers)) {
                const displayValue = Array.isArray(answer) ? answer.join(', ') : answer;
                answersHtml += `
                    <div class="border-b border-gray-200 dark:border-zinc-700 pb-2">
                        <div class="text-xs text-gray-500 dark:text-zinc-500 mb-1">${field}</div>
                        <div class="text-sm font-medium text-gray-900 dark:text-zinc-100">${displayValue || '<em>Sem resposta</em>'}</div>
                    </div>
                `;
            }
            answersHtml += '</div>';

            Swal.fire({
                title: 'Resposta Parcial',
                html: `
                    <div class="mb-4 text-sm text-gray-600 dark:text-zinc-400">
                        Última atualização: ${new Date(partial.last_updated).toLocaleString('pt-BR')}
                    </div>
                    ${answersHtml}
                `,
                width: '600px',
                showCloseButton: true
            });
        })
        .catch(error => {
            Swal.fire('Erro', 'Erro de conexão', 'error');
        });
}

async function deletePartialResponse(partialId) {
    const result = await Swal.fire(getConfirmModalConfig(
        'Tem certeza?',
        'Deseja realmente excluir esta resposta parcial? Esta ação não pode ser desfeita.',
        'Sim, excluir!'
    ));

    if (!result.isConfirmed) return;

    try {
        const res = await fetch(`/modules/forms/responses/delete_partial.php?id=${partialId}`, {
            method: 'POST'
        });

        const resultText = await res.text();

        if (res.ok && resultText === 'success') {
            await Swal.fire({
                title: 'Excluída!',
                text: 'Resposta parcial excluída com sucesso.',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });
            window.location.reload();
        } else {
            Swal.fire({
                title: 'Erro!',
                text: 'Erro ao excluir: ' + resultText,
                icon: 'error'
            });
        }
    } catch (error) {
        Swal.fire({
            title: 'Erro!',
            text: 'Erro de conexão',
            icon: 'error'
        });
    }
}
</script>

<?php
require_once __DIR__ . '/../../../views/layout/footer.php';
?>
