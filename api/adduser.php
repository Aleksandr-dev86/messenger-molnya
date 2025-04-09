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
if (isset($data['userName']) && isset($data['userPassword'])&& isset($data['userMail'])) {
    $username = $data['userName'];
    $password = $data['userPassword'];
    $mail=$data['userMail'];

    // Подключение к базе данных
    require 'conectdb.php'; // Убедитесь, что у вас есть этот файл для подключения к БД
    $conn = connectDB();

    // Проверка соединения
    if ($conn->connect_error) {
        echo json_encode(["error" => "Ошибка подключения: " . $conn->connect_error]);
        exit();
    }

    // Проверка, существует ли уже пользователь с таким логином
    $check_sql = "SELECT * FROM users WHERE user_mail = ?";
    $check_stmt = $conn->prepare($check_sql);
    
    if (!$check_stmt) {
        echo json_encode(["error" => "Ошибка подготовки запроса: " . $conn->error]);
        exit();
    }

    $check_stmt->bind_param("s", $username);
    $check_stmt->execute();
    $result = $check_stmt->get_result();

    // Если пользователь с таким логином уже существует
    if ($result->num_rows > 0) {
        echo json_encode(["error" => "Этот логин уже занят"]);
        $check_stmt->close();
        $conn->close();
        exit();
    }

    // Подготовка SQL-запроса для вставки данных
    $sql = "INSERT INTO users (name_Ref,user_mail, user_password) VALUES (?, ?, ?)";
    $stmt = $conn->prepare($sql);
    
    // Проверка на успешное создание подготовленного выражения
    if (!$stmt) {
        echo json_encode(["error" => "Ошибка подготовки запроса: " . $conn->error]);
        exit();
    }

    // Хеширование пароля
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);

    // Привязка параметров
    $stmt->bind_param("sss", $username, $mail, $hashed_password);

    // Выполнение запроса и проверка результата
    if ($stmt->execute()) {
        echo json_encode(['success'=>true,"message" => "Пользователь зарегистрирован успешно"]);
    } else {
        echo json_encode(["error" => "Ошибка выполнения запроса: " . $stmt->error]);
    }

    // Закрытие подготовленного выражения и соединения
    $stmt->close();
    $check_stmt->close();
    $conn->close();
} else {
    echo json_encode(['error' => 'Недостаточно данных']);
}

?>

