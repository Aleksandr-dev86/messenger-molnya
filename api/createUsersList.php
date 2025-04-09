<?php
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

require 'conectdb.php'; // Убедитесь, что у вас есть этот файл для подключения к БД
$conn = connectDB();

// Получаем данные из POST запроса
$requestData = json_decode(file_get_contents('php://input'), true);
$currentUserName = isset($requestData['userName']) ? $requestData['userName'] : '';

// Получаем список пользователей
$sql = "SELECT id, name_Ref FROM users";
$stmt = $conn->prepare($sql);
if (!$stmt) {
    echo json_encode(['success' => false, 'error' => $conn->error]);
    exit;
}
$stmt->execute();
$result = $stmt->get_result();
$users = [];

while ($row = $result->fetch_assoc()) {
    $userId = $row['id'];
    $userName = $row['name_Ref'];
    
    // Получение аватарки пользователя по его ID
    $stmt_avatar = $conn->prepare("SELECT code FROM images WHERE userId = ? ORDER BY id DESC LIMIT 1");
    if (!$stmt_avatar) {
        echo json_encode(['success' => false, 'error' => $conn->error]);
        exit;
    }
    $stmt_avatar->bind_param("i", $userId);
    $stmt_avatar->execute();
    $result_avatar = $stmt_avatar->get_result();
    
    if ($result_avatar->num_rows > 0) {
        $image = $result_avatar->fetch_assoc();
        $imageBlob = base64_encode($image['code']);
    } else {
        $imageBlob = null; // Если аватарка не найдена, устанавливаем null
    }
    
    $users[] = [
        'username' => $userName,
        'img' => $imageBlob,
        'isGroup' => false // Маркируем как индивидуальный чат
    ];
    
    $stmt_avatar->close();
}

$stmt->close();

// Получаем группы, в которых состоит текущий пользователь
// Изменено: добавляем поле img в запрос к таблице Groups
$sql_groups = "SELECT id, name, users, img FROM `Groups`";
$stmt_groups = $conn->prepare($sql_groups);
if (!$stmt_groups) {
    echo json_encode(['success' => false, 'error' => $conn->error]);
    exit;
}
$stmt_groups->execute();
$result_groups = $stmt_groups->get_result();

// Проверяем для каждой группы, содержит ли она текущего пользователя
while ($row_group = $result_groups->fetch_assoc()) {
    $groupId = $row_group['id'];
    $groupName = $row_group['name'];
    $groupUsers = explode(';', $row_group['users']);
    
    // Проверяем, есть ли текущий пользователь в списке пользователей группы
    if (in_array($currentUserName, $groupUsers)) {
        // Получаем изображение группы напрямую из таблицы Groups
        $imageBlob = null;
        if ($row_group['img']) {
            $imageBlob = base64_encode($row_group['img']);
        }
        
        $users[] = [
            'username' => $groupName,
            'img' => $imageBlob,
            'isGroup' => true, // Маркируем как групповой чат
            'groupId' => $groupId
        ];
    }
}

$stmt_groups->close();
$conn->close();

echo json_encode(['success' => true, 'data' => $users]);
?>