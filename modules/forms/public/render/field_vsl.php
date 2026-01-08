<?php
// Pegar configurações do VSL
$config = json_decode($field['config'] ?? '{}', true);
$videoUrl = $config['video_url'] ?? '';
$waitTime = intval($config['wait_time'] ?? 0);

// Processar URL do vídeo
$embedUrl = '';
if (!empty($videoUrl)) {
    // YouTube
    if (strpos($videoUrl, 'youtube.com') !== false || strpos($videoUrl, 'youtu.be') !== false) {
        $videoId = '';
        if (strpos($videoUrl, 'youtu.be/') !== false) {
            $videoId = explode('youtu.be/', $videoUrl)[1];
            $videoId = explode('?', $videoId)[0];
        } elseif (strpos($videoUrl, 'youtube.com/watch?v=') !== false) {
            parse_str(parse_url($videoUrl, PHP_URL_QUERY), $params);
            $videoId = $params['v'] ?? '';
        }
        if ($videoId) {
            $embedUrl = "https://www.youtube.com/embed/" . htmlspecialchars($videoId);
        }
    }
    // Vimeo
    elseif (strpos($videoUrl, 'vimeo.com') !== false) {
        if (preg_match('/vimeo\.com\/(\d+)/', $videoUrl, $matches)) {
            $embedUrl = "https://player.vimeo.com/video/" . htmlspecialchars($matches[1]);
        }
    }
}

// ID único para o botão deste campo
$buttonId = 'vsl-button-' . $field['id'];
?>

<div class="text-center py-8" data-vsl-wait-time="<?= $waitTime ?>">
    <h2 class="text-2xl font-bold mb-4"><?= htmlspecialchars($field['label']) ?></h2>
    <?php if (!empty($field['description'])): ?>
        <p class="text-lg mb-6"><?= nl2br(htmlspecialchars($field['description'])) ?></p>
    <?php endif; ?>

    <?php if (!empty($embedUrl)): ?>
        <div class="media-container mb-6 aspect-video max-w-4xl mx-auto">
            <iframe class="w-full h-full rounded-lg border border-gray-200 dark:border-zinc-700"
                    src="<?= $embedUrl ?>"
                    frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen>
            </iframe>
        </div>
    <?php endif; ?>

    <button type="button"
            id="<?= $buttonId ?>"
            class="btn-primary px-8 py-3 text-lg <?= $waitTime > 0 ? 'opacity-50 cursor-not-allowed' : '' ?>"
            <?= $waitTime > 0 ? 'disabled' : '' ?>
            onclick="<?php if ($displayMode === 'one-by-one'): ?>nextQuestion()<?php else: ?>
                const slide = this.closest('.fade-in');
                if (slide) {
                    const currentIndex = Array.from(slide.parentElement.children).indexOf(slide);
                    const nextSlide = slide.parentElement.children[currentIndex + 1];
                    if (nextSlide) {
                        nextSlide.scrollIntoView({ behavior: 'smooth' });
                    }
                }
            <?php endif; ?>">
        <span id="<?= $buttonId ?>-text">
            <?php if ($waitTime > 0): ?>
                Aguarde <span id="<?= $buttonId ?>-timer"><?= $waitTime ?></span>s
            <?php else: ?>
                Continuar <i class="fas fa-arrow-right ml-2"></i>
            <?php endif; ?>
        </span>
    </button>
</div>

<?php if ($waitTime > 0): ?>
<script>
(function() {
    const buttonId = '<?= $buttonId ?>';
    const button = document.getElementById(buttonId);
    const timerSpan = document.getElementById(buttonId + '-timer');
    const textSpan = document.getElementById(buttonId + '-text');
    let timeLeft = <?= $waitTime ?>;

    // Contador regressivo
    const countdown = setInterval(function() {
        timeLeft--;

        if (timerSpan) {
            timerSpan.textContent = timeLeft;
        }

        if (timeLeft <= 0) {
            clearInterval(countdown);

            // Habilitar botão
            button.disabled = false;
            button.classList.remove('opacity-50', 'cursor-not-allowed');

            // Mudar texto
            textSpan.innerHTML = 'Continuar <i class="fas fa-arrow-right ml-2"></i>';
        }
    }, 1000);
})();
</script>
<?php endif; ?>
