<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once 'conectdb.php';
$conn = connectDB();

$userName = $_GET['userName'] ?? '';

if (empty($userName)) {
    echo json_encode(['success' => false, 'error' => 'Имя пользователя не указано']);
    exit;
}

$sql = "SELECT Name, Users FROM `Groups` WHERE Users LIKE ?";
$stmt = $conn->prepare($sql);
$param = "%{$userName}%";
$stmt->bind_param("s", $param);
$stmt->execute();
$result = $stmt->get_result();

$groups = [];
while ($row = $result->fetch_assoc()) {
    $users = explode(';', $row['Users']);
    if (in_array($userName, $users)) {
        $groups[] = $row;
    }
}

echo json_encode([
    'success' => true, 
    'groups' => $groups
]);

$stmt->close();
$conn->close();
?>