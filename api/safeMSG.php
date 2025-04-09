<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

if($_SERVER['REQUEST_METHOD']==='OPTIONS'){
    exit(0);
}

// Логирование входящих данных
$rawData = file_get_contents('php://input');
file_put_contents('debug_log.txt', date('Y-m-d H:i:s') . " - Received data: " . $rawData . PHP_EOL, FILE_APPEND);

// Получение данных из POST-запроса
$data = json_decode($rawData, true);

// Логирование распарсенных данных
file_put_contents('debug_log.txt', date('Y-m-d H:i:s') . " - Parsed data: " . print_r($data, true) . PHP_EOL, FILE_APPEND);

if (isset($data['sender']) && isset($data['receiver']) && isset($data['content'])) {
    $sender = $data['sender'];
    $receiver = $data['receiver'];
    $content = $data['content'];
    
    if (isset($data['timestamp'])) {
        // Преобразуем ISO 8601 в формат MySQL DATETIME
        $timestamp_obj = new DateTime($data['timestamp']);
        $timestamp = $timestamp_obj->format('Y-m-d H:i:s');
    } else {
        $timestamp = date('Y-m-d H:i:s');
    }
    
    // Логирование преобразованной даты
    file_put_contents('debug_log.txt', date('Y-m-d H:i:s') . " - Converted timestamp: " . $timestamp . PHP_EOL, FILE_APPEND);
    
    // Подключение к базе данных
    require_once 'conectdb.php'; // Файл для подключения к БД
    $conn = connectDB();
    
    // Проверка соединения
    if ($conn->connect_error) {
        $error = "Ошибка подключения: " . $conn->connect_error;
        file_put_contents('debug_log.txt', date('Y-m-d H:i:s') . " - DB Error: " . $error . PHP_EOL, FILE_APPEND);
        echo json_encode(["error" => $error]);
        exit();
    }
    
    // Проверка, является ли сообщение групповым
    if ($receiver === "GROUP" && isset($data['groupName']) && isset($data['originalSender'])) {
        $groupName = $data['groupName'];
        $originalSender = $data['originalSender'];
        
        file_put_contents('debug_log.txt', date('Y-m-d H:i:s') . " - Processing GROUP message for group: " . $groupName . " from: " . $originalSender . PHP_EOL, FILE_APPEND);
        
        // Получаем список пользователей группы из базы данных
        $sql = "SELECT Users FROM `Groups` WHERE Name = ?";
        $stmt = $conn->prepare($sql);
        
        if (!$stmt) {
            $error = "Ошибка подготовки запроса получения пользователей группы: " . $conn->error;
            file_put_contents('debug_log.txt', date('Y-m-d H:i:s') . " - SQL Error: " . $error . PHP_EOL, FILE_APPEND);
            echo json_encode(["error" => $error]);
            exit();
        }
        
        $stmt->bind_param("s", $groupName);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($row = $result->fetch_assoc()) {
            $usersString = $row['Users'];
            $users = explode(';', $usersString);
            
            // Логирование пользователей группы
            file_put_contents('debug_log.txt', date('Y-m-d H:i:s') . " - Group users: " . print_r($users, true) . PHP_EOL, FILE_APPEND);
            
            // Генерация уникального keyMessage для группы сообщений
            // Получаем все существующие значения keyMessage из базы данных
            $sql = "SELECT keyMessage FROM messages WHERE keyMessage IS NOT NULL";
            $existingKeys = $conn->query($sql);
            
            if (!$existingKeys) {
                $error = "Ошибка получения существующих ключей: " . $conn->error;
                file_put_contents('debug_log.txt', date('Y-m-d H:i:s') . " - SQL Error: " . $error . PHP_EOL, FILE_APPEND);
                echo json_encode(["error" => $error]);
                exit();
            }
            
            // Создаем массив существующих ключей
            $existingKeysArray = [];
            while ($row = $existingKeys->fetch_assoc()) {
                if (!empty($row['keyMessage'])) {
                    $existingKeysArray[] = (int)$row['keyMessage'];
                }
            }
            
            // Генерируем уникальный ключ
            $keyMessage = null;
            $maxAttempts = 10; // Ограничение на количество попыток для предотвращения бесконечного цикла
            $attempts = 0;
            
            while ($keyMessage === null && $attempts < $maxAttempts) {
                $attempts++;
                $randomKey = rand(1, 100000);
                
                if (!in_array($randomKey, $existingKeysArray)) {
                    $keyMessage = $randomKey;
                    break;
                }
            }
            
            if ($keyMessage === null) {
                $error = "Не удалось сгенерировать уникальный keyMessage после $maxAttempts попыток";
                file_put_contents('debug_log.txt', date('Y-m-d H:i:s') . " - Key Generation Error: " . $error . PHP_EOL, FILE_APPEND);
                echo json_encode(["error" => $error]);
                exit();
            }
            
            // Логирование сгенерированного ключа
            file_put_contents('debug_log.txt', date('Y-m-d H:i:s') . " - Generated keyMessage: " . $keyMessage . PHP_EOL, FILE_APPEND);
            
            // Подготовка SQL-запроса для вставки сообщения с полем keyMessage
            $sql = "INSERT INTO messages (sender_name, receiver_name, content, sent_time, originalSender, keyMessage) VALUES (?, ?, ?, ?, ?, ?)";
            $stmt = $conn->prepare($sql);
            
            if (!$stmt) {
                $error = "Ошибка подготовки запроса вставки сообщения: " . $conn->error;
                file_put_contents('debug_log.txt', date('Y-m-d H:i:s') . " - SQL Error: " . $error . PHP_EOL, FILE_APPEND);
                echo json_encode(["error" => $error]);
                exit();
            }
            
            // Сначала записываем сообщение от отправителя в группу
            // Первая запись: from originalSender to groupName
            $stmt->bind_param("sssssi", $originalSender, $groupName, $content, $timestamp, $originalSender, $keyMessage);
            
            if (!$stmt->execute()) {
                $error = "Ошибка выполнения запроса вставки сообщения: " . $stmt->error;
                file_put_contents('debug_log.txt', date('Y-m-d H:i:s') . " - Execute Error: " . $error . PHP_EOL, FILE_APPEND);
                echo json_encode(["error" => $error]);
                exit();
            }
            
            // Сохраняем ID первой записи
            $insertedIds = [];
            $insertedIds[] = $conn->insert_id;
            
            // Записываем сообщение от группы каждому участнику (кроме отправителя)
            $success = true;
            
            foreach ($users as $user) {
                $user = trim($user);
                if (!empty($user) && $user !== $originalSender) {
                    // Сообщения от группы пользователям: from groupName to user
                    $stmt->bind_param("sssssi", $groupName, $user, $content, $timestamp, $originalSender, $keyMessage);
                    
                    if ($stmt->execute()) {
                        $insertedIds[] = $conn->insert_id;
                    } else {
                        $error = "Ошибка при отправке сообщения пользователю $user: " . $stmt->error;
                        file_put_contents('debug_log.txt', date('Y-m-d H:i:s') . " - Execute Error: " . $error . PHP_EOL, FILE_APPEND);
                        $success = false;
                    }
                }
            }
            
            if ($success) {
                $response = [
                    "success" => true,
                    "message" => "Групповое сообщение сохранено успешно",
                    "ids" => $insertedIds,
                    "keyMessage" => $keyMessage
                ];
                file_put_contents('debug_log.txt', date('Y-m-d H:i:s') . " - Group Success: " . print_r($response, true) . PHP_EOL, FILE_APPEND);
                echo json_encode($response);
            } else {
                echo json_encode(["error" => "Некоторые сообщения не были отправлены", "ids" => $insertedIds, "keyMessage" => $keyMessage]);
            }
            
        } else {
            $error = "Группа с названием $groupName не найдена";
            file_put_contents('debug_log.txt', date('Y-m-d H:i:s') . " - Group Not Found: " . $error . PHP_EOL, FILE_APPEND);
            echo json_encode(["error" => $error]);
        }
        
    } else {
        // Логирование перед SQL-запросом для личного сообщения
        file_put_contents('debug_log.txt', date('Y-m-d H:i:s') . " - Preparing to insert PERSONAL message: sender=$sender, receiver=$receiver, timestamp=$timestamp" . PHP_EOL, FILE_APPEND);
        
        // Для личных сообщений originalSender = NULL
        $originalSender = null;
        
        // Подготовка SQL-запроса для вставки данных личного сообщения (с поддержкой originalSender)
        $sql = "INSERT INTO messages (sender_name, receiver_name, content, sent_time, originalSender) VALUES (?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);
        
        // Проверка на успешное создание подготовленного выражения
        if (!$stmt) {
            $error = "Ошибка подготовки запроса: " . $conn->error;
            file_put_contents('debug_log.txt', date('Y-m-d H:i:s') . " - SQL Error: " . $error . PHP_EOL, FILE_APPEND);
            echo json_encode(["error" => $error]);
            exit();
        }
        
        // Привязка параметров
        $stmt->bind_param("sssss", $sender, $receiver, $content, $timestamp, $originalSender);
        
        // Выполнение запроса и проверка результата
        if ($stmt->execute()) {
            $success = ["success" => true, "message" => "Личное сообщение сохранено успешно", "id" => $conn->insert_id];
            file_put_contents('debug_log.txt', date('Y-m-d H:i:s') . " - Success: " . print_r($success, true) . PHP_EOL, FILE_APPEND);
            echo json_encode($success);
        } else {
            $error = "Ошибка выполнения запроса: " . $stmt->error;
            file_put_contents('debug_log.txt', date('Y-m-d H:i:s') . " - Execute Error: " . $error . PHP_EOL, FILE_APPEND);
            echo json_encode(["error" => $error]);
        }
    }
    
    // Закрытие подготовленного выражения и соединения
    $stmt->close();
    $conn->close();
    
} else {
    $requiredFields = ['sender', 'receiver', 'content'];
    $missingFields = [];
    
    foreach ($requiredFields as $field) {
        if (!isset($data[$field])) {
            $missingFields[] = $field;
        }
    }
    
    $error = 'Недостаточно данных для сохранения сообщения. Отсутствуют поля: ' . implode(', ', $missingFields);
    file_put_contents('debug_log.txt', date('Y-m-d H:i:s') . " - Validation Error: " . $error . PHP_EOL, FILE_APPEND);
    echo json_encode(['error' => $error]);
}
?>