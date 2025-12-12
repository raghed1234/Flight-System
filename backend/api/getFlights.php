<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database connection
require_once __DIR__ . "/../config/db.php";

// Check if requesting single flight or all flights
if (isset($_GET['flight_id'])) {
    // Get single flight
    $flight_id = intval($_GET['flight_id']);
    
    $stmt = $conn->prepare("
        SELECT f.*, 
               ao.code as origin_code, ao.city as origin_city, ao.name as origin_name, ao.country as origin_country,
               ad.code as destination_code, ad.city as destination_city, ad.name as destination_name, ad.country as destination_country,
               ac.model as aircraft_model, ac.capacity, ac.status as aircraft_status
        FROM Flight f
        JOIN Airport ao ON f.origin_airport_id = ao.airport_id
        JOIN Airport ad ON f.destination_airport_id = ad.airport_id
        JOIN Aircraft ac ON f.aircraft_id = ac.aircraft_id
        WHERE f.flight_id = ?
    ");
    $stmt->bind_param("i", $flight_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $flight = $result->fetch_assoc();
        
        // Build full image URL if exists
        if ($flight['flight_image']) {
            $flight['flight_image_url'] = 'http://' . $_SERVER['HTTP_HOST'] . '/' . $flight['flight_image'];
        }
        
        echo json_encode([
            "success" => true,
            "data" => $flight
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "Flight not found"
        ]);
    }
    
    $stmt->close();
} else {
    // Get all flights with pagination
    $page = isset($_GET['page']) ? intval($_GET['page']) : 1;
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;
    $offset = ($page - 1) * $limit;
    
    // Get total count
    $countResult = $conn->query("SELECT COUNT(*) as total FROM Flight");
    $total = $countResult->fetch_assoc()['total'];
    
    // Get flights
    $result = $conn->query("
        SELECT f.*, 
               ao.code as origin_code, ao.city as origin_city,
               ad.code as destination_code, ad.city as destination_city,
               ac.model as aircraft_model
        FROM Flight f
        JOIN Airport ao ON f.origin_airport_id = ao.airport_id
        JOIN Airport ad ON f.destination_airport_id = ad.airport_id
        JOIN Aircraft ac ON f.aircraft_id = ac.aircraft_id
        ORDER BY f.departure_time DESC
        LIMIT $limit OFFSET $offset
    ");
    
    $flights = [];
    while ($row = $result->fetch_assoc()) {
        // Build full image URL if exists
        if ($row['flight_image']) {
            $row['flight_image_url'] = 'http://' . $_SERVER['HTTP_HOST'] . '/' . $row['flight_image'];
        }
        $flights[] = $row;
    }
    
    echo json_encode([
        "success" => true,
        "count" => count($flights),
        "total" => $total,
        "page" => $page,
        "total_pages" => ceil($total / $limit),
        "data" => $flights
    ]);
}

$conn->close();
?>