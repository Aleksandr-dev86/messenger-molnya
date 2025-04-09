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

require 'conectdb.php';
$conn = connectDB();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $username = isset($input['userName']) ? $input['userName'] : null;

    if ($username) {
        $stmt = $conn->prepare("SELECT id FROM users WHERE name_Ref = ?");
        $stmt->bind_param("s", $username);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows > 0) {
            $user = $result->fetch_assoc();
            $userId = $user['id'];

            $stmt = $conn->prepare("SELECT code FROM images WHERE userId = ? ORDER BY id DESC LIMIT 1");
            $stmt->bind_param("i", $userId);
            $stmt->execute();
            $result = $stmt->get_result();

            if ($result->num_rows > 0) {
                $image = $result->fetch_assoc();
                $imageBlob = $image['code'];

                echo json_encode(['success' => true, 'image' => base64_encode($imageBlob)]);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Изображение не найдено.']);
            }
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Пользователь не найден.']);
        }
    } else {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Имя пользователя не указано.']);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Метод не поддерживается.']);
}

$conn->close();
?>