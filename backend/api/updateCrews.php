<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: PUT, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database connection
require_once __DIR__ . "/../config/db.php";

// Get input data
$input = file_get_contents("php://input");
$data = json_decode($input, true);

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
    // Update Users table if needed
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
    
    if (isset($data['email'])) {
        // Check if email is unique
        $checkEmailStmt = $conn->prepare("SELECT user_id FROM Users WHERE email = ? AND user_id != ?");
        $checkEmailStmt->bind_param("si", $data['email'], $crew_id);
        $checkEmailStmt->execute();
        $checkEmailResult = $checkEmailStmt->get_result();
        
        if ($checkEmailResult->num_rows > 0) {
            throw new Exception("Email already exists for another user");
        }
        $checkEmailStmt->close();
        
        $userFields[] = "email = ?";
        $userValues[] = $conn->real_escape_string(trim($data['email']));
        $userTypes .= "s";
    }
    
    if (isset($data['password']) && !empty($data['password'])) {
        $password_hash = password_hash($data['password'], PASSWORD_DEFAULT);
        $userFields[] = "password = ?";
        $userValues[] = $password_hash;
        $userTypes .= "s";
    }
    
    if (!empty($userFields)) {
        $userValues[] = $crew_id;
        $userTypes .= "i";
        
        $userQuery = "UPDATE Users SET " . implode(", ", $userFields) . " WHERE user_id = ?";
        $userStmt = $conn->prepare($userQuery);
        $userStmt->bind_param($userTypes, ...$userValues);
        
        if (!$userStmt->execute()) {
            throw new Exception("Failed to update user: " . $userStmt->error);
        }
        $userStmt->close();
    }
    
    // Update Crew table
    $crewFields = [];
    $crewValues = [];
    $crewTypes = "";
    
    if (isset($data['rank'])) {
        $crewFields[] = "rank = ?";
        $crewValues[] = $conn->real_escape_string(trim($data['rank']));
        $crewTypes .= "s";
    }
    
    if (isset($data['flight_hours'])) {
        $crewFields[] = "flight_hours = ?";
        $crewValues[] = floatval($data['flight_hours']);
        $crewTypes .= "d";
    }
    
    if (isset($data['phone_number'])) {
        $phone = $data['phone_number'] ? $conn->real_escape_string(trim($data['phone_number'])) : null;
        
        if ($phone) {
            $checkPhoneStmt = $conn->prepare("SELECT crew_id FROM Crew WHERE phone_number = ? AND crew_id != ?");
            $checkPhoneStmt->bind_param("si", $phone, $crew_id);
            $checkPhoneStmt->execute();
            $checkPhoneResult = $checkPhoneStmt->get_result();
            
            if ($checkPhoneResult->num_rows > 0) {
                throw new Exception("Phone number already exists for another crew member");
            }
            $checkPhoneStmt->close();
        }
        
        $crewFields[] = "phone_number = ?";
        $crewValues[] = $phone;
        $crewTypes .= "s";
    }
    
    if (!empty($crewFields)) {
        $crewValues[] = $crew_id;
        $crewTypes .= "i";
        
        $crewQuery = "UPDATE Crew SET " . implode(", ", $crewFields) . " WHERE crew_id = ?";
        $crewStmt = $conn->prepare($crewQuery);
        $crewStmt->bind_param($crewTypes, ...$crewValues);
        
        if (!$crewStmt->execute()) {
            throw new Exception("Failed to update crew: " . $crewStmt->error);
        }
        $crewStmt->close();
    }
    
    // Commit transaction
    $conn->commit();
    
    // Get updated crew data
    $stmt = $conn->prepare("
        SELECT 
            u.user_id as crew_id,
            u.email,
            u.fname,
            u.lname,
            u.role,
            c.rank,
            c.flight_hours,
            c.phone_number
        FROM Users u
        JOIN Crew c ON u.user_id = c.crew_id
        WHERE u.user_id = ?
    ");
    $stmt->bind_param("i", $crew_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $updatedCrew = $result->fetch_assoc();
    $stmt->close();
    
    echo json_encode([
        "success" => true,
        "message" => "Crew member updated successfully",
        "data" => $updatedCrew
    ]);
    
} catch (Exception $e) {
    // Rollback on error
    $conn->rollback();
    echo json_encode([
        "success" => false,
        "message" => "Failed to update crew member: " . $e->getMessage()
    ]);
}

$conn->close();
?>