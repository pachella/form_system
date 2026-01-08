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
$vslId = 'vsl-' . $field['id'];
?>

<?php if (!empty($embedUrl)): ?>
    <div class="media-container mb-6 aspect-video max-w-4xl mx-auto" data-vsl-id="<?= $vslId ?>">
        <iframe class="w-full h-full rounded-lg border border-gray-200 dark:border-zinc-700"
                src="<?= $embedUrl ?>"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen>
        </iframe>
    </div>
<?php endif; ?>

<?php if ($waitTime > 0): ?>
<script>
(function() {
    const vslId = '<?= $vslId ?>';
    const vslContainer = document.querySelector('[data-vsl-id="' + vslId + '"]');
    if (!vslContainer) return;

    // Encontrar o slide atual
    const slide = vslContainer.closest('.question-slide, .field-container');
    if (!slide) return;

    // Encontrar o botão "OK" deste slide
    const button = slide.querySelector('button[type="button"]:not([id^="vsl-button-"])');
    if (!button) return;

    // Desabilitar botão inicialmente
    button.disabled = true;
    button.classList.add('opacity-50', 'cursor-not-allowed');

    // Salvar texto original do botão
    const originalButtonHTML = button.innerHTML;

    let timeLeft = <?= $waitTime ?>;

    // Atualizar texto do botão
    function updateButtonText() {
        button.innerHTML = 'Aguarde <span class="font-bold">' + timeLeft + 's</span>';
    }

    updateButtonText();

    // Contador regressivo
    const countdown = setInterval(function() {
        timeLeft--;

        if (timeLeft > 0) {
            updateButtonText();
        } else {
            clearInterval(countdown);

            // Habilitar botão
            button.disabled = false;
            button.classList.remove('opacity-50', 'cursor-not-allowed');

            // Restaurar texto original
            button.innerHTML = originalButtonHTML;
        }
    }, 1000);
})();
</script>
<?php endif; ?>
