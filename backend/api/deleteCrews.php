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

// Check for crew_id in query parameters if not in body
if (!isset($data['crew_id']) && isset($_GET['crew_id'])) {
    $data['crew_id'] = $_GET['crew_id'];
}

// Validate required field
if (!isset($data['crew_id'])) {
    echo json_encode([
        "success" => false,
        "message" => "Crew ID is required"
    ]);
    exit();
}

$crew_id = intval($data['crew_id']);

// Start transaction
$conn->begin_transaction();

try {
    // Check if crew member exists
    $checkCrewStmt = $conn->prepare("SELECT crew_id FROM Crew WHERE crew_id = ?");
    $checkCrewStmt->bind_param("i", $crew_id);
    $checkCrewStmt->execute();
    $crewResult = $checkCrewStmt->get_result();
    
    if ($crewResult->num_rows == 0) {
        throw new Exception("Crew member not found");
    }
    $checkCrewStmt->close();
    
    // Check if crew member is assigned to any flights
    $checkFlightStmt = $conn->prepare("SELECT flight_crew_id FROM Flight_Crew WHERE crew_id = ? LIMIT 1");
    $checkFlightStmt->bind_param("i", $crew_id);
    $checkFlightStmt->execute();
    $checkFlightResult = $checkFlightStmt->get_result();
    
    if ($checkFlightResult->num_rows > 0) {
        throw new Exception("Cannot delete crew member assigned to flights. Remove from flights first.");
    }
    $checkFlightStmt->close();
    
    // Get crew info before deletion
    $infoStmt = $conn->prepare("
        SELECT u.email, u.fname, u.lname, c.rank, c.flight_hours, c.phone_number 
        FROM Users u 
        JOIN Crew c ON u.user_id = c.crew_id 
        WHERE u.user_id = ?
    ");
    $infoStmt->bind_param("i", $crew_id);
    $infoStmt->execute();
    $infoResult = $infoStmt->get_result();
    $crewInfo = $infoResult->fetch_assoc();
    $infoStmt->close();
    
    // Delete from Users table (cascade will delete from Crew table)
    $deleteStmt = $conn->prepare("DELETE FROM Users WHERE user_id = ?");
    $deleteStmt->bind_param("i", $crew_id);
    
    if (!$deleteStmt->execute()) {
        throw new Exception("Failed to delete crew member: " . $deleteStmt->error);
    }
    
    $affectedRows = $deleteStmt->affected_rows;
    $deleteStmt->close();
    
    // Commit transaction
    $conn->commit();
    
    if ($affectedRows > 0) {
        echo json_encode([
            "success" => true,
            "message" => "Crew member deleted successfully",
            "deleted_crew" => $crewInfo
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "No crew member found with that ID"
        ]);
    }
    
} catch (Exception $e) {
    // Rollback on error
    $conn->rollback();
    echo json_encode([
        "success" => false,
        "message" => "Failed to delete crew member: " . $e->getMessage()
    ]);
}

$conn->close();
?>