<?php
session_start();
require_once(__DIR__ . "/../../../core/db.php");
require_once __DIR__ . '/../../../core/PermissionManager.php';

if (!isset($_SESSION["user_id"])) {
    echo "Não autorizado";
    http_response_code(401);
    exit;
}

$formId = $_POST['form_id'] ?? null;
$successTitle = $_POST['success_message_title'] ?? 'Tudo certo!';
$successDescription = $_POST['success_message_description'] ?? 'Obrigado por responder nosso formulário.';

// Novos campos de redirecionamento
$redirectEnabled = isset($_POST['success_redirect_enabled']) ? (int)$_POST['success_redirect_enabled'] : 0;
$redirectUrl = $_POST['success_redirect_url'] ?? null;
$redirectType = $_POST['success_redirect_type'] ?? 'automatic';
$redirectButtonText = $_POST['success_bt_redirect'] ?? 'Continuar';

// Campo de exibir pontuação
$showScore = isset($_POST['show_score']) ? (int)$_POST['show_score'] : 0;

// Campo de remover marca Formtalk
$hideBranding = isset($_POST['hide_formtalk_branding']) ? (int)$_POST['hide_formtalk_branding'] : 0;

// Campos do Modo Oferta
$offerModeEnabled = isset($_POST['offer_mode_enabled']) ? (int)$_POST['offer_mode_enabled'] : 0;
$offerLoadingText1 = $_POST['offer_loading_text_1'] ?? 'Analisando seu perfil...';
$offerLoadingText2 = $_POST['offer_loading_text_2'] ?? 'Procurando a melhor oferta...';
$offerTitle = $_POST['offer_title'] ?? null;
$offerDescription = $_POST['offer_description'] ?? null;
$offerAnchorPrice = !empty($_POST['offer_anchor_price']) ? (float)$_POST['offer_anchor_price'] : null;
$offerPromoPrice = !empty($_POST['offer_promo_price']) ? (float)$_POST['offer_promo_price'] : null;
$offerScarcityText = $_POST['offer_scarcity_text'] ?? null;

if (!$formId) {
    echo "ID do formulário não informado";
    http_response_code(400);
    exit;
}

$permissionManager = new PermissionManager($_SESSION['user_role'], $_SESSION['user_id'] ?? null);

// Verificar se o formulário existe e se o usuário tem permissão
$sql = "SELECT * FROM forms WHERE id = :id";
if (!$permissionManager->canViewAllRecords()) {
    $sql .= " AND user_id = :user_id";
}

$stmt = $pdo->prepare($sql);
$stmt->bindValue(':id', $formId, PDO::PARAM_INT);
if (!$permissionManager->canViewAllRecords()) {
    $stmt->bindValue(':user_id', $_SESSION['user_id'], PDO::PARAM_INT);
}
$stmt->execute();
$form = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$form) {
    echo "Formulário não encontrado";
    http_response_code(404);
    exit;
}

