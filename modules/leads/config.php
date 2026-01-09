<?php
return [
    'name' => 'leads',
    'label' => 'Meus Leads',
    'icon' => 'users',
    'url' => '/leads/list',
    'order' => 4,  // Ordem na sidebar (depois de Formulários)
    'roles' => ['admin', 'client']  // Quem pode acessar
];
