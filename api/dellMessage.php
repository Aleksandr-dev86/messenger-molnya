<?php
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
// Обработка предварительного запроса OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
exit(0);
}
// Получение данных из POST-запроса
$data = json_decode(file_get_contents('php://input'), true);
// Проверяем, есть ли ID сообщения в запросе
if (isset($data['messageId'])) {
$messageId = $data['messageId'];
// Подключаемся к базе данных
require 'conectdb.php';
$conn = connectDB();
// Сначала проверяем, является ли сообщение групповым
$checkSql = "SELECT keyMessage FROM messages WHERE id = ?";
$checkStmt = $conn->prepare($checkSql);
$checkStmt->bind_param("i", $messageId);
$checkStmt->execute();
$checkStmt->store_result();
$checkStmt->bind_result($keyMessage);
$checkStmt->fetch();
if ($keyMessage !== null) {
// Это групповое сообщение, удаляем все копии по keyMessage
$checkStmt->close();
$groupSql = "DELETE FROM messages WHERE keyMessage = ?";
$groupStmt = $conn->prepare($groupSql);
$groupStmt->bind_param("s", $keyMessage);
if ($groupStmt->execute()) {
$deletedCount = $groupStmt->affected_rows;
if ($deletedCount > 0) {
echo json_encode([
'success' => true,
'message' => "Групповое сообщение успешно удалено ($deletedCount копий)"
 ]);
 } else {
echo json_encode([
'success' => false,
'error' => 'Групповые сообщения не найдены'
 ]);
 }
$groupStmt->close();
 } else {
echo json_encode([
'success' => false,
'error' => 'Ошибка при удалении группового сообщения: ' . $groupStmt->error
 ]);
$groupStmt->close();
 }
 } else {
// Это личное сообщение, удаляем только одно сообщение по id
$checkStmt->close();
$sql = "DELETE FROM messages WHERE id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $messageId);
if ($stmt->execute()) {
if ($stmt->affected_rows > 0) {
echo json_encode([
'success' => true,
'message' => 'Личное сообщение успешно удалено'
 ]);
 } else {
echo json_encode([
'success' => false,
'error' => 'Сообщение не найдено'
 ]);
 }
$stmt->close();
 } else {
echo json_encode([
'success' => false,
'error' => 'Ошибка при удалении сообщения: ' . $stmt->error
 ]);
$stmt->close();
 }
 }
// Закрываем соединение с базой данных
$conn->close();
} else {
// Возвращаем ошибку, если ID сообщения не указан
echo json_encode(['success' => false, 'error' => 'ID сообщения не указан']);
}
?>