<?php
return [
    'name' => 'suporte',
    'label' => 'Suporte',
    'icon' => 'message-circle',
    'url' => 'https://wa.me/5511971404154?text=Olá! Preciso de suporte com o FormTalk.',
    'order' => 99,  // Último item
    'roles' => ['admin', 'client'],  // Quem pode acessar
    'external' => true  // Link externo
];
