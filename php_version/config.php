<?php
// php_version/config.php
session_start();

define('DB_HOST', 'localhost');
define('DB_NAME', 'digital_equipamentos');
define('DB_USER', 'root');
define('DB_PASS', '');

try {
    $pdo = new PDO("mysql:host=".DB_HOST.";dbname=".DB_NAME.";charset=utf8mb4", DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (PDOException $e) {
    die("Erro de conexão: " . $e->getMessage());
}

// Helpers
function redirect($path) {
    header("Location: $path");
    exit;
}

function isLoggedIn() {
    return isset($_SESSION['user_id']);
}

function checkRole($role) {
    if (!isLoggedIn() || $_SESSION['user_role'] !== $role) {
        redirect('index.php');
    }
}
?>
