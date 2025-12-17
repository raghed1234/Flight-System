<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: DELETE");
header("Access-Control-Allow-Headers: Content-Type");

// Database connection
require_once __DIR__ . "/../config/db.php";

// Get DELETE data (usually from request body or query params)
$data = json_decode(file_get_contents("php://input"), true);

// Check for passenger_id in query parameters if not in body
if (!isset($data['passenger_id']) && isset($_GET['passenger_id'])) {
    $data['passenger_id'] = $_GET['passenger_id'];
}

// Validate required field
if (!isset($data['passenger_id'])) {
    echo json_encode([
        "success" => false,
        "message" => "Passenger ID is required"
    ]);
    exit();
}

$passenger_id = intval($data['passenger_id']);

// Start transaction
$conn->begin_transaction();

try {
    // First check if passenger exists and has any bookings
    $checkStmt = $conn->prepare("
        SELECT b.booking_id 
        FROM Booking b 
        WHERE b.passenger_id = ?
        LIMIT 1
    ");
    $checkStmt->bind_param("i", $passenger_id);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();
    
    if ($checkResult->num_rows > 0) {
        throw new Exception("Cannot delete passenger with existing bookings. Delete bookings first.");
    }
    $checkStmt->close();
    
    // Check if passenger exists
    $checkPassengerStmt = $conn->prepare("
        SELECT passenger_id FROM Passenger WHERE passenger_id = ?
    ");
    $checkPassengerStmt->bind_param("i", $passenger_id);
    $checkPassengerStmt->execute();
    $passengerResult = $checkPassengerStmt->get_result();
    
    if ($passengerResult->num_rows == 0) {
        throw new Exception("Passenger not found");
    }
    $checkPassengerStmt->close();
    
    // Get passenger info before deletion for response
    $infoStmt = $conn->prepare("
        SELECT u.email, u.fname, u.lname, p.phone_number 
        FROM Users u 
        JOIN Passenger p ON u.user_id = p.passenger_id 
        WHERE u.user_id = ?
    ");
    $infoStmt->bind_param("i", $passenger_id);
    $infoStmt->execute();
    $infoResult = $infoStmt->get_result();
    $passengerInfo = $infoResult->fetch_assoc();
    $infoStmt->close();
    
    // Delete from Users table (cascade will delete from Passenger table)
    $deleteStmt = $conn->prepare("DELETE FROM Users WHERE user_id = ? AND role = 'passenger'");
    $deleteStmt->bind_param("i", $passenger_id);
    
    if (!$deleteStmt->execute()) {
        throw new Exception("Failed to delete passenger: " . $deleteStmt->error);
    }
    
    $affectedRows = $deleteStmt->affected_rows;
    $deleteStmt->close();
    
    // Commit transaction
    $conn->commit();
    
    if ($affectedRows > 0) {
        echo json_encode([
            "success" => true,
            "message" => "Passenger deleted successfully",
            "deleted_passenger" => $passengerInfo
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "No passenger found with that ID or wrong role"
        ]);
    }
    
} catch (Exception $e) {
    // Rollback on error
    $conn->rollback();
    echo json_encode([
        "success" => false,
        "message" => "Failed to delete passenger: " . $e->getMessage()
    ]);
}

$conn->close();
?>