try {
    // Auto-migration: Adicionar campos de oferta se não existirem
    $columns = $pdo->query("SHOW COLUMNS FROM form_customizations LIKE 'offer_mode_enabled'")->fetchAll();
    if (empty($columns)) {
        $pdo->exec("ALTER TABLE form_customizations
            ADD COLUMN offer_mode_enabled TINYINT(1) DEFAULT 0,
            ADD COLUMN offer_loading_text_1 VARCHAR(255) DEFAULT 'Analisando seu perfil...',
            ADD COLUMN offer_loading_text_2 VARCHAR(255) DEFAULT 'Procurando a melhor oferta...',
            ADD COLUMN offer_title VARCHAR(255) DEFAULT NULL,
            ADD COLUMN offer_description TEXT DEFAULT NULL,
            ADD COLUMN offer_anchor_price DECIMAL(10, 2) DEFAULT NULL,
            ADD COLUMN offer_promo_price DECIMAL(10, 2) DEFAULT NULL,
            ADD COLUMN offer_scarcity_text VARCHAR(255) DEFAULT NULL
        ");
    }

    // Verificar se já existe personalização
    $checkStmt = $pdo->prepare("SELECT id FROM form_customizations WHERE form_id = :form_id");
    $checkStmt->execute([':form_id' => $formId]);
    $exists = $checkStmt->fetch(PDO::FETCH_ASSOC);

    if ($exists) {
        // UPDATE
        $sql = "UPDATE form_customizations SET
                success_message_title = :success_message_title,
                success_message_description = :success_message_description,
                success_redirect_enabled = :success_redirect_enabled,
                success_redirect_url = :success_redirect_url,
                success_redirect_type = :success_redirect_type,
                success_bt_redirect = :success_bt_redirect,
                show_score = :show_score,
                hide_formtalk_branding = :hide_formtalk_branding,
                offer_mode_enabled = :offer_mode_enabled,
                offer_loading_text_1 = :offer_loading_text_1,
                offer_loading_text_2 = :offer_loading_text_2,
                offer_title = :offer_title,
                offer_description = :offer_description,
                offer_anchor_price = :offer_anchor_price,
                offer_promo_price = :offer_promo_price,
                offer_scarcity_text = :offer_scarcity_text
                WHERE form_id = :form_id";
    } else {
        // INSERT - criar personalização com valores padrão e as novas mensagens
        $sql = "INSERT INTO form_customizations
                (form_id, background_color, text_color, primary_color, button_text_color, background_image, logo, button_radius, font_family, success_message_title, success_message_description, success_redirect_enabled, success_redirect_url, success_redirect_type, success_bt_redirect, show_score, hide_formtalk_branding, offer_mode_enabled, offer_loading_text_1, offer_loading_text_2, offer_title, offer_description, offer_anchor_price, offer_promo_price, offer_scarcity_text)
                VALUES
                (:form_id, :background_color, :text_color, :primary_color, :button_text_color, :background_image, :logo, :button_radius, :font_family, :success_message_title, :success_message_description, :success_redirect_enabled, :success_redirect_url, :success_redirect_type, :success_bt_redirect, :show_score, :hide_formtalk_branding, :offer_mode_enabled, :offer_loading_text_1, :offer_loading_text_2, :offer_title, :offer_description, :offer_anchor_price, :offer_promo_price, :offer_scarcity_text)";
    }

    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':form_id', $formId, PDO::PARAM_INT);
    $stmt->bindValue(':success_message_title', $successTitle);
    $stmt->bindValue(':success_message_description', $successDescription);
    $stmt->bindValue(':success_redirect_enabled', $redirectEnabled, PDO::PARAM_INT);
    $stmt->bindValue(':success_redirect_url', $redirectUrl);
    $stmt->bindValue(':success_redirect_type', $redirectType);
    $stmt->bindValue(':success_bt_redirect', $redirectButtonText);
    $stmt->bindValue(':show_score', $showScore, PDO::PARAM_INT);
    $stmt->bindValue(':hide_formtalk_branding', $hideBranding, PDO::PARAM_INT);
    $stmt->bindValue(':offer_mode_enabled', $offerModeEnabled, PDO::PARAM_INT);
    $stmt->bindValue(':offer_loading_text_1', $offerLoadingText1);
    $stmt->bindValue(':offer_loading_text_2', $offerLoadingText2);
    $stmt->bindValue(':offer_title', $offerTitle);
    $stmt->bindValue(':offer_description', $offerDescription);
    $stmt->bindValue(':offer_anchor_price', $offerAnchorPrice);
    $stmt->bindValue(':offer_promo_price', $offerPromoPrice);
    $stmt->bindValue(':offer_scarcity_text', $offerScarcityText);

    if (!$exists) {
        // Inserir campos com valores padrão para nova customização
        $stmt->bindValue(':background_color', '#ffffff');
        $stmt->bindValue(':text_color', '#000000');
        $stmt->bindValue(':primary_color', '#4f46e5');
        $stmt->bindValue(':button_text_color', '#ffffff');
        $stmt->bindValue(':background_image', '');
        $stmt->bindValue(':logo', '');
        $stmt->bindValue(':button_radius', 8, PDO::PARAM_INT);
        $stmt->bindValue(':font_family', 'Inter');
    }

    $stmt->execute();

    echo "success";

} catch (PDOException $e) {
    echo "Erro ao salvar: " . $e->getMessage();
    http_response_code(500);
}