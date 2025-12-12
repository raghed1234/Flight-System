<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database connection
require_once __DIR__ . "/../config/db.php";

// Get POST data
$input = file_get_contents("php://input");
$data = json_decode($input, true);

// Check if JSON decoding was successful
if (json_last_error() !== JSON_ERROR_NONE) {
    echo json_encode([
        "success" => false,
        "message" => "Invalid JSON data"
    ]);
    exit();
}

// Validate required fields
if (!isset($data['email']) || !isset($data['password']) || 
    !isset($data['fname']) || !isset($data['lname']) ||
    !isset($data['rank']) || !isset($data['flight_hours'])) {
    echo json_encode([
        "success" => false,
        "message" => "Missing required fields: email, password, fname, lname, rank, flight_hours"
    ]);
    exit();
}

// Sanitize and prepare data
$email = $conn->real_escape_string(trim($data['email']));
$fname = $conn->real_escape_string(trim($data['fname']));
$lname = $conn->real_escape_string(trim($data['lname']));
$rank = $conn->real_escape_string(trim($data['rank']));
$flight_hours = floatval($data['flight_hours']);
$password_hash = password_hash($data['password'], PASSWORD_DEFAULT);
$role = 'crew';
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
        $checkPhoneStmt = $conn->prepare("SELECT crew_id FROM Crew WHERE phone_number = ?");
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
    
    // Insert into Crew table
    if ($phone) {
        $stmt = $conn->prepare("INSERT INTO Crew (crew_id, rank, flight_hours, phone_number) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("isds", $user_id, $rank, $flight_hours, $phone);
    } else {
        $stmt = $conn->prepare("INSERT INTO Crew (crew_id, rank, flight_hours) VALUES (?, ?, ?)");
        $stmt->bind_param("isd", $user_id, $rank, $flight_hours);
    }
    
    if (!$stmt->execute()) {
        throw new Exception("Failed to create crew record: " . $stmt->error);
    }
    
    $stmt->close();
    
    // Commit transaction
    $conn->commit();
    
    echo json_encode([
        "success" => true,
        "message" => "Crew member created successfully",
        "crew_id" => $user_id,
        "data" => [
            "crew_id" => $user_id,
            "email" => $email,
            "fname" => $fname,
            "lname" => $lname,
            "rank" => $rank,
            "flight_hours" => $flight_hours,
            "phone_number" => $phone,
            "role" => $role
        ]
    ]);
    
} catch (Exception $e) {
    // Rollback on error
    $conn->rollback();
    echo json_encode([
        "success" => false,
        "message" => "Failed to create crew member: " . $e->getMessage()
    ]);
}

$conn->close();
?>