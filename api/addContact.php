<?php

header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

if($_SERVER['REQUEST_METHOD']==='OPTIONS'){
    exit(0);
}


// Получение данных из POST-запроса
$data = json_decode(file_get_contents('php://input'), true);

if(isset($data['query'])){
    $userName = $data['query'];
    // $image=$_FILES['image']; 'image'-с фронта
    // $imageData = file_get_contents($image);
    require 'conectdb.php'; // Убедитесь, что у вас есть этот файл для подключения к БД
    $conn = connectDB();
    $sql = "SELECT * FROM users WHERE name_Ref LIKE ?";
    $stmt = $conn->prepare($sql);
    
    // Экранируем запрос для предотвращения SQL-инъекций
    $likeQuery = "%" . $conn->real_escape_string($userName) . "%";
    $stmt->bind_param("s", $likeQuery);
    
    // Выполняем запрос
    $stmt->execute();
    $result = $stmt->get_result();

    // Извлекаем результаты
    $users = [];
    while ($row = $result->fetch_assoc()) {
        $users[] = $row;
    }

    // Закрываем подготовленный запрос
    $stmt->close();
    
    // Возвращаем массив пользователей в формате JSON
    echo json_encode(['success' => true, 'data' => $users]);
}
else {
    // Возвращаем ошибку, если параметр query не установлен
    echo json_encode(['success' => false, 'error' => 'Параметр query отсутствует']);
}

// Закрываем соединение с базой данных
$conn->close();






?>