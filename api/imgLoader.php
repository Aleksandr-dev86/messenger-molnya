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

// Инициализация переменной $userId


if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Получение имени пользователя из запроса
    $username = isset($_POST['userName']) ? $_POST['userName'] : null;

    if ($username) {
        // Запрос для получения ID пользователя по имени
        $stmt = $conn->prepare("SELECT id FROM users WHERE name_Ref = ?");
        $stmt->bind_param("s", $username);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows > 0) {
            $user = $result->fetch_assoc();
            $userId = $user['id']; // Сохраняем ID пользователя в переменную
        } else {
            echo json_encode(['success' => false, 'error' => 'Пользователь не найден.']);
            exit();
        }
    }

    // Обработка загрузки изображения
    if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
        $imageData = file_get_contents($_FILES['image']['tmp_name']);
        $imageBlob = $conn->real_escape_string($imageData);

        // Проверка, что $userId был установлен
        if ($userId !== null) {
            $sql = "INSERT INTO images (code, userId) VALUES ('$imageBlob', $userId)";
            if ($conn->query($sql) === TRUE) {
                echo json_encode(['success' => true, 'userId' => $userId]); // Возвращаем ID пользователя
            } else {
                echo json_encode(['success' => false, 'error' => $conn->error]);
            }
        } else {
            echo json_encode(['success' => false, 'error' => 'ID пользователя не установлен.']);
        }
    } else {
        echo json_encode(['success' => false, 'error' => 'Ошибка загрузки файла.']);
    }
}

$conn->close();
?>