<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database connection
require_once __DIR__ . "/../config/db.php";

// Check if requesting single crew member or all crew members
if (isset($_GET['crew_id'])) {
    // Get single crew member
    $crew_id = intval($_GET['crew_id']);
    
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
        WHERE u.user_id = ? AND u.role = 'crew'
    ");
    $stmt->bind_param("i", $crew_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $crew = $result->fetch_assoc();
        echo json_encode([
            "success" => true,
            "data" => $crew
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "Crew member not found"
        ]);
    }
    
    $stmt->close();
} else {
    // Get all crew members
    $result = $conn->query("
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
        WHERE u.role = 'crew'
        ORDER BY u.user_id
    ");
    
    $crew_members = [];
    while ($row = $result->fetch_assoc()) {
        $crew_members[] = $row;
    }
    
    echo json_encode([
        "success" => true,
        "count" => count($crew_members),
        "data" => $crew_members
    ]);
}

$conn->close();
?>