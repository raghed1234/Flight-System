<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Database connection
require_once __DIR__ . "/../config/db.php";

// Simple query: Get users where role = 'admin'
$sql = "SELECT 
            user_id as admin_id,
            email,
            fname,
            lname,
            role
        FROM Users 
        WHERE role = 'admin'
        ORDER BY user_id";

$result = $conn->query($sql);

$admins = [];
if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $admins[] = $row;
    }
}

// Return JSON response
echo json_encode([
    'success' => true,
    'data' => $admins,
    'count' => count($admins)
]);

$conn->close();
?>