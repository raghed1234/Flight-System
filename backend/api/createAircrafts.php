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
if (!isset($data['model']) || !isset($data['capacity']) || !isset($data['status'])) {
    echo json_encode([
        "success" => false,
        "message" => "Missing required fields: model, capacity, status"
    ]);
    exit();
}

// Sanitize and prepare data
$model = $conn->real_escape_string(trim($data['model']));
$capacity = intval($data['capacity']);
$status = $conn->real_escape_string(trim($data['status']));

// Validate data
if ($capacity <= 0) {
    echo json_encode([
        "success" => false,
        "message" => "Capacity must be a positive number"
    ]);
    exit();
}

$allowedStatuses = ['Active', 'Maintenance', 'Inactive', 'Scheduled'];
if (!in_array($status, $allowedStatuses)) {
    echo json_encode([
        "success" => false,
        "message" => "Invalid status. Allowed values: " . implode(', ', $allowedStatuses)
    ]);
    exit();
}

try {
    // Check if aircraft model already exists (optional, depends on requirements)
    // You might want to allow multiple aircraft of the same model
    
    // Insert into Aircraft table
    $stmt = $conn->prepare("INSERT INTO Aircraft (model, capacity, status) VALUES (?, ?, ?)");
    $stmt->bind_param("sis", $model, $capacity, $status);
    
    if (!$stmt->execute()) {
        throw new Exception("Failed to insert aircraft: " . $stmt->error);
    }
    
    $aircraft_id = $stmt->insert_id;
    $stmt->close();
    
    echo json_encode([
        "success" => true,
        "message" => "Aircraft created successfully",
        "aircraft_id" => $aircraft_id,
        "data" => [
            "aircraft_id" => $aircraft_id,
            "model" => $model,
            "capacity" => $capacity,
            "status" => $status
        ]
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "message" => "Failed to create aircraft: " . $e->getMessage()
    ]);
}

$conn->close();
?>