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
$airport_id = null;

// First try to get from query parameters
if (isset($_GET['id'])) {
    $airport_id = intval($_GET['id']);
} 
// If not in query params, try JSON body
else {
    $input = file_get_contents("php://input");
    $data = json_decode($input, true);
    
    if (json_last_error() === JSON_ERROR_NONE && isset($data['airport_id'])) {
        $airport_id = intval($data['airport_id']);
    }
}

// Validate airport ID
if (!$airport_id) {
    echo json_encode([
        "success" => false,
        "message" => "Missing required parameter: airport_id. Provide as query parameter ?id= or in JSON body"
    ]);
    exit();
}

try {
    // Check if airport exists
    $checkStmt = $conn->prepare("SELECT * FROM Airport WHERE airport_id = ?");
    $checkStmt->bind_param("i", $airport_id);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();
    
    if ($checkResult->num_rows === 0) {
        echo json_encode([
            "success" => false,
            "message" => "Airport not found"
        ]);
        exit();
    }
    
    $airport = $checkResult->fetch_assoc();
    $checkStmt->close();
    
    // Check if airport is referenced in flights (as origin or destination)
    $refCheckStmt = $conn->prepare("
        SELECT 
            (SELECT COUNT(*) FROM Flight WHERE origin_airport_id = ?) as origin_count,
            (SELECT COUNT(*) FROM Flight WHERE destination_airport_id = ?) as destination_count
    ");
    $refCheckStmt->bind_param("ii", $airport_id, $airport_id);
    $refCheckStmt->execute();
    $refResult = $refCheckStmt->get_result();
    $refData = $refResult->fetch_assoc();
    $refCheckStmt->close();
    
    $totalReferences = $refData['origin_count'] + $refData['destination_count'];
    
    if ($totalReferences > 0 && !isset($_GET['force'])) {
        echo json_encode([
            "success" => false,
            "message" => "Cannot delete airport: It is referenced in $totalReferences flight(s).",
            "references" => [
                "as_origin" => $refData['origin_count'],
                "as_destination" => $refData['destination_count']
            ],
            "hint" => "Add ?force=true to query parameters to force deletion (this will also delete related flights)"
        ]);
        exit();
    }
    
    // Start transaction
    $conn->begin_transaction();
    
    try {
        // If forced deletion, first delete related flights
        if (isset($_GET['force']) && $_GET['force'] === 'true') {
            // Delete flights where airport is origin
            $delFlightsOrigin = $conn->prepare("DELETE FROM Flight WHERE origin_airport_id = ?");
            $delFlightsOrigin->bind_param("i", $airport_id);
            $delFlightsOrigin->execute();
            $delFlightsOrigin->close();
            
            // Delete flights where airport is destination
            $delFlightsDest = $conn->prepare("DELETE FROM Flight WHERE destination_airport_id = ?");
            $delFlightsDest->bind_param("i", $airport_id);
            $delFlightsDest->execute();
            $delFlightsDest->close();
        }
        
        // Delete the airport
        $stmt = $conn->prepare("DELETE FROM Airport WHERE airport_id = ?");
        $stmt->bind_param("i", $airport_id);
        
        if (!$stmt->execute()) {
            throw new Exception("Failed to delete airport: " . $stmt->error);
        }
        
        $affectedRows = $stmt->affected_rows;
        $stmt->close();
        
        // Commit transaction
        $conn->commit();
        
        echo json_encode([
            "success" => true,
            "message" => "Airport deleted successfully",
            "affected_rows" => $affectedRows,
            "deleted_data" => $airport,
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
        "message" => "Failed to delete airport: " . $e->getMessage()
    ]);
}

$conn->close();
?>