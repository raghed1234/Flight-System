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

// Check if request is multipart/form-data for file upload
if (!empty($_FILES['flight_image']['name'])) {
    // Handle form-data request (with file upload)
    $data = $_POST;
    $file = $_FILES['flight_image'];
} else {
    // Handle JSON request (without file upload)
    $input = file_get_contents("php://input");
    $data = json_decode($input, true);
    $file = null;
}

// Validate required fields
if (!isset($data['origin_airport_id']) || !isset($data['destination_airport_id']) || 
    !isset($data['departure_time']) || !isset($data['arrival_time']) || 
    !isset($data['aircraft_id'])) {
    echo json_encode([
        "success" => false,
        "message" => "Missing required fields: origin_airport_id, destination_airport_id, departure_time, arrival_time, aircraft_id"
    ]);
    exit();
}

// Sanitize and prepare data
$origin_airport_id = intval($data['origin_airport_id']);
$destination_airport_id = intval($data['destination_airport_id']);
$departure_time = $conn->real_escape_string(trim($data['departure_time']));
$arrival_time = $conn->real_escape_string(trim($data['arrival_time']));
$aircraft_id = intval($data['aircraft_id']);

// Handle image upload
$flight_image = null;
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
            $flight_image = 'uploads/flights/' . $fileName;
        } else {
            echo json_encode([
                "success" => false,
                "message" => "Failed to upload image"
            ]);
            exit();
        }
    } else {
        echo json_encode([
            "success" => false,
            "message" => "Invalid file type. Allowed: jpg, jpeg, png, gif, webp"
        ]);
        exit();
    }
}

try {
    // Insert flight
    if ($flight_image) {
        $stmt = $conn->prepare("INSERT INTO Flight (origin_airport_id, destination_airport_id, departure_time, arrival_time, aircraft_id, flight_image) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("iissis", $origin_airport_id, $destination_airport_id, $departure_time, $arrival_time, $aircraft_id, $flight_image);
    } else {
        $stmt = $conn->prepare("INSERT INTO Flight (origin_airport_id, destination_airport_id, departure_time, arrival_time, aircraft_id) VALUES (?, ?, ?, ?, ?)");
        $stmt->bind_param("iissi", $origin_airport_id, $destination_airport_id, $departure_time, $arrival_time, $aircraft_id);
    }
    
    if (!$stmt->execute()) {
        throw new Exception("Failed to create flight: " . $stmt->error);
    }
    
    $flight_id = $stmt->insert_id;
    $stmt->close();
    
    // Get created flight details
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
    $flight = $result->fetch_assoc();
    $stmt->close();
    
    // Build full image URL if exists
    if ($flight['flight_image']) {
        $flight['flight_image_url'] = 'http://' . $_SERVER['HTTP_HOST'] . '/' . $flight['flight_image'];
    }
    
    echo json_encode([
        "success" => true,
        "message" => "Flight created successfully",
        "flight_id" => $flight_id,
        "data" => $flight
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "message" => "Failed to create flight: " . $e->getMessage()
    ]);
}

$conn->close();
?>