// Variáveis globais
let currentSlide = 0;
const slides = document.querySelectorAll('.question-slide');
const totalSlides = slides.length;

// Array de slides visitados para navegação correta (histórico de navegação)
let visitedSlides = [0]; // Começa com o primeiro slide

// Carregar fluxos condicionais
const flowsData = document.body.getAttribute('data-flows');
const flows = flowsData ? JSON.parse(flowsData) : [];

// Rastrear qual fluxo está ativo atualmente
let activeFlowId = null;

// Variáveis dinâmicas do formulário
let userFirstName = '';

// ============================================
// SISTEMA DE VARIÁVEIS DINÂMICAS
// ============================================
function extractFirstName(fullName) {
    if (!fullName) return '';
    const trimmed = fullName.trim();
    const firstName = trimmed.split(' ')[0];
    return firstName;
}

function replaceVariables(text) {
    if (!text) return text;
    return text.replace(/\[nome\]/gi, userFirstName || '[nome]');
}

function applyVariablesToSlide(slide) {
    if (!userFirstName) return;

    // Substituir no label (h2, h3)
    const labels = slide.querySelectorAll('h2, h3');
    labels.forEach(label => {
        const originalText = label.getAttribute('data-original-text') || label.textContent;
        if (!label.getAttribute('data-original-text')) {
            label.setAttribute('data-original-text', originalText);
        }
        if (originalText.includes('[nome]')) {
            label.textContent = replaceVariables(originalText);
        }
    });

    // Substituir nas descriptions (p)
    const descriptions = slide.querySelectorAll('p');
    descriptions.forEach(desc => {
        const originalText = desc.getAttribute('data-original-text') || desc.textContent;
        if (!desc.getAttribute('data-original-text')) {
            desc.setAttribute('data-original-text', originalText);
        }
        if (originalText.includes('[nome]')) {
            desc.textContent = replaceVariables(originalText);
        }
    });
}

// ============================================
// FUNÇÃO HELPER PARA RENDERIZAR MÍDIA
// ============================================
function renderMediaHTML(mediaData) {
    if (!mediaData || mediaData === '') {
        return '';
    }

    try {
        const media = JSON.parse(mediaData);

        if (media && media.type === 'video') {
            const url = media.url || '';
            const service = media.service || 'direct';

            if (service === 'youtube') {
                let videoId = '';
                if (url.includes('youtu.be/')) {
                    videoId = url.split('youtu.be/')[1].split('?')[0];
                } else if (url.includes('youtube.com/watch?v=')) {
                    const urlParams = new URLSearchParams(url.split('?')[1]);
                    videoId = urlParams.get('v') || '';
                }

                if (videoId) {
                    return `
                        <div class="media-container mb-6 aspect-video max-w-2xl mx-auto">
                            <iframe class="w-full h-full rounded-lg border border-gray-200 dark:border-zinc-700"
                                    src="https://www.youtube.com/embed/${videoId}"
                                    frameborder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowfullscreen>
                            </iframe>
                        </div>
                    `;
                }
            } else if (service === 'vimeo') {
                const match = url.match(/vimeo\.com\/(\d+)/);
                if (match) {
                    const videoId = match[1];
                    return `
                        <div class="media-container mb-6 aspect-video max-w-2xl mx-auto">
                            <iframe class="w-full h-full rounded-lg border border-gray-200 dark:border-zinc-700"
                                    src="https://player.vimeo.com/video/${videoId}"
                                    frameborder="0"
                                    allow="autoplay; fullscreen; picture-in-picture"
                                    allowfullscreen>
                            </iframe>
                        </div>
                    `;
                }
            }
        } else if (media && media.type === 'image') {
            const url = media.url || '';
            if (url) {
                return `
                    <div class="media-container mb-6 max-w-2xl mx-auto">
                        <img src="${url}"
                             alt="Imagem"
                             class="w-full h-auto rounded-lg border border-gray-200 dark:border-zinc-700"
                             style="max-height: 500px; object-fit: contain;">
                    </div>
                `;
            }
        }
    } catch (e) {
        // Se não for JSON, pode ser uma URL direta de imagem
        if (mediaData.startsWith('http')) {
            return `
                <div class="media-container mb-6 max-w-2xl mx-auto">
                    <img src="${mediaData}"
                         alt="Imagem"
                         class="w-full h-auto rounded-lg border border-gray-200 dark:border-zinc-700"
                         style="max-height: 500px; object-fit: contain;">
                </div>
            `;
        }
    }

    return '';
}

