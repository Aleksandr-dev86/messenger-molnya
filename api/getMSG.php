<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

if($_SERVER['REQUEST_METHOD']==='OPTIONS'){
    exit(0);
}

// Проверка наличия параметра userName
if (!isset($_GET['userName']) || empty($_GET['userName'])) {
    echo json_encode(["error" => "Не указано имя пользователя"]);
    exit();
}

// Получаем имя пользователя и защищаемся от SQL-инъекций
$userName = htmlspecialchars(strip_tags($_GET['userName']));

// Подключение к базе данных
require 'conectdb.php'; // Файл для подключения к БД
$conn = connectDB();

// Проверка соединения
if ($conn->connect_error) {
    echo json_encode(["error" => "Ошибка подключения: " . $conn->connect_error]);
    exit();
}

// Подготовка SQL-запроса с включением поля originalSender
$sql = "SELECT id, sender_name as `from`, receiver_name as `to`, content as message, 
        sent_time as timestamp, originalSender
        FROM messages
        WHERE sender_name = ? OR receiver_name = ?
        ORDER BY sent_time ASC";

$stmt = $conn->prepare($sql);
$stmt->bind_param("ss", $userName, $userName);
$stmt->execute();
$result = $stmt->get_result();

// Проверка успешности выполнения запроса
if (!$result) {
    echo json_encode(["error" => "Ошибка выполнения запроса: " . $conn->error]);
    exit();
}

// Формирование массива сообщений
$messages = [];
while ($row = $result->fetch_assoc()) {
    // Определяем, является ли сообщение групповым на основе наличия originalSender
    $isGroup = !is_null($row['originalSender']);
    
    // Формируем объект сообщения
    $message = [
        'id' => $row['id'],
        'from' => $row['from'],
        'to' => $row['to'],
        'message' => $row['message'],
        'timestamp' => $row['timestamp'],
        'isGroup' => $isGroup
    ];
    
    // Добавляем originalSender только для групповых сообщений
    if ($isGroup) {
        $message['originalSender'] = $row['originalSender'];
    } else {
        $message['originalSender'] = null;
    }
    
    $messages[] = $message;
}

// Отправка ответа
echo json_encode(['success' => true, 'messages' => $messages]);

// Закрытие соединения
$stmt->close();
$conn->close();
?>