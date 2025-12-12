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

// Get DELETE data from query parameters or JSON body
$aircraft_id = null;

// First try to get from query parameters
if (isset($_GET['id'])) {
    $aircraft_id = intval($_GET['id']);
} 
// If not in query params, try JSON body
else {
    $input = file_get_contents("php://input");
    $data = json_decode($input, true);
    
    if (json_last_error() === JSON_ERROR_NONE && isset($data['aircraft_id'])) {
        $aircraft_id = intval($data['aircraft_id']);
    }
}

// Validate aircraft ID
if (!$aircraft_id) {
    echo json_encode([
        "success" => false,
        "message" => "Missing required parameter: aircraft_id. Provide as query parameter ?id= or in JSON body"
    ]);
    exit();
}

try {
    // Check if aircraft exists
    $checkStmt = $conn->prepare("SELECT * FROM Aircraft WHERE aircraft_id = ?");
    $checkStmt->bind_param("i", $aircraft_id);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();
    
    if ($checkResult->num_rows === 0) {
        echo json_encode([
            "success" => false,
            "message" => "Aircraft not found"
        ]);
        exit();
    }
    
    $aircraft = $checkResult->fetch_assoc();
    $checkStmt->close();
    
    // Check if aircraft is referenced in flights
    $refCheckStmt = $conn->prepare("SELECT COUNT(*) as flight_count FROM Flight WHERE aircraft_id = ?");
    $refCheckStmt->bind_param("i", $aircraft_id);
    $refCheckStmt->execute();
    $refResult = $refCheckStmt->get_result();
    $refData = $refResult->fetch_assoc();
    $refCheckStmt->close();
    
    $flightCount = $refData['flight_count'];
    
    if ($flightCount > 0 && !isset($_GET['force'])) {
        echo json_encode([
            "success" => false,
            "message" => "Cannot delete aircraft: It is assigned to $flightCount flight(s).",
            "flight_references" => $flightCount,
            "hint" => "Add ?force=true to query parameters to force deletion (you must reassign or delete flights first)"
        ]);
        exit();
    }
    
    // Start transaction
    $conn->begin_transaction();
    
    try {
        // If forced deletion, we need to handle flight reassignment or deletion
        if (isset($_GET['force']) && $_GET['force'] === 'true') {
            // For aircraft, we should NOT delete flights automatically
            // Instead, check if there are active flights
            $activeFlightsStmt = $conn->prepare("
                SELECT COUNT(*) as active_count 
                FROM Flight 
                WHERE aircraft_id = ? 
                AND departure_time > NOW()
            ");
            $activeFlightsStmt->bind_param("i", $aircraft_id);
            $activeFlightsStmt->execute();
            $activeResult = $activeFlightsStmt->get_result();
            $activeData = $activeResult->fetch_assoc();
            $activeFlightsStmt->close();
            
            if ($activeData['active_count'] > 0) {
                throw new Exception("Cannot delete aircraft: It has " . $activeData['active_count'] . " future flights scheduled. Reassign or cancel these flights first.");
            }
            
            // For past flights, we can set aircraft_id to NULL or keep as is
            // Since it's a foreign key constraint, we need to handle this properly
            // For now, we'll check if there are any flights at all
            if ($flightCount > 0) {
                throw new Exception("Cannot force delete aircraft with flight assignments. Please reassign or delete flights first.");
            }
        }
        
        // Delete the aircraft
        $stmt = $conn->prepare("DELETE FROM Aircraft WHERE aircraft_id = ?");
        $stmt->bind_param("i", $aircraft_id);
        
        if (!$stmt->execute()) {
            // Check if deletion failed due to foreign key constraint
            if ($stmt->errno == 1451) { // Foreign key constraint fails
                throw new Exception("Cannot delete aircraft: It is assigned to flights. Please reassign or delete those flights first.");
            }
            throw new Exception("Failed to delete aircraft: " . $stmt->error);
        }
        
        $affectedRows = $stmt->affected_rows;
        $stmt->close();
        
        // Commit transaction
        $conn->commit();
        
        echo json_encode([
            "success" => true,
            "message" => "Aircraft deleted successfully",
            "affected_rows" => $affectedRows,
            "deleted_data" => $aircraft,
            "forced" => isset($_GET['force']) && $_GET['force'] === 'true'
        ]);
        
    } catch (Exception $e) {
        // Rollback on error
        $conn->rollback();
        throw $e;
    }
    
} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "message" => "Failed to delete aircraft: " . $e->getMessage()
    ]);
}

$conn->close();
?>