// ============================================
// FUNÇÃO PARA GERAR MENSAGEM DE SUCESSO COM REDIRECIONAMENTO
// ============================================
function generateSuccessMessage(score = null) {
    // Mensagem de sucesso padrão
    const successTitle = document.body.getAttribute('data-success-title') || 'Tudo certo!';
    const successDescription = document.body.getAttribute('data-success-description') || 'Obrigado por responder nosso formulário.';
    const successMedia = document.body.getAttribute('data-success-media') || '';

    // Dados de redirecionamento
    const redirectEnabledRaw = document.body.getAttribute('data-redirect-enabled');
    const redirectEnabled = redirectEnabledRaw === '1' || redirectEnabledRaw === 1 || redirectEnabledRaw === true;
    const redirectUrl = document.body.getAttribute('data-redirect-url') || '';
    const redirectType = document.body.getAttribute('data-redirect-type') || 'automatic';
    const redirectButtonText = document.body.getAttribute('data-redirect-button-text') || 'Continuar';

    // Branding
    const hideBrandingRaw = document.body.getAttribute('data-hide-branding');
    const hideBranding = hideBrandingRaw === '1' || hideBrandingRaw === 1 || hideBrandingRaw === true;

    // Exibir pontuação
    const showScoreRaw = document.body.getAttribute('data-show-score');
    const showScore = showScoreRaw === '1' || showScoreRaw === 1 || showScoreRaw === true;

    // Debug temporário (remover depois)
    console.log('🎯 Score Debug:', {
        showScoreRaw: showScoreRaw,
        showScore: showScore,
        score: score,
        willDisplay: showScore && score !== null
    });

    // Cores personalizadas para o botão
    const primaryColor = document.body.getAttribute('data-primary-color') || '#4f46e5';
    const buttonTextColor = document.body.getAttribute('data-button-text-color') || '#ffffff';
    const buttonRadius = document.body.getAttribute('data-button-radius') || '8';

    let htmlContent = `
        <div class="text-center fade-in">
            <div class="inline-flex items-center justify-center mb-6" style="width: 120px; height: 120px;">
                ${showScore && score !== null && score !== undefined ?
                    `<div class="w-20 h-20 rounded-full flex items-center justify-center" style="background-color: ${primaryColor};">
                        <span class="text-4xl font-bold" style="color: ${buttonTextColor};">${score}</span>
                    </div>` :
                    `<div id="lottie-success" style="width: 120px; height: 120px;"></div>`
                }
            </div>
            ${showScore && score !== null && score !== undefined ?
                `<p class="text-lg mb-4" style="color: ${primaryColor}; font-weight: 600;">Você fez ${score} ponto${score !== 1 ? 's' : ''}!</p>` :
                ''
            }
            <h2 class="text-4xl font-bold text-gray-900 mb-3">${successTitle}</h2>
            <p class="text-xl text-gray-600 mb-6">${successDescription}</p>

            ${renderMediaHTML(successMedia)}
    `;

    // Adicionar mensagem de redirecionamento automático
    if (redirectEnabled && redirectUrl && redirectType === 'automatic') {
        htmlContent += `
            <p class="text-sm text-gray-500 mt-4 flex items-center justify-center gap-2">
                <i class="fas fa-spinner fa-spin"></i>
                Aguarde, você será redirecionado(a)...
            </p>
        `;
    }

    // Adicionar botão de redirecionamento se ativado e tipo = button
    if (redirectEnabled && redirectUrl && redirectType === 'button') {
        htmlContent += `
            <div class="mt-8">
                <a href="${redirectUrl}"
                   class="inline-flex items-center gap-2 px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 hover:scale-105 hover:shadow-lg"
                   style="background-color: ${primaryColor}; color: ${buttonTextColor}; border-radius: ${buttonRadius}px;">
                    ${redirectButtonText}
                    <i class="fas fa-arrow-right"></i>
                </a>
            </div>
        `;
    }

    htmlContent += `</div>`;

    // Adicionar badge Formtalk se não estiver oculto
    if (!hideBranding) {
        // Pegar cor de texto dinâmica do body
        const textColor = document.body.getAttribute('data-text-color') || '#000000';

        // Converter cor hex para rgb com opacidade
        const hexToRgb = (hex) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : {r: 0, g: 0, b: 0};
        };

        const rgb = hexToRgb(textColor);
        const textColorWithOpacity = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5)`;

        htmlContent += `
            <style>
                @keyframes bounceInUp {
                    0% {
                        opacity: 0;
                        transform: translate(-50%, 100px);
                    }
                    60% {
                        opacity: 1;
                        transform: translate(-50%, -10px);
                    }
                    80% {
                        transform: translate(-50%, 5px);
                    }
                    100% {
                        opacity: 1;
                        transform: translate(-50%, 0);
                    }
                }
                #formtalkBadge {
                    animation: bounceInUp 0.8s ease-out forwards;
                    left: 50%;
                }
            </style>
            <div id="formtalkBadge" style="position: fixed; bottom: 2rem; z-index: 50;">
                <a href="https://formtalk.app" target="_blank" rel="noopener noreferrer"
                   style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.25rem; background: transparent; border-radius: 9999px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border: 1px solid ${textColorWithOpacity}; transition: all 0.2s; text-decoration: none;"
                   onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 20px 25px -5px rgba(0, 0, 0, 0.1)'"
                   onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 10px 15px -3px rgba(0, 0, 0, 0.1)'">
                    <span style="font-size: 0.875rem; font-weight: 500; color: ${textColorWithOpacity};">Gostou deste formulário?</span>
                    <span style="font-size: 0.875rem; font-weight: 600; color: ${textColorWithOpacity};">
                        Crie um igual a este grátis!
                    </span>
                    <i class="fas fa-arrow-right" style="font-size: 0.75rem; color: #4EA44B;"></i>
                </a>
            </div>
        `;
    }

    // Implementar redirecionamento automático se ativado e tipo = automatic
    if (redirectEnabled && redirectUrl && redirectType === 'automatic') {
        setTimeout(() => {
            window.location.href = redirectUrl;
        }, 3000); // Redireciona após 3 segundos
    }

    return htmlContent;
}

// ============================================
// FUNÇÃO PARA INICIALIZAR ANIMAÇÃO LOTTIE
// ============================================
function initLottieSuccess() {
    const lottieContainer = document.getElementById('lottie-success');
    if (lottieContainer && typeof lottie !== 'undefined') {
        lottie.loadAnimation({
            container: lottieContainer,
            renderer: 'svg',
            loop: false,
            autoplay: true,
            path: '/uploads/system/success.json'
        });
    }
}

// ==================== MÁSCARAS ====================
// Máscaras agora são aplicadas via InputMasks.autoApply() (chamado no final do arquivo)
// Configuração especial para CEP com busca automática de endereço
document.addEventListener('DOMContentLoaded', function() {
    // CEP com busca automática de endereço
    document.querySelectorAll('.cep-mask').forEach(el => {
        const fieldName = el.getAttribute('data-address-trigger');

        if (fieldName) {
            // Aplicar máscara usando InputMasks
            if (typeof InputMasks !== 'undefined') {
                InputMasks.cep(el);
            }

            // Configurar busca automática de endereço
            el.addEventListener('blur', async function() {
                const cep = this.value.replace(/\D/g, '');
                if (cep.length === 8) {
                    const addressFields = document.getElementById(`address-fields-${fieldName}`);

                    try {
                        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                        const data = await response.json();

                        if (!data.erro && addressFields) {
                            addressFields.style.display = 'grid';

                            const ruaInput = addressFields.querySelector('[name$="[rua]"]');
                            const bairroInput = addressFields.querySelector('[name$="[bairro]"]');
                            const cidadeInput = addressFields.querySelector('[name$="[cidade]"]');
                            const estadoInput = addressFields.querySelector('[name$="[estado]"]');
                            const numeroInput = addressFields.querySelector('[name$="[numero]"]');

                            if (ruaInput) ruaInput.value = data.logradouro;
                            if (bairroInput) bairroInput.value = data.bairro;
                            if (cidadeInput) cidadeInput.value = data.localidade;
                            if (estadoInput) estadoInput.value = data.uf;
                            if (numeroInput) numeroInput.focus();
                        }
                    } catch (error) {
                        console.error('Erro ao buscar CEP:', error);
                    }
                }
            });
        }
    });

    // Aplicar todas as máscaras automaticamente
    if (typeof InputMasks !== 'undefined') {
        InputMasks.autoApply();
    }
});

// ==================== RATING STARS ====================
document.querySelectorAll('.rating-stars').forEach(container => {
    const stars = container.querySelectorAll('.star');
    const fieldName = container.getAttribute('data-field');
    const hiddenInput = document.querySelector(`input[name="${fieldName}"]`);

    stars.forEach((star, index) => {
        star.addEventListener('click', () => {
            const value = star.getAttribute('data-value');
            hiddenInput.value = value;

            stars.forEach((s, i) => {
                if (i < index + 1) {
                    s.classList.add('active');
                } else {
                    s.classList.remove('active');
                }
            });
        });

        star.addEventListener('mouseover', () => {
            stars.forEach((s, i) => {
                if (i <= index) {
                    s.style.color = '#fbbf24';
                } else {
                    s.style.color = '#d1d5db';
                }
            });
        });
    });

    container.addEventListener('mouseleave', () => {
        const currentValue = parseInt(hiddenInput.value) || 0;
        stars.forEach((s, i) => {
            if (i < currentValue) {
                s.style.color = '#fbbf24';
            } else {
                s.style.color = '#d1d5db';
            }
        });
    });
});

// ==================== RADIO/CHECKBOX BUTTONS ====================
document.querySelectorAll('.radio-option').forEach(option => {
    option.addEventListener('click', function() {
        const input = this.querySelector('input[type="radio"], input[type="checkbox"]');
        const isCheckbox = input.type === 'checkbox';

        if (isCheckbox) {
            input.checked = !input.checked;

            if (input.checked) {
                this.classList.add('selected');
            } else {
                this.classList.remove('selected');
            }
        } else {
            const groupName = input.getAttribute('name');

            document.querySelectorAll(`input[name="${groupName}"]`).forEach(radio => {
                radio.closest('.radio-option').classList.remove('selected');
            });

            this.classList.add('selected');
            input.checked = true;
        }
    });
});

// ==================== FILE UPLOAD ====================
function updateFileName(input) {
    const fileName = input.files[0]?.name;
    const fileNameDisplay = input.closest('.file-upload-area').querySelector('.file-name');
    if (fileName) {
        fileNameDisplay.textContent = '✓ ' + fileName;
        fileNameDisplay.style.display = 'block';
    }
}

// Drag and drop para file upload
document.querySelectorAll('.file-upload-area').forEach(area => {
    area.addEventListener('dragover', (e) => {
        e.preventDefault();
        area.classList.add('dragover');
    });

    area.addEventListener('dragleave', () => {
        area.classList.remove('dragover');
    });

    area.addEventListener('drop', (e) => {
        e.preventDefault();
        area.classList.remove('dragover');
        const input = area.querySelector('input[type="file"]');
        input.files = e.dataTransfer.files;
        updateFileName(input);
    });
});

// ==================== NAVEGAÇÃO ONE-BY-ONE ====================

// Função para verificar e processar fluxos condicionais
/**
 * Verifica se algum fluxo deve ser ativado baseado nas respostas atuais
 * Retorna o flow_id do fluxo ativado, ou null se nenhum fluxo deve ser ativado
 */
function checkFlows() {
    if (!flows || flows.length === 0) {
        return null;
    }

    // Coletar todas as respostas do formulário até o momento
    const formData = new FormData(document.getElementById('formOneByOne'));
    const responses = {};

    for (let [key, value] of formData.entries()) {
        if (key.startsWith('field_')) {
            const fieldId = key.replace('field_', '').replace('_min', '').replace('_max', '');

            // Para checkboxes, criar array de valores
            if (responses[fieldId]) {
                if (!Array.isArray(responses[fieldId])) {
                    responses[fieldId] = [responses[fieldId]];
                }
                responses[fieldId].push(value);
            } else {
                responses[fieldId] = value;
            }
        }
    }

    // Verificar cada fluxo em ordem
    for (const flow of flows) {
        const conditions = flow.conditions ? JSON.parse(flow.conditions) : [];
        const conditionsType = flow.conditions_type || 'all';

        if (conditions.length === 0) continue;

        // Verificar se todos os campos usados nas condições já foram respondidos
        let allConditionFieldsAnswered = true;
        for (const condition of conditions) {
            const fieldValue = responses[condition.field_id];
            if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
                allConditionFieldsAnswered = false;
                break;
            }
        }

        // Se campos condicionais não foram respondidos, ignorar este fluxo
        if (!allConditionFieldsAnswered) {
            continue;
        }

        // Verificar se condições foram atendidas
        let conditionsMet = (conditionsType === 'all');

        for (const condition of conditions) {
            const fieldValue = responses[condition.field_id];
            const conditionValue = condition.value;
            const operator = condition.operator;

            // Processar arrays (checkboxes)
            const valueToCheck = Array.isArray(fieldValue) ? fieldValue.join(',') : String(fieldValue || '');

            let met = false;
            switch (operator) {
                case 'equals':
                    met = valueToCheck.toLowerCase() === conditionValue.toLowerCase();
                    break;
                case 'not_equals':
                    met = valueToCheck.toLowerCase() !== conditionValue.toLowerCase();
                    break;
                case 'contains':
                    met = valueToCheck.toLowerCase().includes(conditionValue.toLowerCase());
                    break;
                case 'not_contains':
                    met = !valueToCheck.toLowerCase().includes(conditionValue.toLowerCase());
                    break;
            }

            if (conditionsType === 'all') {
                conditionsMet = conditionsMet && met;
                if (!conditionsMet) break;
            } else {
                conditionsMet = conditionsMet || met;
                if (conditionsMet) break;
            }
        }

        // Se condições foram atendidas, retornar o flow_id
        if (conditionsMet) {
            console.log('🎯 Fluxo ativado:', flow.label, '(Flow ID:', flow.id + ')');
            return flow.id;
        }
    }

    return null; // Nenhum fluxo ativado
}

function updateProgress() {
    const progress = ((currentSlide + 1) / totalSlides) * 100;
    document.getElementById('progressBar').style.width = progress + '%';
}

// Atualizar numeração virtual baseada em perguntas efetivamente mostradas
function updateVirtualNumber() {
    const virtualIndex = visitedSlides.length; // Posição atual no histórico (já é 1-based)
    const questionNumberEl = slides[currentSlide]?.querySelector('.question-number');

    if (questionNumberEl) {
        // Preservar o ícone e atualizar apenas o número
        const icon = questionNumberEl.querySelector('i');
        if (icon) {
            questionNumberEl.innerHTML = virtualIndex + ' ';
            questionNumberEl.appendChild(icon);
        } else {
            // Caso não tenha ícone, apenas atualizar o texto
            const iconHtml = questionNumberEl.innerHTML.match(/<i[^>]*>.*?<\/i>/);
            questionNumberEl.innerHTML = virtualIndex + ' ' + (iconHtml ? iconHtml[0] : '');
        }
    }
}

/**
 * Avança para a próxima pergunta com lógica de fluxos
 */
function nextQuestion() {
    const currentQuestion = slides[currentSlide];

    // Capturar o primeiro nome se o campo atual for do tipo "name"
    const nameInput = currentQuestion.querySelector('input[data-field-type="name"]');
    if (nameInput && nameInput.value) {
        userFirstName = extractFirstName(nameInput.value);
        console.log('📝 Nome capturado:', userFirstName);
    }

    // Remover erros anteriores
    currentQuestion.querySelectorAll('.error-message').forEach(el => el.remove());
    currentQuestion.querySelectorAll('.error').forEach(el => el.classList.remove('error'));

    const inputs = currentQuestion.querySelectorAll('input, textarea, select');

    let valid = true;
    let firstInvalidInput = null;

    inputs.forEach(input => {
        if (input.type === 'radio' || input.type === 'checkbox' || input.type === 'hidden') return;

        // Verificar campos range com duplo input
        if (input.name.includes('_min') || input.name.includes('_max')) {
            const baseName = input.name.replace(/(_min|_max)$/, '');
            const minInput = currentQuestion.querySelector(`input[name="${baseName}_min"]`);
            const maxInput = currentQuestion.querySelector(`input[name="${baseName}_max"]`);

            if (input.hasAttribute('required') && (!minInput.value || !maxInput.value)) {
                valid = false;
                if (!firstInvalidInput) firstInvalidInput = input;

                const errorContainer = input.closest('.flex')?.parentElement || input.parentElement;
                if (errorContainer && !errorContainer.querySelector('.error-message')) {
                    const errorMsg = document.createElement('div');
                    errorMsg.className = 'error-message text-red-500 text-sm mt-2';
                    errorMsg.textContent = 'Preencha ambos os valores (de e até)';
                    errorContainer.appendChild(errorMsg);
                }

                minInput.classList.add('error');
                maxInput.classList.add('error');
            }
            return;
        }

        // Verificar campos obrigatórios normais
        if (input.hasAttribute('required') && !input.value.trim()) {
            valid = false;
            if (!firstInvalidInput) firstInvalidInput = input;

            input.classList.add('error');

            const errorMsg = document.createElement('div');
            errorMsg.className = 'error-message text-red-500 text-sm mt-2';
            errorMsg.textContent = 'Este campo é obrigatório';
            input.parentElement.appendChild(errorMsg);
        }
    });

    // Verificar campos de rádio obrigatórios
    const radioGroups = {};
    currentQuestion.querySelectorAll('input[type="radio"]').forEach(radio => {
        if (radio.hasAttribute('required')) {
            if (!radioGroups[radio.name]) {
                radioGroups[radio.name] = {
                    checked: false,
                    container: radio.closest('.space-y-2, .grid')
                };
            }
            if (radio.checked) {
                radioGroups[radio.name].checked = true;
            }
        }
    });

    for (const groupName in radioGroups) {
        if (!radioGroups[groupName].checked) {
            valid = false;
            const container = radioGroups[groupName].container;
            if (container && !container.querySelector('.error-message')) {
                const errorMsg = document.createElement('div');
                errorMsg.className = 'error-message text-red-500 text-sm mt-2';
                errorMsg.textContent = 'Selecione uma opção';
                container.appendChild(errorMsg);
            }
        }
    }

    if (!valid) {
        if (firstInvalidInput) {
            firstInvalidInput.focus();
        }
        return;
    }

    // Esconder slide atual
    slides[currentSlide].style.display = 'none';

    // ==================== LÓGICA DE NAVEGAÇÃO ====================

    if (activeFlowId === null) {
        // ===== NÃO ESTAMOS EM UM FLUXO =====

        // Verificar se algum fluxo deve ser ativado
        const flowToActivate = checkFlows();

        if (flowToActivate !== null) {
            // Ativar o fluxo e ir para o primeiro campo dele
            activeFlowId = flowToActivate;
            console.log('🚀 Ativando fluxo:', flowToActivate);

            // Encontrar primeiro campo do fluxo
            for (let i = 0; i < totalSlides; i++) {
                const slideFlowId = slides[i].getAttribute('data-flow-id');
                if (slideFlowId == flowToActivate) {
                    console.log('  ➡️ Indo para primeiro campo do fluxo (índice', i + ')');
                    currentSlide = i;
                    break;
                }
            }
        } else {
            // Navegação normal - próximo slide sem flow_id
            console.log('⬆️ Navegação normal');

            let found = false;
            for (let i = currentSlide + 1; i < totalSlides; i++) {
                const slideFlowId = slides[i].getAttribute('data-flow-id');
                const isHidden = slides[i].getAttribute('data-conditionally-hidden') === 'true';

                // Próximo campo SEM flow_id e não oculto
                if ((!slideFlowId || slideFlowId === '') && !isHidden) {
                    currentSlide = i;
                    found = true;
                    break;
                }
            }

            if (!found) {
                // Não há mais campos livres, ir para o fim
                currentSlide = totalSlides;
            }
        }

    } else {
        // ===== ESTAMOS EM UM FLUXO ATIVO =====
        console.log('📂 Dentro do fluxo:', activeFlowId);

        // Procurar próximo campo do mesmo fluxo
        let foundNext = false;
        for (let i = currentSlide + 1; i < totalSlides; i++) {
            const slideFlowId = slides[i].getAttribute('data-flow-id');

            if (slideFlowId == activeFlowId) {
                console.log('  ➡️ Próximo campo do fluxo (índice', i + ')');
                currentSlide = i;
                foundNext = true;
                break;
            }
        }

        if (!foundNext) {
            // Fim do fluxo - desativar e continuar navegação normal
            console.log('🏁 Fim do fluxo', activeFlowId);
            activeFlowId = null;

            // Encontrar próximo campo livre (sem flow_id)
            let foundFree = false;
            for (let i = currentSlide + 1; i < totalSlides; i++) {
                const slideFlowId = slides[i].getAttribute('data-flow-id');
                const isHidden = slides[i].getAttribute('data-conditionally-hidden') === 'true';

                if ((!slideFlowId || slideFlowId === '') && !isHidden) {
                    console.log('  ➡️ Continuando para próximo campo livre (índice', i + ')');
                    currentSlide = i;
                    foundFree = true;
                    break;
                }
            }

            if (!foundFree) {
                // Não há mais campos livres, ir para o fim
                currentSlide = totalSlides;
            }
        }
    }

    // ==================== FIM DA LÓGICA ====================

    // Verificar se chegamos ao fim
    if (currentSlide >= totalSlides) {
        console.log('✅ Fim do formulário');
        const form = document.getElementById('formOneByOne');
        if (form) {
            form.dispatchEvent(new Event('submit'));
        }
        return;
    }

    // Adicionar ao histórico de visitados
    if (!visitedSlides.includes(currentSlide)) {
        visitedSlides.push(currentSlide);
    }

    // Mostrar próximo slide
    slides[currentSlide].style.display = 'block';
    slides[currentSlide].classList.remove('fade-in');
    void slides[currentSlide].offsetWidth;
    slides[currentSlide].classList.add('fade-in');

    // Substituir variáveis [nome] no label e description do próximo campo
    applyVariablesToSlide(slides[currentSlide]);

    const firstInput = slides[currentSlide].querySelector('input:not([type="radio"]):not([type="checkbox"]):not([type="hidden"]), textarea, select');
    if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
    }

    updateProgress();
    updateVirtualNumber();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function previousQuestion() {
    // Remover o slide atual do histórico
    if (visitedSlides.length > 1) {
        visitedSlides.pop();
    }

    // Pegar o último slide visitado (anterior)
    const previousSlideIndex = visitedSlides[visitedSlides.length - 1];

    // Se não houver slide anterior, não fazer nada
    if (previousSlideIndex === undefined) {
        return;
    }

    // Esconder slide atual
    slides[currentSlide].style.display = 'none';

    // Ir para o slide anterior do histórico
    currentSlide = previousSlideIndex;

    // Mostrar slide anterior
    slides[currentSlide].style.display = 'block';

    const firstInput = slides[currentSlide].querySelector('input:not([type="radio"]):not([type="checkbox"]):not([type="hidden"]), textarea, select');
    if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
    }

    updateProgress();
    updateVirtualNumber(); // Atualizar numeração virtual
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Enter para avançar
document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        if (currentSlide < totalSlides - 1) {
            nextQuestion();
        }
    }
});

// ==================== SUBMIT FORMULÁRIOS ====================
// One by One
if (document.getElementById('formOneByOne')) {
    document.getElementById('formOneByOne').addEventListener('submit', async function(e) {
        e.preventDefault();

        const formData = new FormData(this);
        const submitBtn = document.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Enviando...';

        try {
            const res = await fetch('/modules/forms/public/save_response.php', {
                method: 'POST',
                body: formData
            });

            const resultText = await res.text();
            let result, score = null;

            // Tentar parsear como JSON, senão usar como string (backward compatibility)
            try {
                result = JSON.parse(resultText);
                score = result.score !== undefined ? result.score : null;
            } catch (e) {
                result = resultText;
            }

            const isSuccess = (result && result.success === true) || result === 'success';

            console.log('📊 Resposta do servidor (one-by-one):', { result, score });

            if (res.ok && isSuccess) {
                slides.forEach(slide => slide.style.display = 'none');

                // Usar a função para gerar mensagem com redirecionamento
                document.querySelector('form').innerHTML = generateSuccessMessage(score);

                // Inicializar animação Lottie se existir
                setTimeout(() => initLottieSuccess(), 100);

                document.getElementById('progressBar').style.width = '100%';
            } else {
                alert('Erro ao enviar: ' + (result.message || resultText));
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Enviar <i class="fas fa-paper-plane text-sm ml-2"></i>';
            }
        } catch (error) {
            alert('Erro de conexão. Tente novamente.');
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Enviar <i class="fas fa-paper-plane text-sm ml-2"></i>';
        }
    });

    updateProgress();
    updateVirtualNumber(); // Inicializar numeração virtual no primeiro slide
}

// All at Once
if (document.getElementById('formAllAtOnce')) {
    document.getElementById('formAllAtOnce').addEventListener('submit', async function(e) {
        e.preventDefault();

        this.querySelectorAll('.error-message').forEach(el => el.remove());
        this.querySelectorAll('.error').forEach(el => el.classList.remove('error'));

        let valid = true;
        let firstInvalidField = null;

        const allInputs = this.querySelectorAll('input, textarea, select');
        allInputs.forEach(input => {
            if (input.type === 'radio' || input.type === 'checkbox' || input.type === 'hidden') return;

            // Verificar campos range com duplo input
            if (input.name.includes('_min') || input.name.includes('_max')) {
                const baseName = input.name.replace(/(_min|_max)$/, '');
                const minInput = this.querySelector(`input[name="${baseName}_min"]`);
                const maxInput = this.querySelector(`input[name="${baseName}_max"]`);

                if (input.name.endsWith('_min') && minInput && maxInput) {
                    // Se é required, verificar se ambos têm valores válidos
                    if (input.hasAttribute('required') && (!minInput.value.trim() || !maxInput.value.trim())) {
                        valid = false;
                        if (!firstInvalidField) firstInvalidField = input;
                        minInput.classList.add('error');
                        maxInput.classList.add('error');
                        const errorMsg = document.createElement('div');
                        errorMsg.className = 'error-message';
                        errorMsg.textContent = 'Este campo é obrigatório';
                        input.insertAdjacentElement('afterend', errorMsg);
                    }
                }
                return; // Já tratamos o caso especial dos campos range
            }

            if (input.hasAttribute('required') && !input.value.trim()) {
                valid = false;
                if (!firstInvalidField) firstInvalidField = input;
                input.classList.add('error');
                const errorMsg = document.createElement('div');
                errorMsg.className = 'error-message';
                errorMsg.textContent = 'Este campo é obrigatório';
                input.insertAdjacentElement('afterend', errorMsg);
            }

            if (input.type === 'email' && input.value.trim()) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(input.value.trim())) {
                    valid = false;
                    if (!firstInvalidField) firstInvalidField = input;
                    input.classList.add('error');
                    const errorMsg = document.createElement('div');
                    errorMsg.className = 'error-message';
                    errorMsg.textContent = 'Digite um e-mail válido';
                    input.insertAdjacentElement('afterend', errorMsg);
                }
            }
        });

        if (!valid) {
            if (firstInvalidField) {
                firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstInvalidField.focus();
            }
            return;
        }

        const formData = new FormData(this);
        const submitBtn = this.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Enviando...';

        try {
            const res = await fetch('/modules/forms/public/save_response.php', {
                method: 'POST',
                body: formData
            });

            const resultText = await res.text();
            let result, score = null;

            // Tentar parsear como JSON, senão usar como string (backward compatibility)
            try {
                result = JSON.parse(resultText);
                score = result.score !== undefined ? result.score : null;
            } catch (e) {
                result = resultText;
            }

            const isSuccess = (result && result.success === true) || result === 'success';

            console.log('📊 Resposta do servidor (all-at-once):', { result, score });

            if (res.ok && isSuccess) {
                window.scrollTo({ top: 0, behavior: 'smooth' });

                // Usar a função para gerar mensagem com redirecionamento
                this.parentElement.innerHTML = `<div class="py-20">${generateSuccessMessage(score)}</div>`;

                // Inicializar animação Lottie se existir
                setTimeout(() => initLottieSuccess(), 100);
            } else {
                alert('Erro ao enviar: ' + (result.message || resultText));
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Enviar respostas <i class="fas fa-paper-plane ml-2"></i>';
            }
        } catch (error) {
            alert('Erro de conexão. Tente novamente.');
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Enviar respostas <i class="fas fa-paper-plane ml-2"></i>';
        }
    });
}

// ==================== LÓGICA CONDICIONAL ====================

// Mapa para armazenar valores dos campos
const fieldValues = {};

// Função para obter o valor de um campo por ID
function getFieldValue(fieldId) {
    // Buscar o campo no DOM
    const fieldName = `field_${fieldId}`;

    // Tentar input/textarea/select direto
    let field = document.querySelector(`[name="${fieldName}"]`);

    // Se não encontrou, pode ser radio/checkbox (múltiplos elementos)
    if (!field) {
        const checkedField = document.querySelector(`[name="${fieldName}"]:checked`);
        if (checkedField) {
            return checkedField.value;
        }

        // Verificar checkboxes múltiplos
        const checkboxes = document.querySelectorAll(`[name="${fieldName}"]:checked`);
        if (checkboxes.length > 0) {
            return Array.from(checkboxes).map(cb => cb.value).join(', ');
        }

        return '';
    }

    return field.value || '';
}

// Avaliar uma condição individual
function evaluateCondition(condition) {
    const fieldValue = getFieldValue(condition.field_id);
    const conditionValue = condition.value || '';
    const operator = condition.operator;

    switch(operator) {
        case 'equals':
            return fieldValue.toString().toLowerCase() === conditionValue.toString().toLowerCase();

        case 'not_equals':
            return fieldValue.toString().toLowerCase() !== conditionValue.toString().toLowerCase();

        case 'contains':
            return fieldValue.toString().toLowerCase().includes(conditionValue.toString().toLowerCase());

        case 'not_contains':
            return !fieldValue.toString().toLowerCase().includes(conditionValue.toString().toLowerCase());

        case 'is_empty':
            return !fieldValue || fieldValue.toString().trim() === '';

        case 'not_empty':
            return fieldValue && fieldValue.toString().trim() !== '';

        case 'greater_than':
            const numValue1 = parseFloat(fieldValue);
            const numCondition1 = parseFloat(conditionValue);
            return !isNaN(numValue1) && !isNaN(numCondition1) && numValue1 > numCondition1;

        case 'less_than':
            const numValue2 = parseFloat(fieldValue);
            const numCondition2 = parseFloat(conditionValue);
            return !isNaN(numValue2) && !isNaN(numCondition2) && numValue2 < numCondition2;

        default:
            return false;
    }
}

// Avaliar lógica condicional de um campo
function evaluateFieldLogic(conditionalLogic) {
    if (!conditionalLogic || !conditionalLogic.enabled || !conditionalLogic.conditions) {
        return true; // Sem condições = sempre mostrar
    }

    const conditions = conditionalLogic.conditions;
    const logicType = conditionalLogic.logic_type || 'all';

    if (conditions.length === 0) {
        return true;
    }

    if (logicType === 'all') {
        // AND: todas as condições devem ser verdadeiras
        return conditions.every(condition => evaluateCondition(condition));
    } else {
        // OR: pelo menos uma condição deve ser verdadeira
        return conditions.some(condition => evaluateCondition(condition));
    }
}

// Atualizar visibilidade de todos os campos baseado em condições
function updateConditionalFields() {
    // Modo One-by-One
    const oneByOneSlides = document.querySelectorAll('#formOneByOne .question-slide');
    oneByOneSlides.forEach(slide => {
        const conditionalLogicStr = slide.getAttribute('data-conditional-logic');

        if (conditionalLogicStr && conditionalLogicStr.trim() !== '') {
            try {
                const conditionalLogic = JSON.parse(conditionalLogicStr);
                const shouldShow = evaluateFieldLogic(conditionalLogic);

                // Marcar como condicionalmente oculto
                if (!shouldShow) {
                    slide.setAttribute('data-conditionally-hidden', 'true');
                    slide.style.display = 'none';
                } else {
                    slide.removeAttribute('data-conditionally-hidden');
                    // Não força display aqui, deixa a navegação controlar
                }
            } catch (e) {
                console.error('Erro ao parsear lógica condicional:', e);
            }
        }
    });

    // Modo All-at-Once
    const allAtOnceFields = document.querySelectorAll('#formAllAtOnce .field-container');
    allAtOnceFields.forEach(field => {
        const conditionalLogicStr = field.getAttribute('data-conditional-logic');

        if (conditionalLogicStr && conditionalLogicStr.trim() !== '') {
            try {
                const conditionalLogic = JSON.parse(conditionalLogicStr);
                const shouldShow = evaluateFieldLogic(conditionalLogic);

                if (!shouldShow) {
                    field.style.display = 'none';
                    field.setAttribute('data-conditionally-hidden', 'true');

                    // Desabilitar campos dentro para não serem enviados
                    field.querySelectorAll('input, textarea, select').forEach(input => {
                        input.setAttribute('data-was-required', input.required);
                        input.required = false;
                        input.disabled = true;
                    });
                } else {
                    field.style.display = 'block';
                    field.removeAttribute('data-conditionally-hidden');

                    // Re-habilitar campos
                    field.querySelectorAll('input, textarea, select').forEach(input => {
                        input.disabled = false;
                        if (input.getAttribute('data-was-required') === 'true') {
                            input.required = true;
                        }
                    });
                }
            } catch (e) {
                console.error('Erro ao parsear lógica condicional:', e);
            }
        }
    });
}

// Adicionar listeners para atualizar quando campos mudarem
document.addEventListener('DOMContentLoaded', function() {
    // Avaliar condições inicialmente
    setTimeout(() => {
        updateConditionalFields();
    }, 100);

    // Listener para todos os inputs
    document.addEventListener('change', function(e) {
        if (e.target.matches('input, textarea, select')) {
            updateConditionalFields();
        }
    });

    // Listener para inputs de texto (keyup para atualizar em tempo real)
    document.addEventListener('keyup', function(e) {
        if (e.target.matches('input[type="text"], input[type="email"], input[type="url"], input[type="number"], textarea')) {
            updateConditionalFields();
        }
    });
});

// ============================================
// AUTO-SAVE DE RESPOSTAS PARCIAIS (PRO FEATURE)
// ============================================

let autoSaveTimeout = null;
let lastSavedData = null;

/**
 * Coleta todas as respostas atuais do formulário
 */
function collectCurrentAnswers() {
    const formOneByOne = document.getElementById('formOneByOne');
    const formAllAtOnce = document.getElementById('formAllAtOnce');
    const form = formOneByOne || formAllAtOnce;

    if (!form) return {};

    const formData = new FormData(form);
    const answers = {};
    let lastFieldId = null;

    for (const [key, value] of formData.entries()) {
        if (key === 'form_id') continue;

        // Extrair field_id do nome do campo (formato: field_123)
        const match = key.match(/field_(\d+)/);
        if (match) {
            const fieldId = match[1];
            lastFieldId = fieldId;

            if (!answers[key]) {
                answers[key] = value;
            } else if (Array.isArray(answers[key])) {
                answers[key].push(value);
            } else {
                answers[key] = [answers[key], value];
            }
        }
    }

    return { answers, lastFieldId };
}

/**
 * Calcula o progresso atual (percentual de campos preenchidos)
 */
function calculateProgress() {
    const { answers } = collectCurrentAnswers();
    const totalFields = document.querySelectorAll('[data-field-id]').length;

    if (totalFields === 0) return 0;

    const answeredFields = Object.keys(answers).length;
    return Math.round((answeredFields / totalFields) * 100);
}

/**
 * Salva respostas parciais no servidor
 */
async function savePartialResponse() {
    try {
        const { answers, lastFieldId } = collectCurrentAnswers();
        const progress = calculateProgress();

        // Não salvar se não houver respostas
        if (Object.keys(answers).length === 0) {
            return;
        }

        // Verificar se os dados mudaram desde o último salvamento
        const currentData = JSON.stringify(answers);
        if (currentData === lastSavedData) {
            return; // Nada mudou, não precisa salvar
        }

        const formElement = document.getElementById('formOneByOne') || document.getElementById('formAllAtOnce');
        const formId = formElement ? formElement.querySelector('input[name="form_id"]').value : null;

        if (!formId) return;

        const response = await fetch('/modules/forms/public/save_partial.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                form_id: formId,
                answers: answers,
                progress: progress,
                last_field_id: lastFieldId
            })
        });

        if (response.ok) {
            lastSavedData = currentData;
            console.log('✓ Progresso salvo automaticamente');
        }
    } catch (error) {
        console.error('Erro ao salvar progresso:', error);
    }
}

/**
 * Agenda salvamento automático com debounce
 */
function scheduleAutoSave() {
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(() => {
        savePartialResponse();
    }, 2000); // Aguarda 2 segundos após última interação
}

// Adicionar listeners para auto-save
document.addEventListener('DOMContentLoaded', function() {
    // Salvar quando campos mudarem
    document.addEventListener('change', function(e) {
        if (e.target.matches('input, textarea, select')) {
            scheduleAutoSave();
        }
    });

    // Salvar quando usuário digitar (com debounce)
    document.addEventListener('input', function(e) {
        if (e.target.matches('input, textarea')) {
            scheduleAutoSave();
        }
    });

    // Salvar quando avançar pergunta (modo one-by-one)
    const originalNextQuestion = window.nextQuestion;
    if (typeof originalNextQuestion === 'function') {
        window.nextQuestion = function() {
            savePartialResponse(); // Salva imediatamente ao avançar
            originalNextQuestion.apply(this, arguments);
        };
    }

    // Salvar antes de fechar/sair da página
    window.addEventListener('beforeunload', function() {
        savePartialResponse();
    });

    // ============================================
    // LISTENER PARA VARIÁVEIS DINÂMICAS
    // ============================================
    // Capturar nome e substituir variáveis em tempo real (modo all-at-once)
    document.addEventListener('input', function(e) {
        if (e.target.matches('input[data-field-type="name"]')) {
            const fullName = e.target.value;
            userFirstName = extractFirstName(fullName);

            // Aplicar substituição em todos os campos do formulário
            const formAllAtOnce = document.getElementById('formAllAtOnce');
            if (formAllAtOnce) {
                const allFields = formAllAtOnce.querySelectorAll('.field-container');
                allFields.forEach(field => {
                    applyVariablesToField(field);
                });
            }
        }
    });
});

// Função auxiliar para substituir variáveis em um campo específico
function applyVariablesToField(field) {
    if (!userFirstName) return;

    // Substituir no label (h2, h3)
    const labels = field.querySelectorAll('h2, h3, label');
    labels.forEach(label => {
        const originalText = label.getAttribute('data-original-text') || label.textContent;
        if (!label.getAttribute('data-original-text')) {
            label.setAttribute('data-original-text', originalText);
        }
        if (originalText.includes('[nome]')) {
            label.textContent = replaceVariables(originalText);
        }
    });

    // Substituir nas descriptions (p)
    const descriptions = field.querySelectorAll('p');
    descriptions.forEach(desc => {
        const originalText = desc.getAttribute('data-original-text') || desc.textContent;
        if (!desc.getAttribute('data-original-text')) {
            desc.setAttribute('data-original-text', originalText);
        }
        if (originalText.includes('[nome]')) {
            desc.textContent = replaceVariables(originalText);
        }
    });
}