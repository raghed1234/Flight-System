<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: DELETE");
header("Access-Control-Allow-Headers: Content-Type");

require_once __DIR__ . "/../config/db.php";

// Get ID from URL parameter
$flight_crew_id = isset($_GET['id']) ? intval($_GET['id']) : null;

// If not in URL, check request body
if (!$flight_crew_id) {
    $data = json_decode(file_get_contents("php://input"), true);
    $flight_crew_id = isset($data['flight_crew_id']) ? intval($data['flight_crew_id']) : null;
}

if (!$flight_crew_id) {
    echo json_encode([
        "success" => false, 
        "message" => "Missing required parameter: flight_crew_id"
    ]);
    exit();
}

try {
    // Delete assignment
    $stmt = $conn->prepare("DELETE FROM Flight_Crew WHERE flight_crew_id = ?");
    $stmt->bind_param("i", $flight_crew_id);
    
    if (!$stmt->execute()) {
        throw new Exception("Failed to delete assignment: " . $stmt->error);
    }
    
    if ($stmt->affected_rows === 0) {
        throw new Exception("Assignment not found");
    }
    
    $stmt->close();
    
    echo json_encode([
        "success" => true,
        "message" => "Assignment deleted successfully"
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        "success" => false, 
        "message" => $e->getMessage()
    ]);
}

$conn->close();
?>