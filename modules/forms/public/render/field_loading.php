<?php
// Pegar configurações do Loading
$config = json_decode($field['config'] ?? '{}', true);
$phrase1 = $config['phrase_1'] ?? 'Analisando suas respostas...';
$phrase2 = $config['phrase_2'] ?? 'Processando informações...';
$phrase3 = $config['phrase_3'] ?? 'Preparando resultado...';

// Cores personalizadas
$primaryColor = $customization['primary_color'] ?? '#4f46e5';
$textColor = $customization['text_color'] ?? '#000000';

// ID único para este campo
$loadingId = 'loading-' . $field['id'];
?>

<div class="text-center py-12" id="<?= $loadingId ?>">
    <!-- Barra de Progresso -->
    <div class="mb-8 max-w-2xl mx-auto">
        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div id="<?= $loadingId ?>-progress-bar"
                 class="h-full transition-all duration-[2000ms] ease-linear rounded-full"
                 style="background-color: <?= htmlspecialchars($primaryColor) ?>; width: 0%;">
            </div>
        </div>
    </div>

    <!-- Texto Animado -->
    <div id="<?= $loadingId ?>-text"
         class="text-2xl md:text-3xl font-semibold mb-6"
         style="color: <?= htmlspecialchars($textColor) ?>; min-height: 3rem;">
        <?= htmlspecialchars($phrase1) ?>
    </div>

    <!-- Spinner -->
    <div class="inline-block">
        <svg class="animate-spin h-14 w-14 md:h-16 md:w-16"
             style="color: <?= htmlspecialchars($primaryColor) ?>;"
             xmlns="http://www.w3.org/2000/svg"
             fill="none"
             viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    </div>
</div>

<script>
(function() {
    const loadingId = '<?= $loadingId ?>';
    const progressBar = document.getElementById(loadingId + '-progress-bar');
    const textElement = document.getElementById(loadingId + '-text');
    const phrases = <?= json_encode([$phrase1, $phrase2, $phrase3]) ?>;

    let currentPhrase = 0;

    // Iniciar animação
    setTimeout(function() {
        // Fase 1: 0-33% (2 segundos)
        if (progressBar) progressBar.style.width = '33%';

        setTimeout(function() {
            // Fase 2: 33-66% (2 segundos)
            currentPhrase = 1;
            if (textElement) textElement.textContent = phrases[currentPhrase];
            if (progressBar) progressBar.style.width = '66%';

            setTimeout(function() {
                // Fase 3: 66-100% (2 segundos)
                currentPhrase = 2;
                if (textElement) textElement.textContent = phrases[currentPhrase];
                if (progressBar) progressBar.style.width = '100%';

                // Após 2 segundos, avançar para próximo campo
                setTimeout(function() {
                    <?php if ($displayMode === 'one-by-one'): ?>
                        nextQuestion();
                    <?php else: ?>
                        const slide = document.getElementById('<?= $loadingId ?>').closest('.fade-in');
                        if (slide) {
                            const currentIndex = Array.from(slide.parentElement.children).indexOf(slide);
                            const nextSlide = slide.parentElement.children[currentIndex + 1];
                            if (nextSlide) {
                                nextSlide.scrollIntoView({ behavior: 'smooth' });
                            }
                        }
                    <?php endif; ?>
                }, 2000);
            }, 2000);
        }, 2000);
    }, 100);
})();
</script>
