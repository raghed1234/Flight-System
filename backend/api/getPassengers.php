<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type");

// Database connection
require_once __DIR__ . "/../config/db.php";

// Check if requesting single passenger or all passengers
if (isset($_GET['passenger_id'])) {
    // Get single passenger
    $passenger_id = intval($_GET['passenger_id']);
    
    $stmt = $conn->prepare("
        SELECT 
            u.user_id as passenger_id,
            u.email,
            u.fname,
            u.lname,
            u.role,
            p.phone_number
        FROM Users u
        JOIN Passenger p ON u.user_id = p.passenger_id
        WHERE u.user_id = ? AND u.role = 'passenger'
    ");
    $stmt->bind_param("i", $passenger_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $passenger = $result->fetch_assoc();
        echo json_encode([
            "success" => true,
            "data" => $passenger
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "Passenger not found"
        ]);
    }
    
    $stmt->close();
} else {
    // Get all passengers
    $result = $conn->query("
        SELECT 
            u.user_id as passenger_id,
            u.email,
            u.fname,
            u.lname,
            u.role,
            p.phone_number
        FROM Users u
        JOIN Passenger p ON u.user_id = p.passenger_id
        WHERE u.role = 'passenger'
        ORDER BY u.user_id
    ");
    
    $passengers = [];
    while ($row = $result->fetch_assoc()) {
        $passengers[] = $row;
    }
    
    echo json_encode([
        "success" => true,
        "count" => count($passengers),
        "data" => $passengers
    ]);
}

$conn->close();
?>