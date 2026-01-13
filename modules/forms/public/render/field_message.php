<?php
// Pegar configurações do message
$config = json_decode($field['config'] ?? '{}', true);
$messageType = $config['message_type'] ?? 'text';
$audioUrl = $config['audio_url'] ?? '';
$waitTime = intval($config['wait_time'] ?? 0);
$autoplay = intval($config['autoplay'] ?? 0);
$buttonText = $config['button_text'] ?? 'Continuar';

// ID único para o player deste campo
$audioId = 'audio-' . $field['id'];
?>

<div class="text-center py-8">
    <h2 class="text-2xl font-bold mb-4"><?= htmlspecialchars($field['label']) ?></h2>
    <?php if (!empty($field['description'])): ?>
        <p class="text-lg mb-6"><?= htmlspecialchars($field['description']) ?></p>
    <?php endif; ?>

    <?php if ($messageType === 'audio' && !empty($audioUrl)): ?>
        <!-- Player de Áudio Customizado -->
        <div class="audio-player-container max-w-2xl mx-auto mb-8" data-audio-id="<?= $audioId ?>" data-audio-wait="<?= $waitTime ?>" data-audio-autoplay="<?= $autoplay ?>">
            <div class="bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-zinc-700">
                <!-- Áudio invisível (controla reprodução) -->
                <audio id="<?= $audioId ?>" src="<?= htmlspecialchars($audioUrl) ?>" preload="metadata"></audio>

                <!-- Controles visuais -->
                <div class="space-y-4">
                    <!-- Botão Play/Pause -->
                    <div class="flex justify-center">
                        <button type="button" id="<?= $audioId ?>-playBtn" class="w-16 h-16 rounded-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center transition-colors shadow-lg">
                            <i class="fas fa-play text-2xl"></i>
                        </button>
                    </div>

                    <!-- Barra de progresso -->
                    <div class="space-y-2">
                        <input type="range"
                               id="<?= $audioId ?>-progress"
                               class="w-full h-2 bg-gray-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-green-600"
                               min="0"
                               max="100"
                               value="0"
                               step="0.1">
                        <div class="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                            <span id="<?= $audioId ?>-currentTime">0:00</span>
                            <span id="<?= $audioId ?>-duration">0:00</span>
                        </div>
                    </div>

                    <!-- Controle de velocidade -->
                    <div class="flex items-center justify-center gap-2">
                        <span class="text-sm text-gray-600 dark:text-gray-400">Velocidade:</span>
                        <select id="<?= $audioId ?>-speed" class="text-sm bg-gray-100 dark:bg-zinc-700 border border-gray-300 dark:border-zinc-600 rounded px-2 py-1">
                            <option value="0.5">0.5x</option>
                            <option value="0.75">0.75x</option>
                            <option value="1" selected>1x</option>
                            <option value="1.25">1.25x</option>
                            <option value="1.5">1.5x</option>
                            <option value="2">2x</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    <?php endif; ?>

    <button type="button"
            class="btn-primary px-8 py-3 text-lg"
            onclick="<?php if ($displayMode === 'one-by-one'): ?>nextQuestion()<?php else: ?>
                // Para modo all-at-once, avançar para o próximo elemento
                const slide = this.closest('.fade-in');
                if (slide) {
                    const currentIndex = Array.from(slide.parentElement.children).indexOf(slide);
                    const nextSlide = slide.parentElement.children[currentIndex + 1];
                    if (nextSlide) {
                        nextSlide.scrollIntoView({ behavior: 'smooth' });
                    }
                }
            <?php endif; ?>">
        <?= htmlspecialchars($buttonText) ?> <i class="fas fa-arrow-right ml-2"></i>
    </button>
</div>

