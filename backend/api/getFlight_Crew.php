<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

require_once __DIR__ . "/../config/db.php";

try {
    $query = "
        SELECT 
            fc.flight_crew_id,
            fc.flight_id,
            fc.crew_id,
            u.fname,
            u.lname,
            u.email,
            c.rank,
            c.flight_hours,
            ao.code as origin_code,
            ao.city as origin_city,
            ad.code as destination_code,
            ad.city as destination_city,
            f.departure_time,
            f.arrival_time,
            ac.model as aircraft_model,
            ac.capacity
        FROM Flight_Crew fc
        JOIN Flight f ON fc.flight_id = f.flight_id
        JOIN Crew c ON fc.crew_id = c.crew_id
        JOIN Users u ON c.crew_id = u.user_id
        JOIN Airport ao ON f.origin_airport_id = ao.airport_id
        JOIN Airport ad ON f.destination_airport_id = ad.airport_id
        JOIN Aircraft ac ON f.aircraft_id = ac.aircraft_id
        ORDER BY fc.flight_crew_id DESC
    ";
    
    $result = $conn->query($query);
    
    if (!$result) {
        throw new Exception("Failed to fetch assignments: " . $conn->error);
    }
    
    $assignments = [];
    while ($row = $result->fetch_assoc()) {
        $assignments[] = $row;
    }
    
    echo json_encode([
        "success" => true,
        "data" => $assignments,
        "count" => count($assignments)
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        "success" => false, 
        "message" => $e->getMessage()
    ]);
}

$conn->close();
?>