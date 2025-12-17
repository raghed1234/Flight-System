<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

// Database connection
require_once __DIR__ . "/../config/db.php";


// Get POST data
$data = json_decode(file_get_contents("php://input"), true);

// Validate required fields
if (!isset($data['email']) || !isset($data['password']) || 
    !isset($data['fname']) || !isset($data['lname'])) {
    echo json_encode([
        "success" => false,
        "message" => "Missing required fields: email, password, fname, lname"
    ]);
    exit();
}

// Sanitize and prepare data
$email = $conn->real_escape_string(trim($data['email']));
$fname = $conn->real_escape_string(trim($data['fname']));
$lname = $conn->real_escape_string(trim($data['lname']));
$password_hash = password_hash($data['password'], PASSWORD_DEFAULT);
$role = isset($data['role']) ? $conn->real_escape_string($data['role']) : 'admin';

// Start transaction
$conn->begin_transaction();

try {
    // Check if email already exists
    $checkStmt = $conn->prepare("SELECT user_id FROM Users WHERE email = ?");
    $checkStmt->bind_param("s", $email);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();
    
    if ($checkResult->num_rows > 0) {
        throw new Exception("Email already exists");
    }
    $checkStmt->close();
    
    // Insert into Users table
    $stmt = $conn->prepare("INSERT INTO Users (email, password, fname, lname, role) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("sssss", $email, $password_hash, $fname, $lname, $role);
    
    if (!$stmt->execute()) {
        throw new Exception("Failed to insert user: " . $stmt->error);
    }
    
    $user_id = $stmt->insert_id;
    $stmt->close();
    
    // Insert into Admin table
    $stmt = $conn->prepare("INSERT INTO Admin (admin_id) VALUES (?)");
    $stmt->bind_param("i", $user_id);
    
    if (!$stmt->execute()) {
        throw new Exception("Failed to create admin record: " . $stmt->error);
    }
    
    $stmt->close();
    
    // Commit transaction
    $conn->commit();
    
    echo json_encode([
        "success" => true,
        "message" => "Admin created successfully",
        "admin_id" => $user_id,
        "data" => [
            "admin_id" => $user_id,
            "email" => $email,
            "fname" => $fname,
            "lname" => $lname,
            "role" => $role
        ]
    ]);
    
} catch (Exception $e) {
    // Rollback on error
    $conn->rollback();
    echo json_encode([
        "success" => false,
        "message" => "Failed to create admin: " . $e->getMessage()
    ]);
}

$conn->close();
?>