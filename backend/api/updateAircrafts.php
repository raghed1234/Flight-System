<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: PUT, PATCH, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database connection
require_once __DIR__ . "/../config/db.php";

// Get PUT/PATCH data
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
if (!isset($data['aircraft_id'])) {
    echo json_encode([
        "success" => false,
        "message" => "Missing required field: aircraft_id"
    ]);
    exit();
}

// Check if at least one field to update is provided
$updateFields = ['model', 'capacity', 'status'];
$hasUpdateField = false;
foreach ($updateFields as $field) {
    if (isset($data[$field])) {
        $hasUpdateField = true;
        break;
    }
}

if (!$hasUpdateField) {
    echo json_encode([
        "success" => false,
        "message" => "No fields to update provided. Provide at least one of: model, capacity, status"
    ]);
    exit();
}

$aircraft_id = intval($data['aircraft_id']);

try {
    // Check if aircraft exists
    $checkStmt = $conn->prepare("SELECT * FROM Aircraft WHERE aircraft_id = ?");
    $checkStmt->bind_param("i", $aircraft_id);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();
    
    if ($checkResult->num_rows === 0) {
        throw new Exception("Aircraft not found");
    }
    
    $currentAircraft = $checkResult->fetch_assoc();
    $checkStmt->close();
    
    // Prepare update fields
    $setClauses = [];
    $params = [];
    $types = '';
    
    if (isset($data['model'])) {
        $model = $conn->real_escape_string(trim($data['model']));
        $setClauses[] = "model = ?";
        $params[] = $model;
        $types .= 's';
    }
    
    if (isset($data['capacity'])) {
        $capacity = intval($data['capacity']);
        
        if ($capacity <= 0) {
            throw new Exception("Capacity must be a positive number");
        }
        
        $setClauses[] = "capacity = ?";
        $params[] = $capacity;
        $types .= 'i';
    }
    
    if (isset($data['status'])) {
        $status = $conn->real_escape_string(trim($data['status']));
        
        $allowedStatuses = ['Active', 'Maintenance', 'Inactive', 'Scheduled'];
        if (!in_array($status, $allowedStatuses)) {
            throw new Exception("Invalid status. Allowed values: " . implode(', ', $allowedStatuses));
        }
        
        $setClauses[] = "status = ?";
        $params[] = $status;
        $types .= 's';
    }
    
    $params[] = $aircraft_id;
    $types .= 'i';
    
    // Build and execute update query
    $setSQL = implode(', ', $setClauses);
    $query = "UPDATE Aircraft SET $setSQL WHERE aircraft_id = ?";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param($types, ...$params);
    
    if (!$stmt->execute()) {
        throw new Exception("Failed to update aircraft: " . $stmt->error);
    }
    
    $affectedRows = $stmt->affected_rows;
    $stmt->close();
    
    // Get updated aircraft data
    $getStmt = $conn->prepare("SELECT * FROM Aircraft WHERE aircraft_id = ?");
    $getStmt->bind_param("i", $aircraft_id);
    $getStmt->execute();
    $result = $getStmt->get_result();
    $updatedAircraft = $result->fetch_assoc();
    $getStmt->close();
    
    echo json_encode([
        "success" => true,
        "message" => "Aircraft updated successfully",
        "affected_rows" => $affectedRows,
        "data" => $updatedAircraft
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "message" => "Failed to update aircraft: " . $e->getMessage()
    ]);
}

$conn->close();
?>