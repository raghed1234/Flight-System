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
if (!isset($data['airport_id'])) {
    echo json_encode([
        "success" => false,
        "message" => "Missing required field: airport_id"
    ]);
    exit();
}

// Check if at least one field to update is provided
$updateFields = ['name', 'code', 'city', 'country'];
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
        "message" => "No fields to update provided. Provide at least one of: name, code, city, country"
    ]);
    exit();
}

$airport_id = intval($data['airport_id']);

try {
    // Check if airport exists
    $checkStmt = $conn->prepare("SELECT * FROM Airport WHERE airport_id = ?");
    $checkStmt->bind_param("i", $airport_id);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();
    
    if ($checkResult->num_rows === 0) {
        throw new Exception("Airport not found");
    }
    
    $currentAirport = $checkResult->fetch_assoc();
    $checkStmt->close();
    
    // Prepare update fields
    $setClauses = [];
    $params = [];
    $types = '';
    
    if (isset($data['name'])) {
        $name = $conn->real_escape_string(trim($data['name']));
        $setClauses[] = "name = ?";
        $params[] = $name;
        $types .= 's';
    }
    
    if (isset($data['code'])) {
        $code = strtoupper($conn->real_escape_string(trim($data['code'])));
        
        // Check if new code already exists (excluding current airport)
        $codeCheckStmt = $conn->prepare("SELECT airport_id FROM Airport WHERE code = ? AND airport_id != ?");
        $codeCheckStmt->bind_param("si", $code, $airport_id);
        $codeCheckStmt->execute();
        $codeCheckResult = $codeCheckStmt->get_result();
        
        if ($codeCheckResult->num_rows > 0) {
            throw new Exception("Airport code already exists");
        }
        $codeCheckStmt->close();
        
        $setClauses[] = "code = ?";
        $params[] = $code;
        $types .= 's';
    }
    
    if (isset($data['city'])) {
        $city = $conn->real_escape_string(trim($data['city']));
        $setClauses[] = "city = ?";
        $params[] = $city;
        $types .= 's';
    }
    
    if (isset($data['country'])) {
        $country = $conn->real_escape_string(trim($data['country']));
        $setClauses[] = "country = ?";
        $params[] = $country;
        $types .= 's';
    }
    
    $params[] = $airport_id;
    $types .= 'i';
    
    // Build and execute update query
    $setSQL = implode(', ', $setClauses);
    $query = "UPDATE Airport SET $setSQL WHERE airport_id = ?";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param($types, ...$params);
    
    if (!$stmt->execute()) {
        throw new Exception("Failed to update airport: " . $stmt->error);
    }
    
    $affectedRows = $stmt->affected_rows;
    $stmt->close();
    
    // Get updated airport data
    $getStmt = $conn->prepare("SELECT * FROM Airport WHERE airport_id = ?");
    $getStmt->bind_param("i", $airport_id);
    $getStmt->execute();
    $result = $getStmt->get_result();
    $updatedAirport = $result->fetch_assoc();
    $getStmt->close();
    
    echo json_encode([
        "success" => true,
        "message" => "Airport updated successfully",
        "affected_rows" => $affectedRows,
        "data" => $updatedAirport
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "message" => "Failed to update airport: " . $e->getMessage()
    ]);
}

$conn->close();
?>