<?php if ($messageType === 'audio' && !empty($audioUrl)): ?>
<script>
(function() {
    const audioId = '<?= $audioId ?>';
    const waitTime = <?= $waitTime ?>;
    const autoplay = <?= $autoplay ?>;
    const buttonText = <?= json_encode($buttonText) ?>;

    console.log('🎵 Audio player iniciando:', audioId, 'Wait time:', waitTime, 'Autoplay:', autoplay);

    // Função para iniciar o player
    function initAudioPlayer() {
        const container = document.querySelector('[data-audio-id="' + audioId + '"]');
        if (!container) {
            console.error('❌ Audio container não encontrado:', audioId);
            return;
        }

        const audio = document.getElementById(audioId);
        const playBtn = document.getElementById(audioId + '-playBtn');
        const progressBar = document.getElementById(audioId + '-progress');
        const currentTimeEl = document.getElementById(audioId + '-currentTime');
        const durationEl = document.getElementById(audioId + '-duration');
        const speedSelect = document.getElementById(audioId + '-speed');

        if (!audio || !playBtn) {
            console.error('❌ Elementos do player não encontrados');
            return;
        }

        // Encontrar o slide e botão atual
        const slide = container.closest('.question-slide, .field-container');
        let button = slide ? slide.querySelector('button[type="button"][onclick*="nextQuestion"]') : null;

        if (!button && slide) {
            button = slide.querySelector('button.btn-primary[type="button"]');
        }

        // Formatar tempo (segundos para MM:SS)
        function formatTime(seconds) {
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return mins + ':' + (secs < 10 ? '0' : '') + secs;
        }

        // Atualizar duração quando metadados carregarem
        audio.addEventListener('loadedmetadata', function() {
            durationEl.textContent = formatTime(audio.duration);
            progressBar.max = audio.duration;
        });

        // Atualizar progresso durante reprodução
        audio.addEventListener('timeupdate', function() {
            currentTimeEl.textContent = formatTime(audio.currentTime);
            progressBar.value = audio.currentTime;
        });

        // Play/Pause
        playBtn.addEventListener('click', function() {
            if (audio.paused) {
                audio.play();
                playBtn.innerHTML = '<i class="fas fa-pause text-2xl"></i>';
            } else {
                audio.pause();
                playBtn.innerHTML = '<i class="fas fa-play text-2xl"></i>';
            }
        });

        // Quando áudio termina
        audio.addEventListener('ended', function() {
            playBtn.innerHTML = '<i class="fas fa-play text-2xl"></i>';
        });

        // Controle de progresso manual
        progressBar.addEventListener('input', function() {
            audio.currentTime = progressBar.value;
        });

        // Controle de velocidade
        speedSelect.addEventListener('change', function() {
            audio.playbackRate = parseFloat(speedSelect.value);
        });

        // Autoplay
        if (autoplay === 1) {
            setTimeout(function() {
                audio.play();
                playBtn.innerHTML = '<i class="fas fa-pause text-2xl"></i>';
            }, 500);
        }

        // Sistema de bloqueio (se configurado)
        if (waitTime > 0 && button) {
            // Desabilitar botão inicialmente
            button.disabled = true;
            button.classList.add('opacity-50', 'cursor-not-allowed');

            // Desabilitar enter também
            if (slide) {
                slide.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter' && button.disabled) {
                        e.preventDefault();
                        e.stopPropagation();
                        return false;
                    }
                }, true);
            }

            // Salvar texto original do botão
            const originalButtonHTML = button.innerHTML;
            let timeLeft = waitTime;

            // Atualizar texto do botão
            function updateButtonText() {
                button.innerHTML = 'Aguarde <span class="font-bold">' + timeLeft + 's</span>';
            }

            updateButtonText();
            console.log('⏱️ Bloqueio iniciado:', timeLeft, 'segundos');

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
                    button.innerHTML = buttonText + ' <i class="fas fa-arrow-right ml-2"></i>';

                    console.log('✅ Áudio liberado, botão habilitado');
                }
            }, 1000);
        }

        console.log('✅ Audio player configurado');
    }

    // Aguardar DOM estar pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(initAudioPlayer, 300);
        });
    } else {
        setTimeout(initAudioPlayer, 300);
    }
})();
</script>
<?php endif; ?>