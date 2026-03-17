<?php
// php/api.php
require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$path = isset($_GET['path']) ? $_GET['path'] : '';
$parts = explode('/', trim($path, '/'));

$collection = isset($parts[0]) ? $parts[0] : null;
$id = isset($parts[1]) ? $parts[1] : null;

if (!$collection) {
    echo json_encode(['error' => 'Collection not specified']);
    exit;
}

// Lista de coleções permitidas (segurança)
$allowed_collections = [
    'users', 'orders', 'tickets', 'hrRequests', 'reports', 
    'timeRecords', 'inventory', 'technicianStock', 'auditLogs', 
    'notifications', 'invoices', 'settings'
];

if (!in_array($collection, $allowed_collections) && $collection !== 'upload-logo') {
    echo json_encode(['error' => 'Invalid collection']);
    exit;
}

// --- LÓGICA DE UPLOAD DE LOGO ---
if ($collection === 'upload-logo' && $method === 'POST') {
    if (!isset($_FILES['logo'])) {
        echo json_encode(['error' => 'No file uploaded']);
        exit;
    }

    $file = $_FILES['logo'];
    $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = 'logo_' . time() . '.' . $ext;
    $target = UPLOAD_DIR . $filename;

    if (move_uploaded_file($file['tmp_name'], $target)) {
        // Retorna a URL relativa ou absoluta
        $url = '/php/uploads/' . $filename;
        echo json_encode(['url' => $url]);
    } else {
        echo json_encode(['error' => 'Failed to move uploaded file']);
    }
    exit;
}

// --- LÓGICA CRUD GENÉRICA ---
switch ($method) {
    case 'GET':
        if ($id) {
            $stmt = $pdo->prepare('SELECT data FROM documents WHERE collection_name = ? AND id = ?');
            $stmt->execute([$collection, $id]);
            $row = $stmt->fetch();
            if ($row) {
                echo $row['data'];
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Not found']);
            }
        } else {
            $stmt = $pdo->prepare('SELECT data FROM documents WHERE collection_name = ?');
            $stmt->execute([$collection]);
            $rows = $stmt->fetchAll();
            $results = array_map(function($row) {
                return json_decode($row['data'], true);
            }, $rows);
            echo json_encode($results);
        }
        break;

    case 'POST':
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        
        if (!$data) {
            echo json_encode(['error' => 'Invalid JSON input']);
            exit;
        }

        $item_id = isset($data['id']) ? $data['id'] : bin2hex(random_bytes(16));
        $data['id'] = $item_id;
        $json_data = json_encode($data);

        $stmt = $pdo->prepare('
            INSERT INTO documents (collection_name, id, data, updated_at) 
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            ON DUPLICATE KEY UPDATE data = VALUES(data), updated_at = CURRENT_TIMESTAMP
        ');
        $stmt->execute([$collection, $item_id, $json_data]);
        
        echo $json_data;
        break;

    case 'DELETE':
        if (!$id) {
            echo json_encode(['error' => 'ID required for delete']);
            exit;
        }
        $stmt = $pdo->prepare('DELETE FROM documents WHERE collection_name = ? AND id = ?');
        $stmt->execute([$collection, $id]);
        echo json_encode(['success' => true, 'id' => $id]);
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}
