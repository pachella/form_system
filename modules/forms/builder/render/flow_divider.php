<?php
// Renderizar card de divisor de fluxo
if (!isset($flow)) return;

$flowConditions = json_decode($flow['conditions'] ?? '[]', true) ?: [];
$conditionsType = $flow['conditions_type'] ?? 'all';
$conditionsCount = count($flowConditions);

$conditionsText = 'Nenhuma condição definida';
if ($conditionsCount > 0) {
    $conditionsText = $conditionsCount . ' condição' . ($conditionsCount > 1 ? 'ões' : '');
    $conditionsText .= ' (' . ($conditionsType === 'all' ? 'TODAS' : 'QUALQUER UMA') . ')';
}
?>
<div class="flow-divider-card bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-300 dark:border-purple-700 rounded-lg p-4"
     data-flow-id="<?= $flow['id'] ?>"
     data-type="flow">
    <div class="flex items-start justify-between">
        <div class="flex items-start gap-3 flex-1">
            <div class="text-purple-600 dark:text-purple-400 mt-1">
                <i class="fas fa-code-branch text-xl"></i>
            </div>
            <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                    <h3 class="font-semibold text-purple-900 dark:text-purple-100">
                        <?= htmlspecialchars($flow['label']) ?>
                    </h3>
                    <span class="text-xs px-2 py-0.5 bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 rounded-full">
                        Divisor de Fluxo
                    </span>
                </div>
                <p class="text-sm text-purple-700 dark:text-purple-300 mb-2">
                    <i class="fas fa-filter mr-1"></i>
                    <?= $conditionsText ?>
                </p>
                <p class="text-xs text-purple-600 dark:text-purple-400 italic">
                    Se as condições forem atendidas, o formulário pulará para este ponto
                </p>
            </div>
        </div>
        <div class="flex gap-2">
            <button onclick="duplicateFlow(<?= $flow['id'] ?>)"
                    class="text-blue-600 dark:text-blue-400 hover:opacity-80"
                    title="Duplicar fluxo">
                <i class="fas fa-copy"></i>
            </button>
            <button onclick="editFlow(<?= $flow['id'] ?>)"
                    style="color: #9333ea;"
                    class="hover:opacity-80"
                    title="Configurar condições">
                <i class="fas fa-sliders-h"></i>
            </button>
            <button onclick="deleteFlow(<?= $flow['id'] ?>)"
                    class="text-red-600 dark:text-red-400 hover:opacity-80"
                    title="Remover fluxo">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    </div>
</div>
