<?php
ob_clean();

session_start();
require_once(__DIR__ . "/../../core/db.php");
require_once __DIR__ . '/../../core/PermissionManager.php';
require_once __DIR__ . '/../../core/PlanService.php';

header('Content-Type: text/plain; charset=utf-8');

if (!isset($_SESSION["user_id"])) {
    http_response_code(401);
    echo "Não autorizado";
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo "Método não permitido";
    exit();
}

try {
    $permissionManager = new PermissionManager($_SESSION['user_role'], $_SESSION['user_id'] ?? null);
    
    $id = trim($_POST['id'] ?? '');
    $title = trim($_POST['title'] ?? '');
    $description = trim($_POST['description'] ?? '');
    $display_mode = trim($_POST['display_mode'] ?? 'one-by-one');
    $status = trim($_POST['status'] ?? 'rascunho');
    $icon = trim($_POST['icon'] ?? 'file-alt');
    $color = trim($_POST['color'] ?? '#4EA44B');

    if (empty($title)) {
        http_response_code(400);
        echo "Título é obrigatório";
        exit();
    }

    if (!in_array($display_mode, ['one-by-one', 'all-at-once'])) {
        $display_mode = 'one-by-one';
    }

    if (!in_array($status, ['ativo', 'rascunho'])) {
        $status = 'rascunho';
    }
    
    $pdo->beginTransaction();

    if (empty($id)) {
        // CRIAR NOVO - Verificar limite de formulários
        if (!PlanService::canCreate('forms')) {
            http_response_code(403);
            echo PlanService::getLimitMessage('forms');
            exit();
        }
        $user_id = $_SESSION['user_id'];

        $sql = "INSERT INTO forms (user_id, title, description, display_mode, status, icon, color)
                VALUES (:user_id, :title, :description, :display_mode, :status, :icon, :color)";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':user_id' => $user_id,
            ':title' => $title,
            ':description' => $description,
            ':display_mode' => $display_mode,
            ':status' => $status,
            ':icon' => $icon,
            ':color' => $color
        ]);

        $formId = $pdo->lastInsertId();

        $pdo->commit();
        echo "success:" . $formId;
        
    } else {
        // EDITAR
        $checkStmt = $pdo->prepare("SELECT user_id FROM forms WHERE id = :id");
        $checkStmt->execute([':id' => $id]);
        $form = $checkStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$form) {
            http_response_code(404);
            echo "Formulário não encontrado";
            exit();
        }
        
        if (!$permissionManager->canEditRecord($form['user_id'])) {
            http_response_code(403);
            echo "Você não tem permissão para editar este formulário";
            exit();
        }
        
        $sql = "UPDATE forms SET
                title = :title,
                description = :description,
                display_mode = :display_mode,
                status = :status,
                icon = :icon,
                color = :color
                WHERE id = :id";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':title' => $title,
            ':description' => $description,
            ':display_mode' => $display_mode,
            ':status' => $status,
            ':icon' => $icon,
            ':color' => $color,
            ':id' => $id
        ]);
        
        $pdo->commit();
        echo "success:" . $id;
    }
    
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log("Erro no banco de dados: " . $e->getMessage());
    http_response_code(500);
    echo "Erro no banco de dados: " . $e->getMessage();
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log("Erro interno: " . $e->getMessage());
    http_response_code(500);
    echo "Erro interno";
}

exit();