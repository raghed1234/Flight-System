<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

require_once __DIR__ . "/../config/db.php";

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['flight_id']) || !isset($data['crew_id'])) {
    echo json_encode([
        "success" => false, 
        "message" => "Missing required fields: flight_id and crew_id"
    ]);
    exit();
}

$flight_id = intval($data['flight_id']);
$crew_id = intval($data['crew_id']);

$conn->begin_transaction();

try {
    // Check flight exists
    $checkFlight = $conn->prepare("SELECT flight_id FROM Flight WHERE flight_id = ?");
    $checkFlight->bind_param("i", $flight_id);
    $checkFlight->execute();
    if ($checkFlight->get_result()->num_rows === 0) {
        throw new Exception("Flight not found");
    }
    $checkFlight->close();
    
    // Check crew exists
    $checkCrew = $conn->prepare("SELECT crew_id FROM Crew WHERE crew_id = ?");
    $checkCrew->bind_param("i", $crew_id);
    $checkCrew->execute();
    if ($checkCrew->get_result()->num_rows === 0) {
        throw new Exception("Crew member not found");
    }
    $checkCrew->close();
    
    // Check duplicate
    $checkDup = $conn->prepare("SELECT flight_crew_id FROM Flight_Crew WHERE flight_id = ? AND crew_id = ?");
    $checkDup->bind_param("ii", $flight_id, $crew_id);
    $checkDup->execute();
    if ($checkDup->get_result()->num_rows > 0) {
        throw new Exception("This crew is already assigned to this flight");
    }
    $checkDup->close();
    
    // Insert assignment
    $stmt = $conn->prepare("INSERT INTO Flight_Crew (flight_id, crew_id) VALUES (?, ?)");
    $stmt->bind_param("ii", $flight_id, $crew_id);
    
    if (!$stmt->execute()) {
        throw new Exception("Failed to create assignment: " . $stmt->error);
    }
    
    $flight_crew_id = $stmt->insert_id;
    $stmt->close();
    
    $conn->commit();
    
    echo json_encode([
        "success" => true,
        "message" => "Crew assigned to flight successfully",
        "flight_crew_id" => $flight_crew_id
    ]);
    
} catch (Exception $e) {
    $conn->rollback();
    echo json_encode([
        "success" => false, 
        "message" => $e->getMessage()
    ]);
}

$conn->close();
?>