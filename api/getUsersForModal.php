<?php
// getUsersForModal.php - Скрипт для получения списка пользователей
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

try {
    // Подключение к базе данных
    require 'conectdb.php';
    $conn = connectDB();
    
    // Проверка соединения
    if ($conn->connect_error) {
        throw new Exception("Ошибка подключения: " . $conn->connect_error);
    }
    
    // Подготовка SQL-запроса для получения всех пользователей
    $sql = "SELECT name_Ref FROM users";
    $result = $conn->query($sql);
    
    if (!$result) {
        throw new Exception("Ошибка выполнения запроса: " . $conn->error);
    }
    
    $users = [];
    while ($row = $result->fetch_assoc()) {
        $users[] = $row['name_Ref'];
    }
    
    echo json_encode(["success" => true, "users" => $users]);
    
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}

$conn->close();
?>