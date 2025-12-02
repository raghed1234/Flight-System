<?php
// signup.php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Include database connection
require_once 'config.php';

// Only handle POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
    exit();
}

// Get the JSON data from React
$data = json_decode(file_get_contents("php://input"), true);

// Validate required fields
$errors = [];

if (empty($data['full_name'])) {
    $errors[] = "Full Name is required";
}

if (empty($data['phone_number'])) {
    $errors[] = "Phone Number is required";
}

if (empty($data['email'])) {
    $errors[] = "Email is required";
} elseif (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
    $errors[] = "Invalid email format";
}

if (empty($data['password'])) {
    $errors[] = "Password is required";
} elseif (strlen($data['password']) < 6) {
    $errors[] = "Password must be at least 6 characters";
}

// If there are validation errors
if (!empty($errors)) {
    http_response_code(400);
    echo json_encode(["error" => "Validation failed", "messages" => $errors]);
    exit();
}

try {
    // Check if email already exists
    $checkEmail = $conn->prepare("SELECT email FROM users WHERE email = ?");
    $checkEmail->bind_param("s", $data['email']);
    $checkEmail->execute();
    $checkEmail->store_result();
    
    if ($checkEmail->num_rows > 0) {
        http_response_code(409);
        echo json_encode(["error" => "Email already registered"]);
        exit();
    }
    $checkEmail->close();

    // Hash the password for security
    $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);

    // Prepare and execute insert statement
    $stmt = $conn->prepare("INSERT INTO users (full_name, phone_number, email, password) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("ssss", 
        $data['full_name'], 
        $data['phone_number'], 
        $data['email'], 
        $hashedPassword
    );

    if ($stmt->execute()) {
        // Get the auto-generated user_id
        $user_id = $stmt->insert_id;
        
        // Return success response with user_id
        echo json_encode([
            "success" => true,
            "message" => "Account created successfully",
            "user_id" => $user_id,
            "user" => [
                "full_name" => $data['full_name'],
                "email" => $data['email']
            ]
        ]);
    } else {
        throw new Exception("Failed to create account");
    }
    
    $stmt->close();
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database error: " . $e->getMessage()]);
}

$conn->close();
?>