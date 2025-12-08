<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: PUT");
header("Access-Control-Allow-Headers: Content-Type");

// Database connection
require_once __DIR__ . "/../config/db.php";

// Get PUT data
$data = json_decode(file_get_contents("php://input"), true);

// Validate required fields
if (!isset($data['admin_id'])) {
    echo json_encode([
        "success" => false,
        "message" => "Admin ID is required"
    ]);
    exit();
}

$admin_id = intval($data['admin_id']);

// Build update query
$updates = [];
$params = [];
$types = "";

if (isset($data['fname'])) {
    $updates[] = "fname = ?";
    $params[] = trim($data['fname']);
    $types .= "s";
}

if (isset($data['lname'])) {
    $updates[] = "lname = ?";
    $params[] = trim($data['lname']);
    $types .= "s";
}

if (isset($data['email'])) {
    $updates[] = "email = ?";
    $params[] = trim($data['email']);
    $types .= "s";
}

if (isset($data['password']) && !empty($data['password'])) {
    $updates[] = "password = ?";
    $params[] = password_hash($data['password'], PASSWORD_DEFAULT);
    $types .= "s";
}

// If no fields to update
if (empty($updates)) {
    echo json_encode([
        "success" => false,
        "message" => "No fields to update"
    ]);
    exit();
}

// Add admin_id to params
$params[] = $admin_id;
$types .= "i";

// Build and execute query
$sql = "UPDATE Users SET " . implode(", ", $updates) . " WHERE user_id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param($types, ...$params);

if ($stmt->execute()) {
    if ($stmt->affected_rows > 0) {
        echo json_encode([
            "success" => true,
            "message" => "Admin updated successfully"
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "No changes made or admin not found"
        ]);
    }
} else {
    echo json_encode([
        "success" => false,
        "message" => "Update failed: " . $stmt->error
    ]);
}

$stmt->close();
$conn->close();
?>