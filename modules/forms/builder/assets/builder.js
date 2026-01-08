// ============================================
// VARIÁVEIS GLOBAIS DE REDIRECIONAMENTO
// ============================================

// Função para copiar URL do formulário
function copyFormUrl() {
    const urlInput = document.getElementById('formUrl');
    const url = urlInput.value;

    // Tentar usar clipboard API moderno (sem selecionar texto)
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(url).then(() => {
            showCopySuccess();
        }).catch(() => {
            // Fallback para método antigo
            fallbackCopy(urlInput);
        });
    } else {
        // Fallback para método antigo
        fallbackCopy(urlInput);
    }
}

// Fallback de copiar (funciona em HTTP)
function fallbackCopy(input) {
    try {
        input.select();
        input.setSelectionRange(0, 99999);
        document.execCommand('copy');
        // Desselecionar após copiar
        window.getSelection().removeAllRanges();
        input.blur();
        showCopySuccess();
    } catch (err) {
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'error',
            title: 'Erro ao copiar',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            backdrop: false
        });
    }
}

// Feedback visual de sucesso com Toast simples
function showCopySuccess() {
    // Criar toast personalizado sem backdrop
    const toast = document.createElement('div');
    toast.innerHTML = `
        <div style="position: fixed; top: 20px; right: 20px; z-index: 99999; background: #10b981; color: white; padding: 12px 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); display: flex; align-items: center; gap: 10px; font-size: 14px; font-weight: 500; animation: slideIn 0.3s ease;">
            <svg style="width: 20px; height: 20px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            URL copiada!
        </div>
    `;

    document.body.appendChild(toast);

    // Remover após 2 segundos
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// Adicionar animações CSS
if (!document.getElementById('toast-animations')) {
    const style = document.createElement('style');
    style.id = 'toast-animations';
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(400px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(400px); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

// Mostrar/ocultar campo de opções baseado no tipo
document.getElementById('fieldType').addEventListener('change', function() {
    const optionsContainer = document.getElementById('optionsContainer');
    const dynamicFieldConfig = document.getElementById('dynamicFieldConfig');

    // Esconder todos primeiro
    optionsContainer.style.display = 'none';
    dynamicFieldConfig.innerHTML = ''; // Limpar configurações dinâmicas

    // Carregar configurações dinâmicas do backend
    loadFieldConfig(this.value);

    const needsOptions = ['radio', 'select'].includes(this.value);

    if (needsOptions) {
        optionsContainer.style.display = 'block';
    }
});

// Função para carregar configurações dinâmicas de campos
function loadFieldConfig(fieldType) {
    // Para cada tipo de campo, carregamos configurações específicas
    const dynamicConfigContainer = document.getElementById('dynamicFieldConfig');

    // Limpar configurações anteriores
    dynamicConfigContainer.innerHTML = '';

    console.log('Carregando configuração para tipo:', fieldType);

    // Fazer uma requisição para obter o template de configuração
    fetch('/modules/forms/builder/get_config_template.php?type=' + fieldType)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao carregar template');
            }
            return response.text();
        })
        .then(template => {
            console.log('Template recebido para', fieldType, ':', template.substring(0, 100));
            if (template.trim() !== '') {
                dynamicConfigContainer.innerHTML = template;

                // Esconder botão de mídia para VSL (pois usa campo de URL próprio)
                const mediaBtn = document.getElementById('mediaBtn');
                if (fieldType === 'vsl' && mediaBtn) {
                    mediaBtn.style.display = 'none';
                } else if (mediaBtn) {
                    mediaBtn.style.display = 'block';
                }

                // Exibir os containers específicos após carregar o template
                switch(fieldType) {
                    case 'radio':
                        const multipleContainer = document.getElementById('multipleAnswersContainer');
                        if(multipleContainer) multipleContainer.style.display = 'block';
                        break;
                    case 'slider':
                        const sliderConfig = document.getElementById('sliderConfig');
                        if(sliderConfig) sliderConfig.style.display = 'block';

                        // ADICIONAR LISTENER PARA O CHECKBOX DE INTERVALO
                        const allowRangeCheckbox = document.getElementById('sliderAllowRange');
                        if(allowRangeCheckbox) {
                            allowRangeCheckbox.addEventListener('change', function() {
                                console.log('Intervalo ativo:', this.checked);
                            });
                        }
                        break;
                    case 'rating':
                        const ratingConfig = document.getElementById('ratingConfig');
                        if(ratingConfig) ratingConfig.style.display = 'block';
                        break;
                    case 'date':
                        console.log('Configurando campo de data');
                        const dateConfig = document.getElementById('dateConfig');
                        console.log('dateConfig elemento:', dateConfig);
                        if(dateConfig) {
                            dateConfig.style.display = 'block';
                            console.log('dateConfig exibido com sucesso');
                        }
                        break;
                    case 'file':
                        const fileConfig = document.getElementById('fileConfig');
                        if(fileConfig) fileConfig.style.display = 'block';
                        break;
                    case 'terms':
                        const termsConfig = document.getElementById('termsConfig');
                        if(termsConfig) termsConfig.style.display = 'block';
                        break;
                    case 'image_choice':
                        const imageChoiceConfig = document.getElementById('imageChoiceContainer');
                        if(imageChoiceConfig) imageChoiceConfig.style.display = 'block';
                        break;
                    case 'rg':
                        const rgConfig = document.getElementById('rgConfig');
                        if(rgConfig) rgConfig.style.display = 'block';
                        break;
                    case 'vsl':
                        const vslConfig = document.getElementById('vslConfig');
                        if(vslConfig) vslConfig.style.display = 'block';
                        break;
                }
            }

            // Mostrar seção de lógica condicional (exceto para welcome e terms)
            const showConditionalLogic = !['welcome', 'terms'].includes(fieldType);
            const conditionalSection = document.getElementById('conditionalLogicSection');
            if (showConditionalLogic) {
                conditionalSection.style.display = 'block';
            } else {
                conditionalSection.style.display = 'none';
            }
        })
        .catch(error => {
            console.error('Erro ao carregar template de configuração:', error);
        });
}

// Alternar modo de Terms
document.getElementById('termsMode')?.addEventListener('change', function() {
    document.querySelectorAll('.terms-mode-content').forEach(el => el.style.display = 'none');

    if (this.value === 'inline') {
        document.getElementById('termsInlineContent').style.display = 'block';
    } else if (this.value === 'pdf') {
        document.getElementById('termsPdfContent').style.display = 'block';
    } else if (this.value === 'link') {
        document.getElementById('termsLinkContent').style.display = 'block';
    }
});

// Inicializar Sortable para drag and drop
const fieldsList = document.getElementById('fieldsList');
if (fieldsList) {
    new Sortable(fieldsList, {
        animation: 150,
        group: 'shared-fields', // Permitir compartilhamento com flow containers
        handle: '.field-item, .flow-header', // Apenas header do fluxo é draggable
        draggable: '.field-item, .flow-divider-card', // Define quais elementos podem ser arrastados
        ghostClass: 'opacity-50',
        filter: function(evt, target) {
            // Bloquear mensagem de sucesso
            if (target.id === 'successMessageCard') {
                return true;
            }

            // Bloquear campos do tipo welcome
            if (target.dataset.fieldType === 'welcome') {
                return true;
            }

            return false; // Permitir drag
        },
        onEnd: async function(evt) {
            document.getElementById('emptyState')?.remove();

            // Verificar se o campo foi solto em um flow container
            const toContainer = evt.to;
            const item = evt.item;
            const fieldId = item.dataset.fieldId;

            if (toContainer.classList.contains('flow-fields-container')) {
                // Campo foi arrastado para dentro de um fluxo
                const flowId = toContainer.dataset.flowId;
                console.log(`📥 Campo ${fieldId} arrastado para fluxo ${flowId}`);
                await updateFieldFlow(fieldId, flowId);
            } else if (evt.from.classList.contains('flow-fields-container')) {
                // Campo foi removido de um fluxo
                console.log(`📤 Campo ${fieldId} removido do fluxo`);
                await updateFieldFlow(fieldId, null);
            }

            // Auto-save ao arrastar
            saveFieldsOrder();
        }
    });

    // Inicializar Sortable para cada flow container
    document.querySelectorAll('.flow-fields-container').forEach(container => {
        new Sortable(container, {
            animation: 150,
            group: 'shared-fields', // Mesmo grupo para permitir transferência
            handle: '.field-item',
            ghostClass: 'opacity-50',
            onEnd: async function(evt) {
                const toContainer = evt.to;
                const fromContainer = evt.from;
                const item = evt.item;
                const fieldId = item.dataset.fieldId;

                if (toContainer.classList.contains('flow-fields-container')) {
                    const flowId = toContainer.dataset.flowId;
                    console.log(`📥 Campo ${fieldId} arrastado para fluxo ${flowId}`);
                    await updateFieldFlow(fieldId, flowId);
                } else {
                    // Removido do fluxo
                    console.log(`📤 Campo ${fieldId} removido do fluxo`);
                    await updateFieldFlow(fieldId, null);
                }

                // Atualizar estado vazio dos containers
                updateFlowEmptyStates();
                saveFieldsOrder();
            }
        });
    });
}

// Função para atualizar o flow_id de um campo
async function updateFieldFlow(fieldId, flowId) {
    try {
        const formData = new FormData();
        formData.append('field_id', fieldId);
        formData.append('flow_id', flowId || '');

        const response = await fetch('/modules/forms/builder/update_field_flow.php', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Erro ao atualizar campo');
        }

        console.log('✅ Flow ID atualizado:', data.message);
    } catch (error) {
        console.error('❌ Erro ao atualizar flow ID:', error);
        Swal.fire({
            title: 'Erro!',
            text: error.message,
            icon: 'error'
        });
        // Recarregar página para reverter mudança visual
        location.reload();
    }
}

// Atualizar estados vazios dos flow containers
function updateFlowEmptyStates() {
    document.querySelectorAll('.flow-fields-container').forEach(container => {
        const emptyState = container.querySelector('.flow-empty-state');
        const hasFields = container.querySelectorAll('.field-item').length > 0;

        if (emptyState) {
            emptyState.style.display = hasFields ? 'none' : 'block';
        }
    });
}

