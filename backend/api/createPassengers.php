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
$role = 'passenger'; // Always set role as passenger
$phone = isset($data['phone_number']) ? $conn->real_escape_string(trim($data['phone_number'])) : null;

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
    
    // Check if phone exists (if provided)
    if ($phone) {
        $checkPhoneStmt = $conn->prepare("SELECT passenger_id FROM Passenger WHERE phone_number = ?");
        $checkPhoneStmt->bind_param("s", $phone);
        $checkPhoneStmt->execute();
        $checkPhoneResult = $checkPhoneStmt->get_result();
        
        if ($checkPhoneResult->num_rows > 0) {
            throw new Exception("Phone number already exists");
        }
        $checkPhoneStmt->close();
    }
    
    // Insert into Users table
    $stmt = $conn->prepare("INSERT INTO Users (email, password, fname, lname, role) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("sssss", $email, $password_hash, $fname, $lname, $role);
    
    if (!$stmt->execute()) {
        throw new Exception("Failed to insert user: " . $stmt->error);
    }
    
    $user_id = $stmt->insert_id;
    $stmt->close();
    
    // Insert into Passenger table
    if ($phone) {
        $stmt = $conn->prepare("INSERT INTO Passenger (passenger_id, phone_number) VALUES (?, ?)");
        $stmt->bind_param("is", $user_id, $phone);
    } else {
        $stmt = $conn->prepare("INSERT INTO Passenger (passenger_id) VALUES (?)");
        $stmt->bind_param("i", $user_id);
    }
    
    if (!$stmt->execute()) {
        throw new Exception("Failed to create passenger record: " . $stmt->error);
    }
    
    $stmt->close();
    
    // Commit transaction
    $conn->commit();
    
    echo json_encode([
        "success" => true,
        "message" => "Passenger created successfully",
        "passenger_id" => $user_id,
        "data" => [
            "passenger_id" => $user_id,
            "email" => $email,
            "fname" => $fname,
            "lname" => $lname,
            "phone_number" => $phone,
            "role" => $role
        ]
    ]);
    
} catch (Exception $e) {
    // Rollback on error
    $conn->rollback();
    echo json_encode([
        "success" => false,
        "message" => "Failed to create passenger: " . $e->getMessage()
    ]);
}

$conn->close();
?>