<?php
// Database connection
require_once __DIR__ . "/../config/db.php";


// Set headers for API
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "Method not allowed. Use POST."
    ]);
    exit();
}

// Get and decode JSON data
$json = file_get_contents('php://input');
$data = json_decode($json, true);

// Check if JSON is valid
if (json_last_error() !== JSON_ERROR_NONE) {
    echo json_encode([
        "success" => false,
        "message" => "Invalid JSON data"
    ]);
    exit();
}

// Validate required fields
$required_fields = ['email', 'password', 'fname', 'lname', 'phone_number'];
$missing_fields = [];

foreach ($required_fields as $field) {
    if (empty($data[$field])) {
        $missing_fields[] = $field;
    }
}

if (!empty($missing_fields)) {
    echo json_encode([
        "success" => false,
        "message" => "Missing required fields: " . implode(', ', $missing_fields)
    ]);
    exit();
}

// Sanitize and validate data
$email = trim($data['email']);
$password = $data['password'];
$fname = trim($data['fname']);
$lname = trim($data['lname']);
$phone_number = trim($data['phone_number']);
$role = 'passenger'; // Always passenger for signup

// Email validation
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode([
        "success" => false,
        "message" => "Invalid email format"
    ]);
    exit();
}

// Password validation (min 6 characters)
if (strlen($password) < 6) {
    echo json_encode([
        "success" => false,
        "message" => "Password must be at least 6 characters"
    ]);
    exit();
}

// Start transaction
$conn->begin_transaction();

try {
    // Check if email already exists in Users table
    $checkEmail = $conn->prepare("SELECT user_id FROM Users WHERE email = ?");
    $checkEmail->bind_param("s", $email);
    $checkEmail->execute();
    $emailResult = $checkEmail->get_result();
    
    if ($emailResult->num_rows > 0) {
        throw new Exception("Email already exists. Please use a different email.");
    }
    $checkEmail->close();
    
    // Check if phone number already exists in Passenger table
    $checkPhone = $conn->prepare("SELECT passenger_id FROM Passenger WHERE phone_number = ?");
    $checkPhone->bind_param("s", $phone_number);
    $checkPhone->execute();
    $phoneResult = $checkPhone->get_result();
    
    if ($phoneResult->num_rows > 0) {
        throw new Exception("Phone number already registered. Please use a different phone number.");
    }
    $checkPhone->close();
    
    // Hash password
    $password_hash = password_hash($password, PASSWORD_DEFAULT);
    
    // Insert into Users table
    $stmt = $conn->prepare("INSERT INTO Users (email, password, fname, lname, role) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("sssss", $email, $password_hash, $fname, $lname, $role);
    
    if (!$stmt->execute()) {
        throw new Exception("Failed to create user account: " . $stmt->error);
    }
    
    $user_id = $stmt->insert_id;
    $stmt->close();
    
    // Insert into Passenger table with phone number
    $stmt = $conn->prepare("INSERT INTO Passenger (passenger_id, phone_number) VALUES (?, ?)");
    $stmt->bind_param("is", $user_id, $phone_number);
    
    if (!$stmt->execute()) {
        throw new Exception("Failed to create passenger profile: " . $stmt->error);
    }
    
    $stmt->close();
    
    // Commit transaction
    $conn->commit();
    
    // Successful response
    echo json_encode([
        "success" => true,
        "message" => "Account created successfully! Please login with your credentials.",
        "data" => [
            "user_id" => $user_id,
            "email" => $email,
            "fname" => $fname,
            "lname" => $lname,
            "role" => $role,
            "phone_number" => $phone_number
        ]
    ]);
    
} catch (Exception $e) {
    // Rollback on error
    $conn->rollback();
    
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
    
} finally {
    $conn->close();
}
?>