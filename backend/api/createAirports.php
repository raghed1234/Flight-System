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
if (!isset($data['name']) || !isset($data['code']) || 
    !isset($data['city']) || !isset($data['country'])) {
    echo json_encode([
        "success" => false,
        "message" => "Missing required fields: name, code, city, country"
    ]);
    exit();
}

// Sanitize and prepare data
$name = $conn->real_escape_string(trim($data['name']));
$code = strtoupper($conn->real_escape_string(trim($data['code'])));
$city = $conn->real_escape_string(trim($data['city']));
$country = $conn->real_escape_string(trim($data['country']));

try {
    // Check if airport code already exists
    $checkStmt = $conn->prepare("SELECT airport_id FROM Airport WHERE code = ?");
    $checkStmt->bind_param("s", $code);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();
    
    if ($checkResult->num_rows > 0) {
        throw new Exception("Airport code already exists");
    }
    $checkStmt->close();
    
    // Insert into Airport table
    $stmt = $conn->prepare("INSERT INTO Airport (name, code, city, country) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("ssss", $name, $code, $city, $country);
    
    if (!$stmt->execute()) {
        throw new Exception("Failed to insert airport: " . $stmt->error);
    }
    
    $airport_id = $stmt->insert_id;
    $stmt->close();
    
    echo json_encode([
        "success" => true,
        "message" => "Airport created successfully",
        "airport_id" => $airport_id,
        "data" => [
            "airport_id" => $airport_id,
            "name" => $name,
            "code" => $code,
            "city" => $city,
            "country" => $country
        ]
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "message" => "Failed to create airport: " . $e->getMessage()
    ]);
}

$conn->close();
?>