// Adicionar/Editar campo
document.getElementById('fieldForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const fieldId = document.getElementById('fieldId').value;
    
    // ============================================
    // VERIFICAR SE É MENSAGEM DE SUCESSO
    // ============================================
    if (fieldId === 'success_message') {
        const title = document.getElementById('fieldLabel').value.trim();
        const description = document.getElementById('fieldDescription').value.trim();
        
        if (!title) {
            Swal.fire({
                title: 'Atenção!',
                text: 'O título da mensagem é obrigatório.',
                icon: 'warning'
            });
            return;
        }
        
        // Salvar mensagem de sucesso
        await updateSuccessMessage(title, description);
        return;
    }

    // ============================================
    // LÓGICA ORIGINAL PARA CAMPOS NORMAIS
    // ============================================
    const formData = new FormData(this);

    // Adicionar lógica condicional ao formData
    const conditionalLogic = getConditionalLogicData();
    if (conditionalLogic) {
        formData.append('conditional_logic', JSON.stringify(conditionalLogic));
    }

    // Adicionar pontuação se modo scoring estiver ativo
    const fieldType = document.getElementById('fieldType').value;
    if (fieldType === 'radio') {
        const enableScoring = document.getElementById('enableScoring');
        if (enableScoring && enableScoring.checked) {
            const scoringOptions = getScoringOptions();
            // Converter para formato JSON e adicionar como options
            formData.set('options', JSON.stringify(scoringOptions));
            formData.append('scoring_enabled', '1');
        }
    }

    // Adicionar opções de image_choice
    if (fieldType === 'image_choice') {
        const imageChoiceOptions = getImageChoiceOptions();
        formData.set('options', JSON.stringify(imageChoiceOptions));
    }

    try {
        const res = await fetch('/modules/forms/builder/save_field.php', {
            method: 'POST',
            body: formData
        });

        const result = await res.text();

        if (res.ok && result.startsWith('success')) {
            window.location.reload();
        } else {
            Swal.fire({
                title: 'Erro!',
                text: 'Erro ao salvar campo: ' + result,
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
});

// ============================================
// FUNÇÃO PARA EDITAR MENSAGEM DE SUCESSO
// ============================================
function editSuccessMessage() {
    // Mudar título do painel
    document.getElementById('formTitle').textContent = 'Editar Mensagem de Sucesso';
    
    // Preencher campos com os valores atuais
    document.getElementById('fieldLabel').value = document.getElementById('successMessageTitle').textContent;
    document.getElementById('fieldDescription').value = document.getElementById('successMessageDescription').textContent;

    // Limpar campos que não se aplicam
    document.getElementById('fieldRequired').checked = false;
    document.getElementById('fieldMedia').value = '';

    // ============================================
    // ESCONDER CAMPOS DESNECESSÁRIOS
    // ============================================
    document.getElementById('fieldTypeContainer').style.display = 'none';
    document.getElementById('fieldRequiredContainer').style.display = 'none';
    document.getElementById('mediaBtn').style.display = 'block'; // Mostrar botão de mídia
    document.getElementById('optionsContainer').style.display = 'none';

    // Carregar mídia da mensagem de sucesso se existir
    const successMedia = currentSuccessMessageMedia || '';
    if (successMedia) {
        document.getElementById('mediaBtnText').textContent = 'Editar mídia';
        document.getElementById('fieldMedia').value = successMedia;
    } else {
        document.getElementById('mediaBtnText').textContent = 'Inserir mídia';
        document.getElementById('fieldMedia').value = '';
    }

    // ============================================
    // ADICIONAR CAMPOS DE REDIRECIONAMENTO
    // ============================================
    const isProUser = IS_PRO_USER;
    window.userPlan = USER_PLAN;
    // Usar variáveis globais que são atualizadas após salvar
    const redirectEnabled = currentRedirectEnabled;
    const redirectUrl = currentRedirectUrl;
    const redirectType = currentRedirectType;
    const redirectButtonText = currentRedirectButtonText;
    const hideBranding = currentHideBranding;
    const showScore = currentShowScore;
    const offerModeEnabled = currentOfferModeEnabled || false;

    document.getElementById('dynamicFieldConfig').innerHTML = `
        <div class="space-y-4 mt-4 pt-4 border-t border-gray-200 dark:border-zinc-700">

            <!-- Remover Marca Formtalk -->
            <div class="space-y-3">
                <h3 class="text-sm font-medium text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                    <i class="fas fa-tag"></i>
                    Marca Formtalk
                    ${!isProUser ? '<span class="text-xs bg-gradient-to-r from-purple-600 to-pink-600 text-white px-2 py-1 rounded-full font-semibold">✨ PRO</span>' : ''}
                </h3>

                <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-700/50 rounded-lg ${!isProUser ? 'opacity-50 cursor-not-allowed' : ''}">
                    <div class="flex-1">
                        <label class="text-sm font-medium text-gray-700 dark:text-zinc-300">Remover marca Formtalk</label>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" id="hideBrandingToggle" ${!isProUser ? 'disabled' : ''} ${hideBranding ? 'checked' : ''}
                               class="sr-only peer">
                        <div class="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#4EA44B]-300 dark:peer-focus:ring-[#4EA44B]-800 rounded-full peer dark:bg-zinc-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-[#4EA44B]"></div>
                    </label>
                </div>
            </div>

            <!-- Redirecionamento -->
            <h3 class="text-sm font-medium text-gray-900 dark:text-zinc-100 flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-zinc-700">
                <i class="fas fa-external-link-alt"></i>
                Redirecionamento
                ${!isProUser ? '<span class="text-xs bg-gradient-to-r from-purple-600 to-pink-600 text-white px-2 py-1 rounded-full font-semibold">✨ PRO</span>' : ''}
            </h3>

            <!-- Switcher Ativar Redirecionamento -->
            <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-700/50 rounded-lg ${!isProUser ? 'opacity-50 cursor-not-allowed' : ''}">
                <div class="flex-1">
                    <label class="text-sm font-medium text-gray-700 dark:text-zinc-300">Redirecionar usuário após envio</label>
                    <p class="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Envie o usuário para outra página automaticamente</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" id="redirectEnabled" ${!isProUser ? 'disabled' : ''} ${redirectEnabled ? 'checked' : ''}
                           onchange="toggleRedirectFields(this.checked)"
                           class="sr-only peer">
                    <div class="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#4EA44B]-300 dark:peer-focus:ring-[#4EA44B]-800 rounded-full peer dark:bg-zinc-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-[#4EA44B]"></div>
                </label>
            </div>

            <!-- Campos de Redirecionamento (visíveis apenas se ativado) -->
            <div id="redirectFieldsContainer" style="display: ${redirectEnabled ? 'block' : 'none'};" class="space-y-3">

                <!-- URL de Destino -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">
                        <i class="fas fa-link mr-1"></i> URL de destino
                    </label>
                    <input type="url"
                           id="redirectUrl"
                           placeholder="https://exemplo.com/obrigado"
                           value="${redirectUrl || ''}"
                           class="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4EA44B] dark:bg-zinc-700 dark:text-zinc-100">
                    <p class="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                        <i class="fas fa-info-circle"></i> Digite a URL completa (começando com http:// ou https://)
                    </p>
                </div>

                <!-- Tipo de Redirecionamento -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                        <i class="fas fa-mouse-pointer mr-1"></i> Tipo de redirecionamento
                    </label>
                    <div class="space-y-2">
                        <label class="flex items-center p-3 border border-gray-300 dark:border-zinc-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-700/50 transition-colors">
                            <input type="radio"
                                   name="redirectType"
                                   value="automatic"
                                   ${redirectType === 'automatic' ? 'checked' : ''}
                                   onchange="toggleButtonTextField(false)"
                                   class="w-4 h-4 text-[#4EA44B] focus:ring-[#4EA44B]">
                            <div class="ml-3 flex-1">
                                <div class="text-sm font-medium text-gray-900 dark:text-zinc-100">Automático</div>
                                <div class="text-xs text-gray-500 dark:text-zinc-400">Redireciona imediatamente após o envio</div>
                            </div>
                            <i class="fas fa-bolt text-yellow-500"></i>
                        </label>

                        <label class="flex items-center p-3 border border-gray-300 dark:border-zinc-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-700/50 transition-colors">
                            <input type="radio"
                                   name="redirectType"
                                   value="button"
                                   ${redirectType === 'button' ? 'checked' : ''}
                                   onchange="toggleButtonTextField(true)"
                                   class="w-4 h-4 text-[#4EA44B] focus:ring-[#4EA44B]">
                            <div class="ml-3 flex-1">
                                <div class="text-sm font-medium text-gray-900 dark:text-zinc-100">Via Botão</div>
                                <div class="text-xs text-gray-500 dark:text-zinc-400">Exibe botão com link na mensagem de sucesso</div>
                            </div>
                            <i class="fas fa-hand-pointer text-indigo-500"></i>
                        </label>
                    </div>
                </div>

                <!-- Texto do Botão (visível apenas se tipo = button) -->
                <div id="buttonTextContainer" style="display: ${redirectType === 'button' ? 'block' : 'none'};">
                    <label class="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">
                        <i class="fas fa-font mr-1"></i> Texto do botão
                    </label>
                    <input type="text"
                           id="redirectButtonText"
                           placeholder="Continuar"
                           value="${redirectButtonText}"
                           maxlength="50"
                           class="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4EA44B] dark:bg-zinc-700 dark:text-zinc-100">
                    <p class="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                        O botão usará as cores personalizadas do seu formulário
                    </p>
                </div>

            </div>

            <!-- Exibir Pontuação -->
            <h3 class="text-sm font-medium text-gray-900 dark:text-zinc-100 flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-zinc-700">
                <i class="fas fa-trophy"></i>
                Exibir Pontuação
            </h3>

            <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-700/50 rounded-lg">
                <div class="flex-1">
                    <label class="text-sm font-medium text-gray-700 dark:text-zinc-300">Mostrar pontuação final</label>
                    <p class="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Exibe a pontuação no lugar do símbolo de check</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" id="showScore" ${showScore ? 'checked' : ''}
                           class="sr-only peer">
                    <div class="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-500 rounded-full peer dark:bg-zinc-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-green-500 dark:peer-checked:bg-green-500"></div>
                </label>
            </div>

            <!-- Modo Oferta -->
            <h3 class="text-sm font-medium text-gray-900 dark:text-zinc-100 flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-zinc-700">
                <i class="fas fa-spinner-third"></i>
                Animação de Loading
                ${!isProUser ? '<span class="text-xs bg-gradient-to-r from-purple-600 to-pink-600 text-white px-2 py-1 rounded-full font-semibold">✨ PRO</span>' : ''}
            </h3>

            <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-700/50 rounded-lg ${!isProUser ? 'opacity-50 cursor-not-allowed' : ''}">
                <div class="flex-1">
                    <label class="text-sm font-medium text-gray-700 dark:text-zinc-300">Exibir loading antes da mensagem de sucesso</label>
                    <p class="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Mostra animação de loading antes de exibir a mensagem de sucesso</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" id="offerModeEnabled" ${!isProUser ? 'disabled' : ''} ${offerModeEnabled ? 'checked' : ''}
                           class="sr-only peer">
                    <div class="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer dark:bg-zinc-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-purple-500 dark:peer-checked:bg-purple-500"></div>
                </label>
            </div>

        </div>
    `;

    // ============================================
    // FUNÇÕES AUXILIARES PARA TOGGLE
    // ============================================
    window.toggleRedirectFields = function(enabled) {
        document.getElementById('redirectFieldsContainer').style.display = enabled ? 'block' : 'none';
    };

    window.toggleButtonTextField = function(showButton) {
        document.getElementById('buttonTextContainer').style.display = showButton ? 'block' : 'none';
    };
    
    // ============================================
    // AJUSTAR LABELS PARA CONTEXTO DE MENSAGEM
    // ============================================
    document.getElementById('fieldLabelLabel').textContent = 'Título da mensagem *';
    document.getElementById('fieldDescriptionLabel').textContent = 'Texto da mensagem';
    document.getElementById('fieldDescription').placeholder = 'Digite a mensagem que aparecerá quando o formulário for enviado...';
    document.getElementById('fieldDescriptionHint').textContent = 'Esta mensagem será exibida após o envio bem-sucedido';
    
    // Remover required do tipo (já que está escondido)
    document.getElementById('fieldType').removeAttribute('required');
    
    // ============================================
    // MARCAR COMO EDIÇÃO DE MENSAGEM DE SUCESSO
    // ============================================
    document.getElementById('fieldId').value = 'success_message';
    document.getElementById('btnText').textContent = 'Atualizar mensagem';
    document.getElementById('btnCancel').style.display = 'block';
    
    // Scroll suave até o formulário
    document.getElementById('fieldForm').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ============================================
// FUNÇÃO PARA SALVAR MENSAGEM DE SUCESSO
// ============================================
async function updateSuccessMessage(title, description) {
    const formData = new FormData();
    formData.append('form_id', FORM_ID);
    formData.append('success_message_title', title);
    formData.append('success_message_description', description);

    // Adicionar mídia da mensagem de sucesso
    const mediaEl = document.getElementById('fieldMedia');
    if (mediaEl) {
        formData.append('success_message_media', mediaEl.value || '');
    }

    // Adicionar campos de redirecionamento
    const redirectEnabledEl = document.getElementById('redirectEnabled');
    const redirectUrlEl = document.getElementById('redirectUrl');
    const redirectButtonTextEl = document.getElementById('redirectButtonText');
    const redirectTypeEl = document.querySelector('input[name="redirectType"]:checked');

    if (redirectEnabledEl) {
        formData.append('success_redirect_enabled', redirectEnabledEl.checked ? 1 : 0);
        formData.append('success_redirect_url', redirectUrlEl ? redirectUrlEl.value : '');
        formData.append('success_redirect_type', redirectTypeEl ? redirectTypeEl.value : 'automatic');
        formData.append('success_bt_redirect', redirectButtonTextEl ? redirectButtonTextEl.value : 'Continuar');
    }

    // Adicionar campo de remoção de marca
    const hideBrandingEl = document.getElementById('hideBrandingToggle');
    if (hideBrandingEl) {
        formData.append('hide_formtalk_branding', hideBrandingEl.checked ? 1 : 0);
    }

    // Adicionar campo de exibir pontuação
    const showScoreEl = document.getElementById('showScore');
    if (showScoreEl) {
        formData.append('show_score', showScoreEl.checked ? 1 : 0);
    }

    // Adicionar campo do modo loading
    const offerModeEnabledEl = document.getElementById('offerModeEnabled');
    if (offerModeEnabledEl) {
        formData.append('offer_mode_enabled', offerModeEnabledEl.checked ? 1 : 0);
    }

    try {
        const res = await fetch('/modules/forms/customization/save_success_message.php', {
            method: 'POST',
            body: formData
        });

        const result = await res.text();

        if (res.ok && result === 'success') {
            // Atualizar o card na página
            document.getElementById('successMessageTitle').textContent = title;
            document.getElementById('successMessageDescription').textContent = description;

            // Atualizar variáveis globais com os novos valores
            if (mediaEl) {
                currentSuccessMessageMedia = mediaEl.value || '';
            }
            if (redirectEnabledEl) {
                currentRedirectEnabled = redirectEnabledEl.checked ? 1 : 0;
                currentRedirectUrl = redirectUrlEl ? redirectUrlEl.value : '';
                currentRedirectType = redirectTypeEl ? redirectTypeEl.value : 'automatic';
                currentRedirectButtonText = redirectButtonTextEl ? redirectButtonTextEl.value : 'Continuar';
            }
            if (hideBrandingEl) {
                currentHideBranding = hideBrandingEl.checked ? 1 : 0;
            }
            if (showScoreEl) {
                currentShowScore = showScoreEl.checked ? 1 : 0;
            }
            if (offerModeEnabledEl) {
                currentOfferModeEnabled = offerModeEnabledEl.checked ? 1 : 0;
            }

            // Resetar o formulário
            cancelEdit();

            // Mostrar mensagem de sucesso
            Swal.fire({
                title: 'Sucesso!',
                text: 'Mensagem de sucesso e redirecionamento atualizados!',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });
        } else {
            Swal.fire({
                title: 'Erro!',
                text: 'Erro ao atualizar mensagem: ' + result,
                icon: 'error'
            });
        }
    } catch (error) {
        Swal.fire({
            title: 'Erro!',
            text: 'Erro de conexão ao atualizar mensagem',
            icon: 'error'
        });
    }
}

// Editar campo
async function editField(fieldId) {
    try {
        console.log('Carregando campo com ID:', fieldId);
        const res = await fetch(`/modules/forms/builder/get_field.php?id=${fieldId}`);
        console.log('Status da resposta:', res.status);

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        const field = await res.json();
        console.log('Dados do campo recebidos:', field);

        if (field.error) {
            Swal.fire({
                title: 'Erro!',
                text: field.error,
                icon: 'error'
            });
            return;
        }

        // Preencher campos básicos
        document.getElementById('fieldId').value = field.id;
        document.getElementById('fieldType').value = field.type;
        document.getElementById('fieldLabel').value = field.label;
        document.getElementById('fieldDescription').value = field.description || '';
        document.getElementById('fieldRequired').checked = field.required == 1;

        // Resetar todas as configs
        document.getElementById('optionsContainer').style.display = 'none';
        document.getElementById('dynamicFieldConfig').innerHTML = '';

        // Parsear config JSON
        let config = {};
        if (field.config) {
            try {
                config = JSON.parse(field.config);
            } catch (e) {
                console.error('Erro ao parsear configuração:', e);
                config = {};
            }
        }

        // Atualizar o botão com base na existência de mídia
        if (field.media && field.media !== '') {
            document.getElementById('mediaBtnText').textContent = 'Editar mídia';

            const mediaObj = {
                url: field.media,
                style: field.media_style || 'centered',
                position: field.media_position || 'left',
                size: field.media_size || 'large'
            };

            document.getElementById('fieldMedia').value = JSON.stringify(mediaObj);
        } else {
            document.getElementById('mediaBtnText').textContent = 'Inserir mídia';
            document.getElementById('fieldMedia').value = '';
        }

        // Radio - Opções
        if (field.type === 'radio') {
            const options = JSON.parse(field.options || '[]');

            // Verificar se há pontuação ativada
            if (config.scoring_enabled && options.length > 0 && typeof options[0] === 'object') {
                // Não preencher textarea aqui, será feito no timeout com scoring
                document.getElementById('optionsContainer').style.display = 'block';
            } else {
                // Modo normal - opções simples
                document.getElementById('fieldOptions').value = options.join('\n');
                document.getElementById('optionsContainer').style.display = 'block';
            }
        }

        // Select - Opções
        if (field.type === 'select') {
            const options = JSON.parse(field.options || '[]');
            document.getElementById('fieldOptions').value = options.join('\n');
            document.getElementById('optionsContainer').style.display = 'block';
        }

        // Image Choice - Opções (não preenche aqui, será feito no timeout)
        if (field.type === 'image_choice') {
            // Não faz nada aqui, o carregamento será no timeout
        }

        // Carregar configurações dinâmicas e aguardar antes de preencher campos
        loadFieldConfig(field.type);

        // Após carregar as configurações, preencher os campos específicos
        setTimeout(() => {
            try {
                if (field.type === 'radio') {
                    setTimeout(() => {
                        const allowMultipleCheckbox = document.getElementById('fieldAllowMultiple');
                        if(allowMultipleCheckbox) {
                            allowMultipleCheckbox.checked = field.allow_multiple == 1;
                        }

                        // Verificar se há pontuação ativada
                        const enableScoringCheckbox = document.getElementById('enableScoring');
                        if (config.scoring_enabled && enableScoringCheckbox) {
                            enableScoringCheckbox.checked = true;

                            // Carregar opções com pontuação
                            const options = JSON.parse(field.options || '[]');
                            if (options.length > 0 && typeof options[0] === 'object') {
                                toggleScoringMode(); // Ativar modo scoring
                                setTimeout(() => {
                                    loadScoringOptions(options);
                                }, 100);
                            }
                        }
                    }, 50);
                }

                // Image Choice
                if (field.type === 'image_choice') {
                    setTimeout(() => {
                        const allowMultipleCheckbox = document.getElementById('fieldAllowMultiple');
                        if(allowMultipleCheckbox) {
                            allowMultipleCheckbox.checked = field.allow_multiple == 1;
                        }

                        // Verificar se há pontuação ativada
                        const enableImageScoringCheckbox = document.getElementById('enableImageScoring');
                        if (config.scoring_enabled && enableImageScoringCheckbox) {
                            enableImageScoringCheckbox.checked = true;
                        }

                        // Carregar opções com imagem
                        const options = JSON.parse(field.options || '[]');
                        if (options.length > 0) {
                            setTimeout(() => {
                                loadImageChoiceOptions(options);
                                // Atualizar visibilidade dos campos de pontuação
                                if (config.scoring_enabled) {
                                    toggleImageScoringVisibility();
                                }
                            }, 100);
                        }
                    }, 50);
                }

                // Slider
                if (field.type === 'slider' && Object.keys(config).length > 0) {
                    setTimeout(() => {
                        const sliderMin = document.getElementById('sliderMin');
                        const sliderMax = document.getElementById('sliderMax');
                        const sliderAllowRange = document.getElementById('sliderAllowRange');
                        
                        if(sliderMin) sliderMin.value = config.min || 0;
                        if(sliderMax) sliderMax.value = config.max || 10;
                        if(sliderAllowRange) sliderAllowRange.checked = config.allow_range == 1;
                    }, 50);
}

                // Rating
                if (field.type === 'rating' && Object.keys(config).length > 0) {
                    setTimeout(() => {
                        const ratingMax = document.getElementById('ratingMax');
                        if(ratingMax) ratingMax.value = config.max || 5;
                    }, 50);
                }

                // Date
                if (field.type === 'date' && Object.keys(config).length > 0) {
                    setTimeout(() => {
                        const dateShowTime = document.getElementById('dateShowTime');
                        if(dateShowTime) dateShowTime.checked = config.show_time == 1;
                    }, 50);
                }

                // File
                if (field.type === 'file' && Object.keys(config).length > 0) {
                    setTimeout(() => {
                        const fileTypes = document.getElementById('fileTypes');
                        if(fileTypes) fileTypes.value = config.types || '.pdf,.jpg,.jpeg,.png,.doc,.docx';
                    }, 50);
                }

                // Terms
                if (field.type === 'terms' && Object.keys(config).length > 0) {
                    setTimeout(() => {
                        const termsMode = document.getElementById('termsMode');
                        const termsText = document.getElementById('termsText');
                        const termsPdf = document.getElementById('termsPdf');
                        const termsLink = document.getElementById('termsLink');

                        if(termsMode) termsMode.value = config.mode || 'inline';
                        if(termsText) termsText.value = config.text || '';
                        if(termsPdf) termsPdf.value = config.pdf || '';
                        if(termsLink) termsLink.value = config.link || '';

                        setTimeout(() => {
                            document.querySelectorAll('.terms-mode-content').forEach(el => el.style.display = 'none');
                            if (config.mode === 'inline') {
                                const termsInline = document.getElementById('termsInlineContent');
                                if(termsInline) termsInline.style.display = 'block';
                            } else if (config.mode === 'pdf') {
                                const termsPdfContent = document.getElementById('termsPdfContent');
                                if(termsPdfContent) termsPdfContent.style.display = 'block';
                            } else if (config.mode === 'link') {
                                const termsLinkContent = document.getElementById('termsLinkContent');
                                if(termsLinkContent) termsLinkContent.style.display = 'block';
                            }
                        }, 150);
                    }, 50);
                }

                // RG
                if (field.type === 'rg' && Object.keys(config).length > 0) {
                    setTimeout(() => {
                        const rgShowComplementary = document.getElementById('rgShowComplementary');
                        if(rgShowComplementary) rgShowComplementary.checked = config.show_complementary_fields == 1;
                    }, 50);
                }
            } catch (error) {
                console.error('Erro ao preencher campos após carregar configurações:', error);
            }
        }, 200);

        // Carregar lógica condicional (aguardar um pouco mais para garantir que campos foram carregados)
        setTimeout(() => {
            if (field.conditional_logic) {
                loadConditionalLogic(field.conditional_logic);
            }
        }, 500);

        document.getElementById('btnText').textContent = 'Atualizar';
        document.getElementById('btnCancel').style.display = 'block';

        // Scroll suave até o formulário
        document.getElementById('fieldForm').scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    } catch (error) {
        console.error('Erro completo na função editField:', error);
        Swal.fire({
            title: 'Erro!',
            text: 'Erro ao carregar campo: ' + error.message,
            icon: 'error'
        });
    }
}

// Cancelar edição
function cancelEdit() {
    // Restaurar título do painel
    document.getElementById('formTitle').textContent = 'Adicionar Pergunta';
    
    // Resetar formulário
    document.getElementById('fieldForm').reset();
    document.getElementById('fieldId').value = '';
    document.getElementById('btnText').textContent = 'Adicionar';
    document.getElementById('btnCancel').style.display = 'none';

    // MOSTRAR TODOS OS CAMPOS NOVAMENTE
    document.getElementById('fieldTypeContainer').style.display = 'block';
    document.getElementById('fieldRequiredContainer').style.display = 'flex';
    document.getElementById('mediaBtn').style.display = 'block';

    // Restaurar required no tipo
    document.getElementById('fieldType').setAttribute('required', 'required');

    // Restaurar labels originais
    document.getElementById('fieldLabelLabel').textContent = 'Pergunta/Label *';
    document.getElementById('fieldDescriptionLabel').textContent = 'Descrição';
    document.getElementById('fieldDescription').placeholder = 'Adicione uma descrição opcional para ajudar o usuário...';
    document.getElementById('fieldDescriptionHint').textContent = 'Aparecerá abaixo do título da pergunta';

    // Esconder configs
    document.getElementById('optionsContainer').style.display = 'none';
    document.getElementById('dynamicFieldConfig').innerHTML = '';

    // Resetar lógica condicional
    document.getElementById('conditionalLogicEnabled').checked = false;
    document.getElementById('conditionalLogicContent').style.display = 'none';
    document.getElementById('conditionalRulesContainer').innerHTML = '';
    document.getElementById('conditionalLogicSection').style.display = 'none';

    // Resetar mídia
    document.getElementById('mediaBtnText').textContent = 'Inserir mídia';
}

// Deletar campo
async function deleteField(fieldId) {
    const result = await Swal.fire({
        title: 'Tem certeza?',
        text: 'Deseja realmente excluir esta pergunta? Esta ação não pode ser desfeita.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sim, excluir!',
        cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    try {
        const res = await fetch(`/modules/forms/builder/delete_field.php?id=${fieldId}`, {
            method: 'POST'
        });

        const resultText = await res.text();

        if (res.ok && resultText === 'success') {
            await Swal.fire({
                title: 'Excluída!',
                text: 'Pergunta excluída com sucesso.',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });
            window.location.reload();
        } else {
            Swal.fire({
                title: 'Erro!',
                text: 'Erro ao excluir campo: ' + resultText,
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

// ============================================
// SISTEMA DE TOAST CLEAN
// ============================================
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        info: 'bg-blue-500'
    };
    const icons = {
        success: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>',
        error: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>',
        info: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>'
    };

    toast.innerHTML = `
        <div class="fixed top-4 right-4 z-[9999] ${colors[type]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in">
            ${icons[type]}
            <span class="font-medium">${message}</span>
        </div>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.firstElementChild.classList.add('animate-slide-out');
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// Adicionar animações CSS se ainda não existir
if (!document.getElementById('toast-animations-clean')) {
    const style = document.createElement('style');
    style.id = 'toast-animations-clean';
    style.textContent = `
        @keyframes slide-in {
            from { transform: translateX(400px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slide-out {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(400px); opacity: 0; }
        }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
        .animate-slide-out { animation: slide-out 0.3s ease-in; }
    `;
    document.head.appendChild(style);
}

// Salvar ordem dos campos e fluxos
async function saveFieldsOrder() {
    // Coletar TODOS os itens (campos E fluxos) em ordem
    const allItems = document.querySelectorAll('.field-item, .flow-divider-card');
    const items = Array.from(allItems).map(item => {
        if (item.classList.contains('flow-divider-card')) {
            return {
                type: 'flow',
                id: parseInt(item.dataset.flowId)
            };
        } else {
            return {
                type: 'field',
                id: parseInt(item.dataset.fieldId)
            };
        }
    });

    try {
        const res = await fetch('/modules/forms/builder/save_order.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                form_id: FORM_ID,
                items: items
            })
        });

        const result = await res.text();

        if (res.ok && result === 'success') {
            showToast('Ordem salva!');
        } else {
            Swal.fire({
                title: 'Erro!',
                text: 'Erro ao salvar ordem: ' + result,
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

// Preview do formulário
function previewForm() {
    window.open(FORM_PUBLIC_URL, '_blank');
    // Fechar dropdown se estiver aberto
    document.getElementById('shareDropdown').classList.add('hidden');
}

// Toggle dropdown compartilhar
function toggleShareDropdown() {
    const dropdown = document.getElementById('shareDropdown');
    dropdown.classList.toggle('hidden');
}

// Copiar link do formulário
function copyFormLink() {
    const formUrl = document.getElementById('formUrl').value;
    navigator.clipboard.writeText(formUrl).then(() => {
        Swal.fire({
            title: 'Link copiado!',
            text: 'O link do formulário foi copiado para a área de transferência',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
        });
    });
    document.getElementById('shareDropdown').classList.add('hidden');
}

// Mostrar modal de incorporação
function showEmbedModal() {
    const formUrl = document.getElementById('formUrl').value;
    const embedCode = `<iframe src="${formUrl}" width="100%" height="600" frameborder="0"></iframe>`;

    const classes = getThemeClasses();

    const modalContent = `
        <div class="text-left">
            <p class="text-sm ${classes.textMuted} mb-4">
                Use o código abaixo para incorporar este formulário em seu site:
            </p>
            <div class="relative">
                <textarea id="embedCode" readonly rows="3"
                    class="w-full px-3 py-2 text-sm font-mono bg-gray-50 dark:bg-zinc-900 border border-gray-300 dark:border-zinc-600 rounded-lg ${classes.text} focus:outline-none resize-none">${embedCode}</textarea>
                <button onclick="copyEmbedCode()"
                    class="absolute top-2 right-2 px-3 py-1 bg-[#4EA44B] hover:bg-[#5dcf91] text-white text-xs rounded transition-colors">
                    <i class="fas fa-copy mr-1"></i> Copiar
                </button>
            </div>
        </div>
    `;

    Swal.fire({
        html: createFormModal({
            title: 'Código de Incorporação',
            content: modalContent,
            footer: {
                right: `<button type="button" onclick="Swal.close()" class="text-sm ${classes.textMuted} hover:${classes.text} transition-colors">Fechar</button>`
            }
        }),
        width: window.innerWidth < 640 ? '95%' : '600px',
        showConfirmButton: false,
        showCancelButton: false
    });

    document.getElementById('shareDropdown').classList.add('hidden');
}

// Copiar código de incorporação
function copyEmbedCode() {
    const embedCode = document.getElementById('embedCode');
    embedCode.select();
    navigator.clipboard.writeText(embedCode.value).then(() => {
        Swal.fire({
            title: 'Código copiado!',
            text: 'O código de incorporação foi copiado',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
        });
    });
}

// Fechar dropdown ao clicar fora
document.addEventListener('click', function(event) {
    const shareButton = document.getElementById('shareButton');
    const shareDropdown = document.getElementById('shareDropdown');

    if (shareButton && shareDropdown) {
        if (!shareButton.contains(event.target) && !shareDropdown.contains(event.target)) {
            shareDropdown.classList.add('hidden');
        }
    }
});

// Toggle status do formulário
async function toggleFormStatus() {
    const toggle = document.getElementById('statusToggle');
    const label = document.getElementById('statusLabel');
    const newStatus = toggle.checked ? 'ativo' : 'rascunho';

    try {
        const formData = new FormData();
        formData.append('form_id', FORM_ID);
        formData.append('status', newStatus);

        const res = await fetch('/modules/forms/builder/update_status.php', {
            method: 'POST',
            body: formData
        });

        const result = await res.text();

        if (res.ok && result === 'success') {
            label.textContent = newStatus === 'ativo' ? 'Ativo' : 'Rascunho';
            showToast('Status atualizado!');
        } else {
            // Reverter o toggle em caso de erro
            toggle.checked = !toggle.checked;
            Swal.fire({
                title: 'Erro!',
                text: 'Não foi possível atualizar o status',
                icon: 'error'
            });
        }
    } catch (error) {
        // Reverter o toggle em caso de erro
        toggle.checked = !toggle.checked;
        Swal.fire({
            title: 'Erro!',
            text: 'Erro de conexão',
            icon: 'error'
        });
    }
}

// ============================================
// SISTEMA DE MÍDIA - MANTIDO ORIGINAL
// ============================================

// Função auxiliar para inicializar eventos de seleção de imagens
// Função para abrir o modal de mídia
function openMediaModal() {
    const currentMediaValue = document.getElementById('fieldMedia').value;
    let currentMedia = {};

    if (currentMediaValue) {
        try {
            currentMedia = JSON.parse(currentMediaValue);
        } catch (e) {
            console.error('Erro ao parsear mídia atual:', e);
            currentMedia = {};
        }
    }

    const mediaModal = document.createElement('div');
    mediaModal.innerHTML = `
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" id="mediaModal">
            <div class="bg-white dark:bg-zinc-800 rounded-lg shadow-lg w-full max-w-xl p-6 relative max-h-[90vh] overflow-y-auto">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-semibold text-gray-900 dark:text-zinc-100">Inserir mídia</h3>
                    <button onclick="closeMediaModal()" class="text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <div class="space-y-4">
                    <!-- Seletor de tipo de mídia -->
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                            Tipo de mídia
                        </label>
                        <select id="mediaType" class="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4EA44B] dark:bg-zinc-700 dark:text-zinc-100">
                            <option value="image">📷 Imagem</option>
                            <option value="video">🎥 Vídeo</option>
                        </select>
                    </div>

                    <!-- Container para imagem -->
                    <div id="imageContainer" class="space-y-4">
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                                <i class="fas fa-image mr-1"></i> Upload de imagem
                            </label>
                            <input type="file" id="imageUpload" accept="image/*" class="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4EA44B] dark:bg-zinc-700 dark:text-zinc-100">
                        </div>

                        <div id="imagePreview" class="hidden mb-4">
                            <label class="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">Prévia da imagem</label>
                            <img id="previewImage" src="" alt="Prévia" class="max-w-full max-h-48 object-contain rounded-lg border border-gray-300 dark:border-zinc-600 mx-auto">
                        </div>
                    </div>

                    <!-- Container para vídeo -->
                    <div id="videoContainer" class="space-y-4 hidden">
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                                <i class="fas fa-video mr-1"></i> URL do vídeo (YouTube, Vimeo, etc)
                            </label>
                            <input type="text" id="videoUrl" placeholder="https://youtube.com/watch?v=..." class="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4EA44B] dark:bg-zinc-700 dark:text-zinc-100">
                            <p class="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                                Cole a URL de um vídeo do YouTube, Vimeo ou outro serviço
                            </p>
                        </div>

                        <div id="videoPreview" class="hidden">
                            <label class="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">Prévia do vídeo</label>
                            <div id="videoPreviewContent" class="bg-gray-100 dark:bg-zinc-700 rounded-lg border border-gray-300 dark:border-zinc-600 aspect-video flex items-center justify-center">
                                <p class="text-gray-500 dark:text-zinc-400">Prévia do vídeo</p>
                            </div>
                        </div>
                    </div>

                    <div class="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-zinc-700">
                        <button onclick="closeMediaModal()" class="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors">
                            Cancelar
                        </button>
                        <button onclick="clearMedia()" id="clearMediaBtn" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors hidden">
                            Limpar mídia
                        </button>
                        <button onclick="insertMedia()" class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors">
                            ${currentMedia && Object.keys(currentMedia).length > 0 ? 'Atualizar mídia' : 'Inserir mídia'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(mediaModal);

    if (currentMedia && Object.keys(currentMedia).length > 0) {
        document.getElementById('clearMediaBtn').classList.remove('hidden');
    }

    // Função para alternar entre imagem e vídeo
    function toggleMediaType() {
        const mediaType = document.getElementById('mediaType').value;
        const imageContainer = document.getElementById('imageContainer');
        const videoContainer = document.getElementById('videoContainer');

        if (mediaType === 'image') {
            imageContainer.classList.remove('hidden');
            videoContainer.classList.add('hidden');
        } else {
            imageContainer.classList.add('hidden');
            videoContainer.classList.remove('hidden');
        }
    }

    // Event listener para o seletor de tipo
    document.getElementById('mediaType').addEventListener('change', toggleMediaType);

    document.getElementById('imageUpload').addEventListener('change', function(e) {
        if (this.files && this.files[0]) {
            const reader = new FileReader();

            reader.onload = function(e) {
                const preview = document.getElementById('previewImage');
                preview.src = e.target.result;
                document.getElementById('imagePreview').classList.remove('hidden');
            }

            reader.readAsDataURL(this.files[0]);
        }
    });

    document.getElementById('videoUrl').addEventListener('input', function() {
        const url = this.value.trim();
        if (url) {
            showVideoPreview(url);
        } else {
            document.getElementById('videoPreview').classList.add('hidden');
        }
    });

    // Preencher dados existentes
    if (currentMedia && Object.keys(currentMedia).length > 0) {
        if (currentMedia.type === 'image') {
            document.getElementById('mediaType').value = 'image';
            document.getElementById('previewImage').src = currentMedia.url;
            document.getElementById('imagePreview').classList.remove('hidden');
        } else if (currentMedia.type === 'video') {
            document.getElementById('mediaType').value = 'video';
            document.getElementById('videoUrl').value = currentMedia.url || '';
            if (currentMedia.url) {
                showVideoPreview(currentMedia.url);
            }
        }
        toggleMediaType();
    }
}

function clearMedia() {
    if (confirm('Tem certeza que deseja limpar a mídia?')) {
        document.getElementById('fieldMedia').value = '';
        document.getElementById('mediaBtnText').textContent = 'Inserir mídia';
        closeMediaModal();
    }
}

function showVideoPreview(url) {
    const previewContainer = document.getElementById('videoPreviewContent');
    let iframe = '';

    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        let videoId = '';
        if (url.includes('youtu.be')) {
            videoId = url.split('youtu.be/')[1].split('?')[0];
        } else {
            videoId = url.split('v=')[1]?.split('&')[0] || '';
        }

        if (videoId) {
            iframe = `<div class="w-full h-full flex items-center justify-center"><iframe class="w-full h-full max-h-40" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
        }
    } else if (url.includes('vimeo.com')) {
        const videoId = url.split('/').pop().split('?')[0];
        if (videoId) {
            iframe = `<div class="w-full h-full flex items-center justify-center"><iframe class="w-full h-full max-h-40" src="https://player.vimeo.com/video/${videoId}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div>`;
        }
    } else {
        iframe = `<div class="w-full h-full flex items-center justify-center"><video class="max-h-40" controls><source src="${url}" type="video/mp4">Seu navegador não suporta vídeos.</video></div>`;
    }

    if (iframe) {
        previewContainer.innerHTML = iframe;
        document.getElementById('videoPreview').classList.remove('hidden');
    } else {
        previewContainer.innerHTML = '<p class="text-gray-500 dark:text-zinc-400">URL de vídeo inválida</p>';
        document.getElementById('videoPreview').classList.remove('hidden');
    }
}

async function uploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('form_id', FORM_ID);
    formData.append('field_name', 'media_image');

    try {
        const res = await fetch('/modules/forms/customization/upload_image.php', {
            method: 'POST',
            body: formData
        });

        // Verificar se a resposta é válida
        if (!res.ok) {
            const text = await res.text();
            console.error('Resposta do servidor:', text);
            throw new Error(`Erro no servidor (${res.status}): ${text || 'Resposta vazia'}`);
        }

        // Tentar fazer parse do JSON
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await res.text();
            console.error('Resposta não-JSON:', text);
            throw new Error('Resposta inválida do servidor. Verifique os logs.');
        }

        const result = await res.json();

        if (result.success) {
            return result.url;
        } else {
            throw new Error(result.error || 'Erro ao fazer upload');
        }
    } catch (error) {
        console.error('Erro no upload:', error);
        throw error;
    }
}

async function insertMedia() {
    let mediaData = {};

    const imageFile = document.getElementById('imageUpload').files[0];
    const videoUrl = document.getElementById('videoUrl').value.trim();

    // Prioridade: se há arquivo de imagem, usar ele
    if (imageFile) {
        try {
            const previewDiv = document.getElementById('imagePreview');
            previewDiv.innerHTML = '<div class="text-center py-4"><i class="fas fa-spinner fa-spin mr-2"></i> Processando imagem...</div>';
            previewDiv.classList.remove('hidden');

            const uploadedImageUrl = await uploadImage(imageFile);

            mediaData = {
                type: 'image',
                url: uploadedImageUrl,
                alt: 'Imagem inserida no campo',
                originalName: imageFile.name
            };
        } catch (error) {
            alert('Erro ao fazer upload da imagem: ' + error.message);
            return;
        }
    }
    // Se não há imagem, verificar se há URL de vídeo
    else if (videoUrl) {
        mediaData = {
            type: 'video',
            url: videoUrl
        };

        if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
            mediaData.service = 'youtube';
        } else if (videoUrl.includes('vimeo.com')) {
            mediaData.service = 'vimeo';
        } else {
            mediaData.service = 'direct';
        }
    }

    if (Object.keys(mediaData).length > 0) {
        document.getElementById('fieldMedia').value = JSON.stringify(mediaData);
        document.getElementById('mediaBtnText').textContent = 'Editar mídia';
        closeMediaModal();
    } else {
        alert('Por favor, insira uma imagem ou URL de vídeo');
    }
}

function closeMediaModal() {
    const modal = document.getElementById('mediaModal');
    if (modal) {
        modal.parentElement.remove();
    }
}

function updateFieldCount() {
    const count = document.querySelectorAll('.field-item').length;
    document.getElementById('fieldCount').textContent = `${count} pergunta(s)`;
}

// ============================================
// SISTEMA DE PONTUAÇÃO PARA MÚLTIPLA ESCOLHA
// ============================================

let scoringOptionCounter = 0;

// Toggle entre modo normal e modo pontuação
function toggleScoringMode() {
    const enabled = document.getElementById('enableScoring').checked;
    const scoringContainer = document.getElementById('scoringOptionsContainer');
    const optionsTextarea = document.getElementById('fieldOptions');
    const optionsContainer = document.getElementById('optionsContainer');

    if (enabled) {
        // Modo pontuação ativado
        scoringContainer.style.display = 'block';
        optionsContainer.style.display = 'none'; // Esconder textarea normal

        // Se a lista está vazia, migrar opções da textarea
        const currentList = document.getElementById('scoringOptionsList');
        if (currentList.children.length === 0) {
            const textareaOptions = optionsTextarea.value.split('\n').filter(o => o.trim() !== '');
            if (textareaOptions.length > 0) {
                textareaOptions.forEach(option => {
                    addScoringOption(option.trim(), 0);
                });
            } else {
                // Adicionar primeira opção vazia
                addScoringOption('', 0);
            }
        }
    } else {
        // Modo normal ativado - migrar de volta para textarea
        scoringContainer.style.display = 'none';
        optionsContainer.style.display = 'block';

        // Coletar opções e atualizar textarea
        const options = getScoringOptions();
        const optionsText = options.map(o => o.label).join('\n');
        optionsTextarea.value = optionsText;
    }
}

// Adicionar nova opção com pontuação
function addScoringOption(label = '', score = 0) {
    const container = document.getElementById('scoringOptionsList');
    const optionId = 'scoring_option_' + (++scoringOptionCounter);

    const optionHTML = `
        <div class="scoring-option bg-gray-50 dark:bg-zinc-700/50 p-3 rounded-lg border border-gray-200 dark:border-zinc-600" id="${optionId}">
            <div class="grid grid-cols-12 gap-2">
                <div class="col-span-7">
                    <input type="text"
                           class="scoring-option-label w-full px-2 py-1.5 border border-gray-300 dark:border-zinc-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-zinc-700 dark:text-zinc-100"
                           placeholder="Texto da opção..."
                           value="${label}">
                </div>
                <div class="col-span-4">
                    <input type="number"
                           class="scoring-option-score w-full px-2 py-1.5 border border-gray-300 dark:border-zinc-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-zinc-700 dark:text-zinc-100"
                           placeholder="Pontos..."
                           value="${score}"
                           min="0">
                </div>
                <div class="col-span-1 flex items-center">
                    <button type="button"
                            onclick="removeScoringOption('${optionId}')"
                            class="text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors">
                        <i class="fas fa-trash text-xs"></i>
                    </button>
                </div>
            </div>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', optionHTML);
}

// Remover opção
function removeScoringOption(optionId) {
    const element = document.getElementById(optionId);
    if (element) {
        element.remove();
    }

    // Se ficou vazio, adicionar uma opção
    const container = document.getElementById('scoringOptionsList');
    if (container.children.length === 0) {
        addScoringOption('', 0);
    }
}

// Coletar dados de pontuação para salvar
function getScoringOptions() {
    const options = [];
    document.querySelectorAll('.scoring-option').forEach(optionEl => {
        const label = optionEl.querySelector('.scoring-option-label').value.trim();
        const score = parseInt(optionEl.querySelector('.scoring-option-score').value) || 0;

        if (label) {
            options.push({ label, score });
        }
    });
    return options;
}

// Carregar opções com pontuação ao editar
function loadScoringOptions(options) {
    const container = document.getElementById('scoringOptionsList');
    container.innerHTML = ''; // Limpar

    if (options && options.length > 0) {
        options.forEach(option => {
            addScoringOption(option.label, option.score);
        });
    } else {
        addScoringOption('', 0);
    }
}

// ============================================
// SISTEMA DE MÚLTIPLA ESCOLHA COM IMAGEM
// ============================================

let imageChoiceOptionCounter = 0;

// Toggle de visibilidade do campo de pontuação
function toggleImageScoringVisibility() {
    const enabled = document.getElementById('enableImageScoring').checked;
    document.querySelectorAll('.image-choice-score').forEach(input => {
        input.style.display = enabled ? 'block' : 'none';
    });
}

// Adicionar nova opção com imagem
function addImageChoiceOption(label = '', image = '', score = 0) {
    const container = document.getElementById('imageChoiceOptionsList');
    const optionId = 'image_choice_option_' + (++imageChoiceOptionCounter);
    const scoringEnabled = document.getElementById('enableImageScoring')?.checked || false;

    const optionHTML = `
        <div class="image-choice-option bg-gray-50 dark:bg-zinc-700/50 p-3 rounded-lg border border-gray-200 dark:border-zinc-600" id="${optionId}">
            <div class="space-y-2">
                <!-- Linha 1: Upload e Preview -->
                <div class="flex items-center gap-2">
                    <div class="flex-shrink-0">
                        <div class="image-choice-preview w-16 h-16 border-2 border-dashed border-gray-300 dark:border-zinc-600 rounded flex items-center justify-center overflow-hidden bg-gray-100 dark:bg-zinc-800">
                            ${image ? `<img src="${image}" class="w-full h-full object-cover" />` : '<i class="fas fa-image text-gray-400"></i>'}
                        </div>
                    </div>
                    <div class="flex-1">
                        <input type="file"
                               class="image-choice-file hidden"
                               accept="image/*"
                               onchange="handleImageChoiceUpload('${optionId}', this)">
                        <button type="button"
                                onclick="document.getElementById('${optionId}').querySelector('.image-choice-file').click()"
                                class="w-full px-3 py-2 bg-white dark:bg-zinc-700 border border-gray-300 dark:border-zinc-600 rounded text-sm hover:bg-gray-50 dark:hover:bg-zinc-600 transition-colors">
                            <i class="fas fa-upload mr-1"></i> ${image ? 'Trocar imagem' : 'Fazer upload'}
                        </button>
                        <input type="hidden" class="image-choice-url" value="${image}">
                    </div>
                </div>

                <!-- Linha 2: Legenda e Pontos -->
                <div class="grid grid-cols-12 gap-2">
                    <div class="${scoringEnabled ? 'col-span-8' : 'col-span-11'}">
                        <input type="text"
                               class="image-choice-label w-full px-2 py-1.5 border border-gray-300 dark:border-zinc-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-zinc-700 dark:text-zinc-100"
                               placeholder="Legenda da imagem..."
                               value="${label}">
                    </div>
                    <div class="col-span-3 image-choice-score" style="display: ${scoringEnabled ? 'block' : 'none'};">
                        <input type="number"
                               class="image-choice-score-value w-full px-2 py-1.5 border border-gray-300 dark:border-zinc-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-zinc-700 dark:text-zinc-100"
                               placeholder="Pts"
                               value="${score}"
                               min="0">
                    </div>
                    <div class="col-span-1 flex items-center">
                        <button type="button"
                                onclick="removeImageChoiceOption('${optionId}')"
                                class="text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors">
                            <i class="fas fa-trash text-xs"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', optionHTML);
}

// Upload de imagem para opção
async function handleImageChoiceUpload(optionId, input) {
    const file = input.files[0];
    if (!file) return;

    // Validar tipo
    if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione apenas arquivos de imagem.');
        return;
    }

    // Validar tamanho (máx 2MB)
    if (file.size > 2 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 2MB.');
        return;
    }

    const optionEl = document.getElementById(optionId);
    const preview = optionEl.querySelector('.image-choice-preview');
    const urlInput = optionEl.querySelector('.image-choice-url');

    // Mostrar loading
    preview.innerHTML = '<i class="fas fa-spinner fa-spin text-gray-400"></i>';

    try {
        // Upload
        const formData = new FormData();
        formData.append('image', file);
        formData.append('form_id', FORM_ID);
        formData.append('field_name', 'image_choice');

        const res = await fetch('/modules/forms/customization/upload_image.php', {
            method: 'POST',
            body: formData
        });

        // Verificar se a resposta é válida
        if (!res.ok) {
            const text = await res.text();
            console.error('Resposta do servidor:', text);
            throw new Error(`Erro no servidor (${res.status}): ${text || 'Resposta vazia'}`);
        }

        // Tentar fazer parse do JSON
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await res.text();
            console.error('Resposta não-JSON:', text);
            throw new Error('Resposta inválida do servidor. Verifique os logs.');
        }

        const result = await res.json();

        if (result.success) {
            // Atualizar preview e URL
            preview.innerHTML = `<img src="${result.url}" class="w-full h-full object-cover" />`;
            urlInput.value = result.url;
        } else {
            throw new Error(result.error || 'Erro ao fazer upload');
        }
    } catch (error) {
        console.error('Erro no upload:', error);
        alert('Erro ao fazer upload da imagem: ' + error.message);
        preview.innerHTML = '<i class="fas fa-image text-gray-400"></i>';
    }
}

// Remover opção
function removeImageChoiceOption(optionId) {
    const element = document.getElementById(optionId);
    if (element) {
        element.remove();
    }

    // Se ficou vazio, adicionar uma opção
    const container = document.getElementById('imageChoiceOptionsList');
    if (container.children.length === 0) {
        addImageChoiceOption('', '', 0);
    }
}

// Coletar dados de opções com imagem para salvar
function getImageChoiceOptions() {
    const options = [];
    const scoringEnabled = document.getElementById('enableImageScoring')?.checked || false;

    document.querySelectorAll('.image-choice-option').forEach(optionEl => {
        const label = optionEl.querySelector('.image-choice-label').value.trim();
        const image = optionEl.querySelector('.image-choice-url').value.trim();
        const score = scoringEnabled ? (parseInt(optionEl.querySelector('.image-choice-score-value').value) || 0) : 0;

        if (label && image) {
            options.push({ label, image, score });
        }
    });
    return options;
}

// Carregar opções com imagem ao editar
function loadImageChoiceOptions(options) {
    const container = document.getElementById('imageChoiceOptionsList');
    container.innerHTML = ''; // Limpar

    if (options && options.length > 0) {
        options.forEach(option => {
            addImageChoiceOption(option.label, option.image, option.score || 0);
        });
    } else {
        addImageChoiceOption('', '', 0);
    }
}

// ============================================
// LÓGICA CONDICIONAL
// ============================================

let conditionalRulesCounter = 0;

// Toggle da seção de lógica condicional
function toggleConditionalLogic() {
    const enabled = document.getElementById('conditionalLogicEnabled').checked;
    const content = document.getElementById('conditionalLogicContent');

    if (enabled) {
        content.style.display = 'block';
        // Se não houver nenhuma regra, adiciona uma automaticamente
        if (document.querySelectorAll('.conditional-rule').length === 0) {
            addConditionalRule();
        }
    } else {
        content.style.display = 'none';
    }
}

// Adicionar nova regra condicional
function addConditionalRule() {
    const container = document.getElementById('conditionalRulesContainer');
    const ruleId = 'rule_' + (++conditionalRulesCounter);

    const ruleHTML = `
        <div class="conditional-rule bg-gray-50 dark:bg-zinc-700/50 p-3 rounded-lg border border-gray-200 dark:border-zinc-600" id="${ruleId}">
            <div class="grid grid-cols-12 gap-2">
                <!-- Campo -->
                <div class="col-span-4">
                    <select class="rule-field w-full px-2 py-1.5 border border-gray-300 dark:border-zinc-600 rounded text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-zinc-700 dark:text-zinc-100" onchange="updateRuleOperators('${ruleId}')">
                        <option value="">Selecione o campo...</option>
                    </select>
                </div>

                <!-- Operador -->
                <div class="col-span-3">
                    <select class="rule-operator w-full px-2 py-1.5 border border-gray-300 dark:border-zinc-600 rounded text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-zinc-700 dark:text-zinc-100" onchange="updateRuleValueInput('${ruleId}')">
                        <option value="equals">é igual a</option>
                        <option value="not_equals">é diferente de</option>
                        <option value="contains">contém</option>
                        <option value="not_contains">não contém</option>
                        <option value="is_empty">está vazio</option>
                        <option value="not_empty">não está vazio</option>
                        <option value="greater_than">maior que</option>
                        <option value="less_than">menor que</option>
                    </select>
                </div>

                <!-- Valor -->
                <div class="col-span-4">
                    <input type="text" class="rule-value w-full px-2 py-1.5 border border-gray-300 dark:border-zinc-600 rounded text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-zinc-700 dark:text-zinc-100" placeholder="Valor...">
                </div>

                <!-- Botão remover -->
                <div class="col-span-1 flex items-center">
                    <button type="button" onclick="removeConditionalRule('${ruleId}')" class="text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors">
                        <i class="fas fa-trash text-xs"></i>
                    </button>
                </div>
            </div>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', ruleHTML);

    // Preencher os campos disponíveis
    populateFieldOptions(ruleId);
}

// Preencher opções de campos disponíveis (campos anteriores ao atual)
function populateFieldOptions(ruleId) {
    const fieldSelect = document.querySelector(`#${ruleId} .rule-field`);
    const currentFieldId = document.getElementById('fieldId').value;
    const formId = FORM_ID;

    // Buscar todos os campos do formulário
    fetch(`/modules/forms/builder/get_fields_for_conditional.php?form_id=${formId}&current_field_id=${currentFieldId}`)
        .then(res => res.json())
        .then(fields => {
            fieldSelect.innerHTML = '<option value="">Selecione o campo...</option>';
            // Adicionar opção especial de soma de pontuação
            fieldSelect.innerHTML += `<option value="_score_total" data-type="score">📊 Soma da Pontuação</option>`;
            fieldSelect.innerHTML += `<option disabled>──────────</option>`;
            fields.forEach(field => {
                fieldSelect.innerHTML += `<option value="${field.id}" data-type="${field.type}">${field.label} (${field.type})</option>`;
            });
        })
        .catch(err => {
            console.error('Erro ao carregar campos:', err);
        });
}

// Atualizar operadores baseado no tipo de campo selecionado
function updateRuleOperators(ruleId) {
    const fieldSelect = document.querySelector(`#${ruleId} .rule-field`);
    const operatorSelect = document.querySelector(`#${ruleId} .rule-operator`);
    const selectedOption = fieldSelect.options[fieldSelect.selectedIndex];
    const fieldType = selectedOption?.getAttribute('data-type');

    // Operadores padrão
    let operators = [
        { value: 'equals', label: 'é igual a' },
        { value: 'not_equals', label: 'é diferente de' },
        { value: 'contains', label: 'contém' },
        { value: 'not_contains', label: 'não contém' },
        { value: 'is_empty', label: 'está vazio' },
        { value: 'not_empty', label: 'não está vazio' }
    ];

    // Adicionar operadores numéricos para campos de número e pontuação
    if (['number', 'slider', 'rating', 'money', 'score'].includes(fieldType)) {
        operators.push(
            { value: 'greater_than', label: 'maior que' },
            { value: 'less_than', label: 'menor que' },
            { value: 'greater_or_equal', label: 'maior ou igual a' },
            { value: 'less_or_equal', label: 'menor ou igual a' }
        );
    }

    operatorSelect.innerHTML = '';
    operators.forEach(op => {
        operatorSelect.innerHTML += `<option value="${op.value}">${op.label}</option>`;
    });

    updateRuleValueInput(ruleId);
}

// Atualizar campo de valor baseado no operador
function updateRuleValueInput(ruleId) {
    const operatorSelect = document.querySelector(`#${ruleId} .rule-operator`);
    const valueInput = document.querySelector(`#${ruleId} .rule-value`);
    const operator = operatorSelect.value;

    // Desabilitar campo de valor para operadores que não precisam
    if (operator === 'is_empty' || operator === 'not_empty') {
        valueInput.disabled = true;
        valueInput.value = '';
        valueInput.placeholder = 'Não requer valor';
        valueInput.classList.add('bg-gray-100', 'dark:bg-zinc-800');
    } else {
        valueInput.disabled = false;
        valueInput.placeholder = 'Valor...';
        valueInput.classList.remove('bg-gray-100', 'dark:bg-zinc-800');
    }
}

// Remover regra condicional
function removeConditionalRule(ruleId) {
    document.getElementById(ruleId).remove();
}

// Coletar dados de lógica condicional para salvar
function getConditionalLogicData() {
    const enabled = document.getElementById('conditionalLogicEnabled').checked;

    if (!enabled) {
        return null;
    }

    const logicType = document.getElementById('conditionalLogicType').value;
    const rules = [];

    document.querySelectorAll('.conditional-rule').forEach(ruleEl => {
        const fieldId = ruleEl.querySelector('.rule-field').value;
        const operator = ruleEl.querySelector('.rule-operator').value;
        const value = ruleEl.querySelector('.rule-value').value;

        if (fieldId) {
            rules.push({
                field_id: parseInt(fieldId),
                operator: operator,
                value: value
            });
        }
    });

    if (rules.length === 0) {
        return null;
    }

    return {
        enabled: true,
        logic_type: logicType,
        conditions: rules
    };
}

// Carregar lógica condicional existente
function loadConditionalLogic(conditionalLogic) {
    if (!conditionalLogic) {
        return;
    }

    try {
        const logic = typeof conditionalLogic === 'string' ? JSON.parse(conditionalLogic) : conditionalLogic;

        if (logic && logic.enabled) {
            document.getElementById('conditionalLogicEnabled').checked = true;
            document.getElementById('conditionalLogicContent').style.display = 'block';
            document.getElementById('conditionalLogicType').value = logic.logic_type || 'all';

            // Limpar regras existentes
            document.getElementById('conditionalRulesContainer').innerHTML = '';

            // Adicionar cada condição
            if (logic.conditions && logic.conditions.length > 0) {
                logic.conditions.forEach(condition => {
                    addConditionalRule();
                    const lastRule = document.querySelector('.conditional-rule:last-child');

                    // Aguardar os campos serem populados
                    setTimeout(() => {
                        lastRule.querySelector('.rule-field').value = condition.field_id;
                        lastRule.querySelector('.rule-operator').value = condition.operator;
                        lastRule.querySelector('.rule-value').value = condition.value || '';

                        // Atualizar operadores e valor input
                        const ruleId = lastRule.id;
                        updateRuleOperators(ruleId);
                        updateRuleValueInput(ruleId);
                    }, 300);
                });
            }
        }
    } catch (error) {
        console.error('Erro ao carregar lógica condicional:', error);
    }
}

// ============================================
// FUNÇÕES DE GERENCIAMENTO DE FLUXOS
// ============================================

// Adicionar novo fluxo
async function addFlow() {
    const result = await Swal.fire({
        title: 'Novo Fluxo Condicional',
        html: `
            <div class="text-left space-y-4">
                <div>
                    <label class="block text-sm font-medium mb-2 text-gray-700 dark:text-zinc-300">
                        Nome do Fluxo
                    </label>
                    <input type="text" id="flowLabel"
                           class="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-zinc-700 dark:text-zinc-100"
                           placeholder="Ex: Fluxo para Gatos, Fluxo para Empresas"
                           value="Novo Fluxo">
                </div>
                <div class="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
                    <p class="text-sm text-purple-800 dark:text-purple-200">
                        <i class="fas fa-info-circle mr-2"></i>
                        Após criar o fluxo, você poderá configurar as condições que determinarão quando o formulário deve pular para este ponto.
                    </p>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Criar Fluxo',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#9333ea',
        preConfirm: () => {
            const label = document.getElementById('flowLabel').value.trim();
            if (!label) {
                Swal.showValidationMessage('Nome do fluxo é obrigatório');
                return false;
            }
            return { label };
        }
    });

    if (result.isConfirmed) {
        const formData = new FormData();
        formData.append('form_id', FORM_ID);
        formData.append('label', result.value.label);
        formData.append('conditions', '[]');
        formData.append('conditions_type', 'all');

        try {
            const response = await fetch('/modules/forms/builder/save_flow.php', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                await Swal.fire({
                    title: 'Sucesso!',
                    text: 'Fluxo criado! Configure as condições clicando no ícone de engrenagem.',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
                location.reload();
            } else {
                throw new Error(data.error || 'Erro ao criar fluxo');
            }
        } catch (error) {
            Swal.fire({
                title: 'Erro!',
                text: error.message,
                icon: 'error'
            });
        }
    }
}

// Editar fluxo (configurar condições)
async function editFlow(flowId) {
    Swal.showLoading();

    try {
        // Buscar dados do fluxo
        const response = await fetch(`/modules/forms/builder/get_flow.php?flow_id=${flowId}`);
        const flowData = await response.json();

        if (!flowData.success) {
            throw new Error(flowData.error || 'Erro ao carregar fluxo');
        }

        const flow = flowData.flow;
        const conditions = flow.conditions ? JSON.parse(flow.conditions) : [];

        console.log('📥 Fluxo carregado:', {
            id: flow.id,
            label: flow.label,
            exit_to_field_id: flow.exit_to_field_id,
            conditions_type: flow.conditions_type,
            conditions: conditions
        });

        // Buscar campos disponíveis para condições
        const fieldsResponse = await fetch(`/modules/forms/builder/get_fields_for_flow.php?form_id=${FORM_ID}`);
        const fieldsData = await fieldsResponse.json();

        if (!fieldsData.success) {
            throw new Error(fieldsData.error || 'Erro ao carregar campos');
        }

        const availableFields = fieldsData.fields || [];

        console.log('📋 Campos disponíveis para salto:', availableFields.length, 'campos');

        // Criar HTML do modal
        let conditionsHTML = '';
        if (conditions.length > 0) {
            conditions.forEach((cond, index) => {
                const fieldOptions = availableFields.map(f =>
                    `<option value="${f.id}" ${f.id == cond.field_id ? 'selected' : ''}>${f.label}</option>`
                ).join('');

                conditionsHTML += `
                    <div class="flow-condition border border-gray-200 dark:border-zinc-700 rounded-lg p-3 mb-2">
                        <div class="grid grid-cols-3 gap-2">
                            <select class="cond-field px-2 py-1.5 border border-gray-300 dark:border-zinc-600 rounded text-sm dark:bg-zinc-700 dark:text-zinc-100">
                                <option value="">Selecione...</option>
                                ${fieldOptions}
                            </select>
                            <select class="cond-operator px-2 py-1.5 border border-gray-300 dark:border-zinc-600 rounded text-sm dark:bg-zinc-700 dark:text-zinc-100">
                                <option value="equals" ${cond.operator === 'equals' ? 'selected' : ''}>É igual a</option>
                                <option value="not_equals" ${cond.operator === 'not_equals' ? 'selected' : ''}>É diferente de</option>
                                <option value="contains" ${cond.operator === 'contains' ? 'selected' : ''}>Contém</option>
                                <option value="not_contains" ${cond.operator === 'not_contains' ? 'selected' : ''}>Não contém</option>
                            </select>
                            <div class="flex gap-1">
                                <input type="text" class="cond-value flex-1 px-2 py-1.5 border border-gray-300 dark:border-zinc-600 rounded text-sm dark:bg-zinc-700 dark:text-zinc-100"
                                       placeholder="Valor..." value="${cond.value || ''}">
                                <button type="button" onclick="this.closest('.flow-condition').remove()" class="text-red-600 hover:text-red-700 px-2">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            });
        }

        const result = await Swal.fire({
            title: 'Configurar Fluxo: ' + flow.label,
            html: `
                <div class="text-left space-y-4">
                    <div>
                        <label class="block text-sm font-medium mb-2 text-gray-700 dark:text-zinc-300">
                            Nome do Fluxo
                        </label>
                        <input type="text" id="flowLabelEdit"
                               class="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-zinc-700 dark:text-zinc-100"
                               value="${flow.label}">
                    </div>

                    <div>
                        <label class="block text-sm font-medium mb-2 text-gray-700 dark:text-zinc-300">
                            Tipo de Condição
                        </label>
                        <select id="flowConditionsType" class="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-zinc-700 dark:text-zinc-100">
                            <option value="all" ${flow.conditions_type === 'all' ? 'selected' : ''}>Todas as condições devem ser atendidas (AND)</option>
                            <option value="any" ${flow.conditions_type === 'any' ? 'selected' : ''}>Pelo menos uma condição deve ser atendida (OR)</option>
                        </select>
                    </div>

                    <div>
                        <label class="block text-sm font-medium mb-2 text-gray-700 dark:text-zinc-300">
                            Condições
                        </label>
                        <div id="flowConditionsContainer">
                            ${conditionsHTML || '<p class="text-sm text-gray-500 dark:text-zinc-400 italic">Nenhuma condição adicionada</p>'}
                        </div>
                        <button type="button" onclick="addFlowCondition()"
                                class="w-full mt-2 px-3 py-2 border-2 border-dashed border-purple-300 dark:border-purple-700 hover:border-purple-500 text-purple-600 dark:text-purple-400 rounded-lg text-sm transition-colors">
                            <i class="fas fa-plus mr-1"></i> Adicionar Condição
                        </button>
                    </div>

                    <div class="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-3">
                        <p class="text-xs text-purple-800 dark:text-purple-200">
                            <i class="fas fa-info-circle mr-1"></i>
                            Quando as condições forem atendidas, o formulário pulará para este ponto, ignorando as perguntas anteriores.
                        </p>
                    </div>
                </div>
            `,
            width: '700px',
            showCancelButton: true,
            confirmButtonText: 'Salvar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#9333ea',
            didOpen: () => {
                // Adicionar função global para adicionar condição
                window.addFlowCondition = function() {
                    const container = document.getElementById('flowConditionsContainer');
                    const fieldOptions = availableFields.map(f =>
                        `<option value="${f.id}">${f.label}</option>`
                    ).join('');

                    const condHTML = `
                        <div class="flow-condition border border-gray-200 dark:border-zinc-700 rounded-lg p-3 mb-2">
                            <div class="grid grid-cols-3 gap-2">
                                <select class="cond-field px-2 py-1.5 border border-gray-300 dark:border-zinc-600 rounded text-sm dark:bg-zinc-700 dark:text-zinc-100">
                                    <option value="">Selecione...</option>
                                    ${fieldOptions}
                                </select>
                                <select class="cond-operator px-2 py-1.5 border border-gray-300 dark:border-zinc-600 rounded text-sm dark:bg-zinc-700 dark:text-zinc-100">
                                    <option value="equals">É igual a</option>
                                    <option value="not_equals">É diferente de</option>
                                    <option value="contains">Contém</option>
                                    <option value="not_contains">Não contém</option>
                                </select>
                                <div class="flex gap-1">
                                    <input type="text" class="cond-value flex-1 px-2 py-1.5 border border-gray-300 dark:border-zinc-600 rounded text-sm dark:bg-zinc-700 dark:text-zinc-100" placeholder="Valor...">
                                    <button type="button" onclick="this.closest('.flow-condition').remove()" class="text-red-600 hover:text-red-700 px-2">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                    container.insertAdjacentHTML('beforeend', condHTML);
                };
            },
            preConfirm: () => {
                const label = document.getElementById('flowLabelEdit').value.trim();
                if (!label) {
                    Swal.showValidationMessage('Nome do fluxo é obrigatório');
                    return false;
                }

                const conditionsType = document.getElementById('flowConditionsType').value;
                const conditions = [];

                document.querySelectorAll('.flow-condition').forEach(condEl => {
                    const fieldId = condEl.querySelector('.cond-field').value;
                    const operator = condEl.querySelector('.cond-operator').value;
                    const value = condEl.querySelector('.cond-value').value;

                    if (fieldId) {
                        conditions.push({
                            field_id: parseInt(fieldId),
                            operator: operator,
                            value: value
                        });
                    }
                });

                return { label, conditionsType, conditions };
            }
        });

        if (result.isConfirmed) {
            console.log('💾 Salvando fluxo:', {
                flowId: flowId,
                label: result.value.label,
                conditionsType: result.value.conditionsType,
                conditions: result.value.conditions
            });

            const formData = new FormData();
            formData.append('form_id', FORM_ID);
            formData.append('flow_id', flowId);
            formData.append('label', result.value.label);
            formData.append('conditions', JSON.stringify(result.value.conditions));
            formData.append('conditions_type', result.value.conditionsType);

            const saveResponse = await fetch('/modules/forms/builder/save_flow.php', {
                method: 'POST',
                body: formData
            });

            const saveData = await saveResponse.json();

            if (saveData.success) {
                await Swal.fire({
                    title: 'Sucesso!',
                    text: 'Fluxo atualizado com sucesso!',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });
                location.reload();
            } else {
                throw new Error(saveData.error || 'Erro ao salvar fluxo');
            }
        }

    } catch (error) {
        Swal.fire({
            title: 'Erro!',
            text: error.message,
            icon: 'error'
        });
    }
}

// Deletar fluxo
async function deleteFlow(flowId) {
    const result = await Swal.fire({
        title: 'Remover Fluxo?',
        text: 'Esta ação não pode ser desfeita.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sim, remover',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#ef4444'
    });

    if (result.isConfirmed) {
        try {
            const formData = new FormData();
            formData.append('flow_id', flowId);

            const response = await fetch('/modules/forms/builder/delete_flow.php', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                await Swal.fire({
                    title: 'Removido!',
                    text: 'Fluxo removido com sucesso.',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });
                location.reload();
            } else {
                throw new Error(data.error || 'Erro ao remover fluxo');
            }
        } catch (error) {
            Swal.fire({
                title: 'Erro!',
                text: error.message,
                icon: 'error'
            });
        }
    }
}

// Duplicar campo
async function duplicateField(fieldId) {
    try {
        const formData = new FormData();
        formData.append('field_id', fieldId);

        const response = await fetch('/modules/forms/builder/duplicate_field.php', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            await Swal.fire({
                title: 'Duplicado!',
                text: 'Campo duplicado com sucesso.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
            location.reload();
        } else {
            throw new Error(data.error || 'Erro ao duplicar campo');
        }
    } catch (error) {
        Swal.fire({
            title: 'Erro!',
            text: error.message,
            icon: 'error'
        });
    }
}

// Duplicar fluxo
async function duplicateFlow(flowId) {
    try {
        const formData = new FormData();
        formData.append('flow_id', flowId);

        const response = await fetch('/modules/forms/builder/duplicate_flow.php', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            await Swal.fire({
                title: 'Duplicado!',
                text: 'Fluxo duplicado com sucesso.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
            location.reload();
        } else {
            throw new Error(data.error || 'Erro ao duplicar fluxo');
        }
    } catch (error) {
        Swal.fire({
            title: 'Erro!',
            text: error.message,
            icon: 'error'
        });
    }
}
// Mostrar alerta de recurso PRO padronizado
function showProFeature() {
    Swal.fire({
        title: '✨ Desbloqueie todo o potencial do Formtalk',
        html: `
            <p class="text-gray-600 dark:text-gray-300 mb-4">
                Este recurso está disponível no plano PRO, que inclui:
            </p>
            <ul class="text-left text-sm text-gray-600 dark:text-gray-300 space-y-2 mb-4">
                <li>✓ Formulários ilimitados</li>
                <li>✓ Respostas ilimitadas</li>
                <li>✓ Remover marca Formtalk</li>
                <li>✓ Redirecionamento customizado</li>
                <li>✓ Lógica condicional avançada</li>
                <li>✓ Sistema de pontuação</li>
                <li>✓ Suporte prioritário</li>
            </ul>
            <p class="text-purple-600 dark:text-purple-400 font-semibold">
                Experimente grátis por 30 dias!
            </p>
        `,
        icon: 'info',
        iconColor: '#a855f7',
        showCancelButton: true,
        confirmButtonText: '🚀 Testar PRO por 30 dias',
        cancelButtonText: 'Agora não',
        confirmButtonColor: '#a855f7',
        cancelButtonColor: '#6b7280',
        customClass: {
            popup: 'rounded-xl',
            confirmButton: 'px-6 py-2.5 rounded-lg font-semibold',
            cancelButton: 'px-6 py-2.5 rounded-lg'
        }
    }).then((result) => {
        if (result.isConfirmed) {
            // Redirecionar para checkout com dados pré-populados
            const userName = typeof USER_NAME !== 'undefined' ? USER_NAME : '';
            const userEmail = typeof USER_EMAIL !== 'undefined' ? USER_EMAIL : '';
            const checkoutUrl = `https://checkout.ticto.app/OEDEF53ED?name=${encodeURIComponent(userName)}&email=${encodeURIComponent(userEmail)}`;
            window.open(checkoutUrl, '_blank');
        }
    });
}
