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

// Получение данных из POST-запроса
$data = json_decode(file_get_contents('php://input'), true);
if (isset($data['enterName']) && isset($data['enterPassword'])) {
    $username = $data['enterName'];
    $password = $data['enterPassword'];

    // Подключение к базе данных
    require 'conectdb.php';
    $conn = connectDB();

    // Проверка соединения
    if ($conn->connect_error) {
        echo json_encode(["success" => false, "message" => "Ошибка подключения: " . $conn->connect_error]);
        exit();
    }

    // Подготовка SQL-запроса для проверки пользователя
    $sql = "SELECT * FROM users WHERE name_Ref = ?";
    $stmt = $conn->prepare($sql);
    
    if (!$stmt) {
        echo json_encode(["success" => false, "message" => "Ошибка подготовки запроса: " . $conn->error]);
        exit();
    }

    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        $user = $result->fetch_assoc();
        
        // Проверка пароля
        if (password_verify($password, $user['user_password'])) {
            echo json_encode(["success" => true, "message" => "Вход выполнен успешно"]);
        } else {
            echo json_encode(["success" => false, "message" => "Неверный логин или пароль"]);
        }
    } else {
        echo json_encode(["success" => false, "message" => "Пользователь не найден"]);
    }

    $stmt->close();
    $conn->close();
} else {
    echo json_encode(["success" => false, "message" => "Недостаточно данных"]);
}
?>