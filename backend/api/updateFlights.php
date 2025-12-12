<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: PUT, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database connection
require_once __DIR__ . "/../config/db.php";

// Check request method and content type
$contentType = isset($_SERVER["CONTENT_TYPE"]) ? trim($_SERVER["CONTENT_TYPE"]) : '';

if (strpos($contentType, 'multipart/form-data') !== false) {
    // Handle form-data with file upload
    $data = $_POST;
    $file = $_FILES['flight_image'] ?? null;
    $flight_id = isset($data['flight_id']) ? intval($data['flight_id']) : 0;
} else {
    // Handle JSON request
    $input = file_get_contents("php://input");
    $data = json_decode($input, true);
    $file = null;
    $flight_id = isset($data['flight_id']) ? intval($data['flight_id']) : 0;
}

// Validate required field
if (!$flight_id) {
    echo json_encode([
        "success" => false,
        "message" => "Flight ID is required"
    ]);
    exit();
}

// Start transaction
$conn->begin_transaction();

try {
    // Check if flight exists
    $checkStmt = $conn->prepare("SELECT flight_id, flight_image FROM Flight WHERE flight_id = ?");
    $checkStmt->bind_param("i", $flight_id);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();
    
    if ($checkResult->num_rows == 0) {
        throw new Exception("Flight not found");
    }
    
    $existingFlight = $checkResult->fetch_assoc();
    $checkStmt->close();
    
    // Handle image upload if provided
    $flight_image = $existingFlight['flight_image'];
    $deleteOldImage = false;
    
    if ($file && $file['error'] === UPLOAD_ERR_OK) {
        // Create uploads directory if it doesn't exist
        $uploadDir = __DIR__ . '/../uploads/flights/';
        if (!file_exists($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }
        
        // Generate unique filename
        $fileExtension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $fileName = 'flight_' . time() . '_' . uniqid() . '.' . $fileExtension;
        $filePath = $uploadDir . $fileName;
        
        // Allowed file types
        $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        
        if (in_array(strtolower($fileExtension), $allowedExtensions)) {
            if (move_uploaded_file($file['tmp_name'], $filePath)) {
                // Delete old image if exists
                if ($flight_image && file_exists(__DIR__ . '/../' . $flight_image)) {
                    unlink(__DIR__ . '/../' . $flight_image);
                }
                
                $flight_image = 'uploads/flights/' . $fileName;
            } else {
                throw new Exception("Failed to upload image");
            }
        } else {
            throw new Exception("Invalid file type. Allowed: jpg, jpeg, png, gif, webp");
        }
    } elseif (isset($data['remove_image']) && $data['remove_image'] === true) {
        // Remove existing image if requested
        if ($flight_image && file_exists(__DIR__ . '/../' . $flight_image)) {
            unlink(__DIR__ . '/../' . $flight_image);
        }
        $flight_image = null;
    }
    
    // Build update query
    $updateFields = [];
    $updateValues = [];
    $types = "";
    
    if (isset($data['origin_airport_id'])) {
        $updateFields[] = "origin_airport_id = ?";
        $updateValues[] = intval($data['origin_airport_id']);
        $types .= "i";
    }
    
    if (isset($data['destination_airport_id'])) {
        $updateFields[] = "destination_airport_id = ?";
        $updateValues[] = intval($data['destination_airport_id']);
        $types .= "i";
    }
    
    if (isset($data['departure_time'])) {
        $updateFields[] = "departure_time = ?";
        $updateValues[] = $conn->real_escape_string(trim($data['departure_time']));
        $types .= "s";
    }
    
    if (isset($data['arrival_time'])) {
        $updateFields[] = "arrival_time = ?";
        $updateValues[] = $conn->real_escape_string(trim($data['arrival_time']));
        $types .= "s";
    }
    
    if (isset($data['aircraft_id'])) {
        $updateFields[] = "aircraft_id = ?";
        $updateValues[] = intval($data['aircraft_id']);
        $types .= "i";
    }
    
    // Always update image field if it was changed
    if ($flight_image !== $existingFlight['flight_image']) {
        $updateFields[] = "flight_image = ?";
        $updateValues[] = $flight_image;
        $types .= "s";
    }
    
    if (empty($updateFields)) {
        throw new Exception("No fields to update");
    }
    
    // Add flight_id to values
    $updateValues[] = $flight_id;
    $types .= "i";
    
    // Execute update
    $query = "UPDATE Flight SET " . implode(", ", $updateFields) . " WHERE flight_id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param($types, ...$updateValues);
    
    if (!$stmt->execute()) {
        throw new Exception("Failed to update flight: " . $stmt->error);
    }
    
    $stmt->close();
    
    // Commit transaction
    $conn->commit();
    
    // Get updated flight details
    $stmt = $conn->prepare("
        SELECT f.*, 
               ao.code as origin_code, ao.city as origin_city,
               ad.code as destination_code, ad.city as destination_city,
               ac.model as aircraft_model
        FROM Flight f
        JOIN Airport ao ON f.origin_airport_id = ao.airport_id
        JOIN Airport ad ON f.destination_airport_id = ad.airport_id
        JOIN Aircraft ac ON f.aircraft_id = ac.aircraft_id
        WHERE f.flight_id = ?
    ");
    $stmt->bind_param("i", $flight_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $updatedFlight = $result->fetch_assoc();
    $stmt->close();
    
    // Build full image URL if exists
    if ($updatedFlight['flight_image']) {
        $updatedFlight['flight_image_url'] = 'http://' . $_SERVER['HTTP_HOST'] . '/' . $updatedFlight['flight_image'];
    }
    
    echo json_encode([
        "success" => true,
        "message" => "Flight updated successfully",
        "data" => $updatedFlight
    ]);
    
} catch (Exception $e) {
    // Rollback on error
    $conn->rollback();
    echo json_encode([
        "success" => false,
        "message" => "Failed to update flight: " . $e->getMessage()
    ]);
}

$conn->close();
?>