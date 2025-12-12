<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: PUT");
header("Access-Control-Allow-Headers: Content-Type");

// Database connection
require_once __DIR__ . "/../config/db.php";

// Get PUT data
$data = json_decode(file_get_contents("php://input"), true);

// Validate required field
if (!isset($data['passenger_id'])) {
    echo json_encode([
        "success" => false,
        "message" => "Passenger ID is required"
    ]);
    exit();
}

$passenger_id = intval($data['passenger_id']);

// Check which fields to update
$updateFields = [];
$updateValues = [];
$types = "";

if (isset($data['fname'])) {
    $updateFields[] = "fname = ?";
    $updateValues[] = $conn->real_escape_string(trim($data['fname']));
    $types .= "s";
}

if (isset($data['lname'])) {
    $updateFields[] = "lname = ?";
    $updateValues[] = $conn->real_escape_string(trim($data['lname']));
    $types .= "s";
}

if (isset($data['phone_number'])) {
    $phone = $conn->real_escape_string(trim($data['phone_number']));
    
    // Check if phone already exists for another passenger
    $checkPhoneStmt = $conn->prepare("SELECT passenger_id FROM Passenger WHERE phone_number = ? AND passenger_id != ?");
    $checkPhoneStmt->bind_param("si", $phone, $passenger_id);
    $checkPhoneStmt->execute();
    $checkPhoneResult = $checkPhoneStmt->get_result();
    
    if ($checkPhoneResult->num_rows > 0) {
        echo json_encode([
            "success" => false,
            "message" => "Phone number already exists for another passenger"
        ]);
        exit();
    }
    $checkPhoneStmt->close();
    
    $updateFields[] = "phone_number = ?";
    $updateValues[] = $phone;
    $types .= "s";
}

// If no fields to update
if (empty($updateFields)) {
    echo json_encode([
        "success" => false,
        "message" => "No fields to update"
    ]);
    exit();
}

// Start transaction
$conn->begin_transaction();

try {
    // Update Users table if fname or lname changed
    if (isset($data['fname']) || isset($data['lname'])) {
        $userFields = [];
        $userValues = [];
        $userTypes = "";
        
        if (isset($data['fname'])) {
            $userFields[] = "fname = ?";
            $userValues[] = $conn->real_escape_string(trim($data['fname']));
            $userTypes .= "s";
        }
        
        if (isset($data['lname'])) {
            $userFields[] = "lname = ?";
            $userValues[] = $conn->real_escape_string(trim($data['lname']));
            $userTypes .= "s";
        }
        
        $userValues[] = $passenger_id;
        $userTypes .= "i";
        
        $userQuery = "UPDATE Users SET " . implode(", ", $userFields) . " WHERE user_id = ?";
        $userStmt = $conn->prepare($userQuery);
        $userStmt->bind_param($userTypes, ...$userValues);
        
        if (!$userStmt->execute()) {
            throw new Exception("Failed to update user: " . $userStmt->error);
        }
        $userStmt->close();
    }
    
    // Update Passenger table if phone changed
    if (isset($data['phone_number'])) {
        $passengerQuery = "UPDATE Passenger SET phone_number = ? WHERE passenger_id = ?";
        $passengerStmt = $conn->prepare($passengerQuery);
        $passengerStmt->bind_param("si", $phone, $passenger_id);
        
        if (!$passengerStmt->execute()) {
            throw new Exception("Failed to update passenger: " . $passengerStmt->error);
        }
        $passengerStmt->close();
    }
    
    // Commit transaction
    $conn->commit();
    
    // Get updated passenger data
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
        WHERE u.user_id = ?
    ");
    $stmt->bind_param("i", $passenger_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $updatedPassenger = $result->fetch_assoc();
    $stmt->close();
    
    echo json_encode([
        "success" => true,
        "message" => "Passenger updated successfully",
        "data" => $updatedPassenger
    ]);
    
} catch (Exception $e) {
    // Rollback on error
    $conn->rollback();
    echo json_encode([
        "success" => false,
        "message" => "Failed to update passenger: " . $e->getMessage()
    ]);
}

$conn->close();
?>