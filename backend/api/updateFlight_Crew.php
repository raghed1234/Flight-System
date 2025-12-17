<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: PUT");
header("Access-Control-Allow-Headers: Content-Type");

require_once __DIR__ . "/../config/db.php";

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['flight_crew_id']) || !isset($data['flight_id']) || !isset($data['crew_id'])) {
    echo json_encode([
        "success" => false, 
        "message" => "Missing required fields: flight_crew_id, flight_id, and crew_id"
    ]);
    exit();
}

$flight_crew_id = intval($data['flight_crew_id']);
$flight_id = intval($data['flight_id']);
$crew_id = intval($data['crew_id']);

$conn->begin_transaction();

try {
    // Check assignment exists
    $check = $conn->prepare("SELECT flight_crew_id FROM Flight_Crew WHERE flight_crew_id = ?");
    $check->bind_param("i", $flight_crew_id);
    $check->execute();
    if ($check->get_result()->num_rows === 0) {
        throw new Exception("Assignment not found");
    }
    $check->close();
    
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
    
    // Check duplicate (excluding current)
    $checkDup = $conn->prepare("SELECT flight_crew_id FROM Flight_Crew WHERE flight_id = ? AND crew_id = ? AND flight_crew_id != ?");
    $checkDup->bind_param("iii", $flight_id, $crew_id, $flight_crew_id);
    $checkDup->execute();
    if ($checkDup->get_result()->num_rows > 0) {
        throw new Exception("This crew is already assigned to this flight");
    }
    $checkDup->close();
    
    // Update assignment
    $stmt = $conn->prepare("UPDATE Flight_Crew SET flight_id = ?, crew_id = ? WHERE flight_crew_id = ?");
    $stmt->bind_param("iii", $flight_id, $crew_id, $flight_crew_id);
    
    if (!$stmt->execute()) {
        throw new Exception("Failed to update assignment: " . $stmt->error);
    }
    
    $stmt->close();
    $conn->commit();
    
    echo json_encode([
        "success" => true,
        "message" => "Assignment updated successfully"
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