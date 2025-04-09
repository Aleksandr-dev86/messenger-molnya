<?php
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Обработка предварительного запроса OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Проверяем, есть ли ID сообщения в запросе
if (isset($_GET['messageId'])) {
    $messageId = $_GET['messageId'];
    
    // Подключаемся к базе данных
    require 'conectdb.php';
    $conn = connectDB();
    
    // Запрос для получения keyMessage
    $sql = "SELECT keyMessage FROM messages WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $messageId);
    $stmt->execute();
    $stmt->store_result();
    $stmt->bind_result($keyMessage);
    
    if ($stmt->fetch()) {
        echo json_encode([
            'success' => true,
            'keyMessage' => $keyMessage
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'error' => 'Сообщение не найдено'
        ]);
    }
    
    $stmt->close();
    $conn->close();
} else {
    // Возвращаем ошибку, если ID сообщения не указан
    echo json_encode(['success' => false, 'error' => 'ID сообщения не указан']);
}
?>