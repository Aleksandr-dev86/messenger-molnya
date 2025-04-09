<?php
// createGroup.php - Скрипт для создания новой группы
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

try {
    // Проверка наличия всех необходимых данных
    if (!isset($_POST['groupName']) || !isset($_POST['users']) || !isset($_POST['createdBy'])) {
        throw new Exception("Недостаточно данных для создания группы");
    }
    
    // Получение данных из POST-запроса
    $groupName = $_POST['groupName'];
    $users = $_POST['users']; // строка с пользователями через ";"
    $createdBy = $_POST['createdBy'];
    
    // Проверка загрузки изображения
    if (!isset($_FILES['groupImage']) || $_FILES['groupImage']['error'] != 0) {
        throw new Exception("Ошибка при загрузке изображения");
    }
    
    // Чтение изображения в переменную
    $groupImage = file_get_contents($_FILES['groupImage']['tmp_name']);
    
    // Подключение к базе данных
    require 'conectdb.php';
    $conn = connectDB();
    
    // Проверка соединения
    if ($conn->connect_error) {
        throw new Exception("Ошибка подключения: " . $conn->connect_error);
    }
    
    // Текущая дата и время
    $currentDateTime = date("Y-m-d H:i:s");
    
    // Подготовка SQL-запроса для вставки данных
    $sql = "INSERT INTO `Groups` (Name, Img, Users, CreatedBy, CreatedAt, UpdatedAt, IsActive) 
            VALUES (?, ?, ?, ?, ?, ?, 1)";
    
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception("Ошибка подготовки запроса: " . $conn->error);
    }
    
    // Привязка параметров
    $stmt->bind_param("ssssss", 
        $groupName, 
        $groupImage, 
        $users, 
        $createdBy, 
        $currentDateTime, 
        $currentDateTime
    );
    
    // Выполнение запроса
    if (!$stmt->execute()) {
        throw new Exception("Ошибка при выполнении запроса: " . $stmt->error);
    }
    
    // Получение ID созданной группы
    $groupId = $conn->insert_id;
    
    echo json_encode([
        "success" => true, 
        "groupId" => $groupId, 
        "message" => "Группа успешно создана"
    ]);
    
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>