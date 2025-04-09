<?php
// Включение отчетов об ошибках для отладки
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Необходимые заголовки
header('Content-Type: application/json');

// Подключение к базе данных
require_once 'conectdb.php'; // Подключаем файл с функцией connectDB
$conn = connectDB(); // Используем функцию connectDB для подключения

// Проверка соединения
if ($conn->connect_error) {
    echo json_encode(['success' => false, 'error' => 'Ошибка подключения: ' . $conn->connect_error]);
    exit;
}

// Проверка, предоставлено ли имя группы
if (!isset($_GET['groupName']) || empty($_GET['groupName'])) {
    echo json_encode(['success' => false, 'error' => 'Требуется указать имя группы']);
    exit;
}


$groupName = $_GET['groupName'];

// Подготовка SQL-запроса для получения пользователей в указанной группе
$sql = "SELECT users FROM `Groups` WHERE name = ?";
$stmt = $conn->prepare($sql);

if (!$stmt) {
    echo json_encode(['success' => false, 'error' => $conn->error]);
    exit;
}

$stmt->bind_param("s", $groupName);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(['success' => false, 'error' => 'Группа не найдена']);
    exit;
}

// Получение строки пользователей из результата
$row = $result->fetch_assoc();
$usersString = $row['users'];

// Разделение строки пользователей по точке с запятой
$usernames = explode(';', $usersString);

// Удаление пустых элементов, которые могут возникнуть при разделении
$usernames = array_filter($usernames, function($username) {
    return !empty(trim($username));
});

// Очистка имен пользователей (удаление пробелов)
$usernames = array_map('trim', $usernames);

$stmt->close();
$conn->close();

// Возврат списка имен пользователей
echo json_encode(['success' => true, 'users' => array_values($usernames)]);
?>