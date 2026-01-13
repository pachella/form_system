<?php
// Pegar configurações do VSL
$config = json_decode($field['config'] ?? '{}', true);
$videoUrl = $config['video_url'] ?? '';
$waitTime = intval($config['wait_time'] ?? 0);
$autoplay = intval($config['autoplay'] ?? 0);
$buttonText = $config['button_text'] ?? 'Continuar';

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
            // Adicionar autoplay se configurado
            if ($autoplay) {
                $embedUrl .= "?autoplay=1&mute=0";
            }
        }
    }
    // Vimeo
    elseif (strpos($videoUrl, 'vimeo.com') !== false) {
        if (preg_match('/vimeo\.com\/(\d+)/', $videoUrl, $matches)) {
            $embedUrl = "https://player.vimeo.com/video/" . htmlspecialchars($matches[1]);
            // Adicionar autoplay se configurado
            if ($autoplay) {
                $embedUrl .= "?autoplay=1&muted=0";
            }
        }
    }
}

// ID único para o botão deste campo
$vslId = 'vsl-' . $field['id'];
?>

<?php if (!empty($embedUrl)): ?>
    <div class="media-container mb-6 aspect-video max-w-4xl mx-auto" data-vsl-id="<?= $vslId ?>" data-vsl-wait="<?= $waitTime ?>">
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
    const waitTime = <?= $waitTime ?>;
    const buttonText = <?= json_encode($buttonText) ?>;

    console.log('🎬 VSL iniciando:', vslId, 'Wait time:', waitTime);

    // Função para iniciar o bloqueio
    function initVSLTimer() {
        const vslContainer = document.querySelector('[data-vsl-id="' + vslId + '"]');
        if (!vslContainer) {
            console.error('❌ VSL container não encontrado:', vslId);
            return;
        }

        // Encontrar o slide atual
        const slide = vslContainer.closest('.question-slide, .field-container');
        if (!slide) {
            console.error('❌ Slide não encontrado');
            return;
        }

        console.log('✅ Slide encontrado');

        // Tentar múltiplos seletores para encontrar o botão
        let button = slide.querySelector('button[type="button"][onclick*="nextQuestion"]');
        if (!button) {
            button = slide.querySelector('button.btn-primary[type="button"]');
        }
        if (!button) {
            button = slide.querySelector('.flex.items-center.gap-4 button[type="button"]');
        }
        if (!button) {
            console.error('❌ Botão não encontrado. Tentando todos os botões...');
            const allButtons = slide.querySelectorAll('button[type="button"]');
            console.log('Botões encontrados:', allButtons.length);
            button = allButtons[0]; // Pegar o primeiro
        }

        if (!button) {
            console.error('❌ Nenhum botão encontrado no slide');
            return;
        }

        console.log('✅ Botão encontrado:', button);

        // Desabilitar botão inicialmente
        button.disabled = true;
        button.classList.add('opacity-50', 'cursor-not-allowed');

        // Desabilitar enter também
        slide.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && button.disabled) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        }, true);

        // Salvar texto original do botão
        const originalButtonHTML = button.innerHTML;

        let timeLeft = waitTime;

        // Atualizar texto do botão
        function updateButtonText() {
            button.innerHTML = 'Aguarde <span class="font-bold">' + timeLeft + 's</span>';
        }

        updateButtonText();
        console.log('⏱️ Contador iniciado:', timeLeft, 'segundos');

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

                // Usar texto customizado
                button.innerHTML = buttonText;

                console.log('✅ VSL liberado, botão habilitado');
            }
        }, 1000);
    }

    // Aguardar DOM estar pronto e um pequeno delay
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(initVSLTimer, 300);
        });
    } else {
        setTimeout(initVSLTimer, 300);
    }
})();
</script>
<?php endif; ?>
