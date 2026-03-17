<?php
// php/config.php

// Configurações do Banco de Dados
$host = 'localhost';
$db   = 'digital_equipamentos';
$user = 'root'; // Seu usuário do MySQL
$pass = '';     // Sua senha do MySQL
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
     $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
     header('Content-Type: application/json');
     echo json_encode(['error' => 'Connection failed', 'message' => $e->getMessage()]);
     exit;
}

// Configurações de Upload
define('UPLOAD_DIR', __DIR__ . '/uploads/');
if (!file_exists(UPLOAD_DIR)) {
    mkdir(UPLOAD_DIR, 0777, true);
}
