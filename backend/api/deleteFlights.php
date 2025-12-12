<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database connection
require_once __DIR__ . "/../config/db.php";

// Get DELETE data
$input = file_get_contents("php://input");
$data = json_decode($input, true);

// Check for flight_id in query parameters if not in body
if (!isset($data['flight_id']) && isset($_GET['flight_id'])) {
    $data['flight_id'] = $_GET['flight_id'];
}

// Validate required field
if (!isset($data['flight_id'])) {
    echo json_encode([
        "success" => false,
        "message" => "Flight ID is required"
    ]);
    exit();
}

$flight_id = intval($data['flight_id']);

// Start transaction
$conn->begin_transaction();

try {
    // Check if flight exists
    $checkStmt = $conn->prepare("SELECT flight_id, flight_image FROM Flight WHERE flight_id = ?");
    $checkStmt->bind_param("i", $flight_id);
    $checkStmt->execute();
    $flightResult = $checkStmt->get_result();
    
    if ($flightResult->num_rows == 0) {
        throw new Exception("Flight not found");
    }
    
    $flight = $flightResult->fetch_assoc();
    $checkStmt->close();
    
    // Check if flight has bookings
    $checkBookingStmt = $conn->prepare("SELECT booking_id FROM Booking WHERE flight_id = ? LIMIT 1");
    $checkBookingStmt->bind_param("i", $flight_id);
    $checkBookingStmt->execute();
    $bookingResult = $checkBookingStmt->get_result();
    
    if ($bookingResult->num_rows > 0) {
        throw new Exception("Cannot delete flight with existing bookings. Delete bookings first.");
    }
    $checkBookingStmt->close();
    
    // Check if flight has crew assignments
    $checkCrewStmt = $conn->prepare("SELECT flight_crew_id FROM Flight_Crew WHERE flight_id = ? LIMIT 1");
    $checkCrewStmt->bind_param("i", $flight_id);
    $checkCrewStmt->execute();
    $crewResult = $checkCrewStmt->get_result();
    
    if ($crewResult->num_rows > 0) {
        throw new Exception("Cannot delete flight with crew assignments. Remove crew first.");
    }
    $checkCrewStmt->close();
    
    // Get flight details for response
    $infoStmt = $conn->prepare("
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
    $infoStmt->bind_param("i", $flight_id);
    $infoStmt->execute();
    $infoResult = $infoStmt->get_result();
    $flightInfo = $infoResult->fetch_assoc();
    $infoStmt->close();
    
    // Delete associated image file if exists
    if ($flight['flight_image'] && file_exists(__DIR__ . '/../' . $flight['flight_image'])) {
        unlink(__DIR__ . '/../' . $flight['flight_image']);
    }
    
    // Delete flight
    $deleteStmt = $conn->prepare("DELETE FROM Flight WHERE flight_id = ?");
    $deleteStmt->bind_param("i", $flight_id);
    
    if (!$deleteStmt->execute()) {
        throw new Exception("Failed to delete flight: " . $deleteStmt->error);
    }
    
    $affectedRows = $deleteStmt->affected_rows;
    $deleteStmt->close();
    
    // Commit transaction
    $conn->commit();
    
    if ($affectedRows > 0) {
        echo json_encode([
            "success" => true,
            "message" => "Flight deleted successfully",
            "deleted_flight" => $flightInfo
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "No flight found with that ID"
        ]);
    }
    
} catch (Exception $e) {
    // Rollback on error
    $conn->rollback();
    echo json_encode([
        "success" => false,
        "message" => "Failed to delete flight: " . $e->getMessage()
    ]);
}

$conn->close();
?>