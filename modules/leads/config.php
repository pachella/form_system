<?php
return [
    'name' => 'leads',
    'label' => 'Meus Leads',
    'icon' => 'users',
    'url' => '/modules/leads/index.php',
    'order' => 4,  // Ordem na sidebar (depois de Formulários)
    'roles' => ['admin', 'client']  // Quem pode acessar
];
