<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

// Database connection
require_once __DIR__ . "/../config/db.php";

// Get crew_id from query parameter
$crew_id = isset($_GET['crew_id']) ? intval($_GET['crew_id']) : null;

if (!$crew_id) {
    echo json_encode([
        "success" => false,
        "message" => "Crew ID is required"
    ]);
    exit();
}

try {
    // Get crew's flight assignments with details
    $query = $conn->prepare("
        SELECT 
            fc.flight_crew_id,
            f.flight_id,
            f.flight_image,
            ao.code as origin_code,
            ao.city as origin_city,
            ao.country as origin_country,
            ad.code as destination_code,
            ad.city as destination_city,
            ad.country as destination_country,
            DATE_FORMAT(f.departure_time, '%Y-%m-%d %H:%i') as departure_datetime,
            DATE_FORMAT(f.departure_time, '%Y-%m-%d') as flight_date,
            DATE_FORMAT(f.departure_time, '%H:%i') as departure_time,
            DATE_FORMAT(f.arrival_time, '%H:%i') as arrival_time,
            ac.model as aircraft_model,
            ac.capacity,
            TIMESTAMPDIFF(MINUTE, f.departure_time, f.arrival_time) as duration_minutes,
            CONCAT(
                FLOOR(TIMESTAMPDIFF(MINUTE, f.departure_time, f.arrival_time) / 60), 
                'h ', 
                MOD(TIMESTAMPDIFF(MINUTE, f.departure_time, f.arrival_time), 60), 
                'm'
            ) as duration_formatted,
            CASE 
                WHEN f.departure_time > NOW() THEN 'Upcoming'
                WHEN f.departure_time <= NOW() AND f.arrival_time > NOW() THEN 'In Progress'
                ELSE 'Completed'
            END as flight_status
        FROM Flight_Crew fc
        JOIN Flight f ON fc.flight_id = f.flight_id
        JOIN Airport ao ON f.origin_airport_id = ao.airport_id
        JOIN Airport ad ON f.destination_airport_id = ad.airport_id
        JOIN Aircraft ac ON f.aircraft_id = ac.aircraft_id
        WHERE fc.crew_id = ?
        ORDER BY f.departure_time DESC
    ");
    
    $query->bind_param("i", $crew_id);
    $query->execute();
    $result = $query->get_result();
    
    $assignments = [];
    while ($row = $result->fetch_assoc()) {
        $assignments[] = $row;
    }
    
    // Get crew member info
    $crewQuery = $conn->prepare("
        SELECT 
            u.user_id as crew_id,
            u.fname,
            u.lname,
            u.email,
            c.rank,
            c.flight_hours,
            c.phone_number
        FROM Users u
        JOIN Crew c ON u.user_id = c.crew_id
        WHERE u.user_id = ?
    ");
    
    $crewQuery->bind_param("i", $crew_id);
    $crewQuery->execute();
    $crewResult = $crewQuery->get_result();
    $crewInfo = $crewResult->fetch_assoc();
    
    if (empty($assignments)) {
        echo json_encode([
            "success" => true,
            "message" => "No flight assignments found",
            "crew_info" => $crewInfo,
            "assignments" => [],
            "count" => 0
        ]);
    } else {
        echo json_encode([
            "success" => true,
            "message" => "Assignments retrieved successfully",
            "crew_info" => $crewInfo,
            "assignments" => $assignments,
            "count" => count($assignments)
        ]);
    }
    
    $query->close();
    $crewQuery->close();
    
} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "message" => "Error: " . $e->getMessage()
    ]);
}

$conn->close();
?>