<?php
session_start();

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Check if user is logged in and is crew
if (!isset($_SESSION['user']) || $_SESSION['user']['role'] !== 'crew') {
    echo json_encode([
        "success" => false,
        "message" => "Not authenticated"
    ]);
    exit();
}

// Get crew_id from session
$crew_id = $_SESSION['user']['id'];

// Database connection - adjust path to your db.php
$host = 'localhost';
$username = 'root';
$password = '';
$database = 'flight_system';

$conn = new mysqli($host, $username, $password, $database);

// Check connection
if ($conn->connect_error) {
    echo json_encode([
        "success" => false,
        "message" => "Database connection failed"
    ]);
    exit();
}

try {
    // Get flight assignments
    $query = "
        SELECT 
            fc.flight_crew_id,
            fc.flight_id,
            f.flight_image,
            ao.code as origin_code,
            ao.city as origin_city,
            ad.code as destination_code,
            ad.city as destination_city,
            DATE_FORMAT(f.departure_time, '%Y-%m-%d') as flight_date,
            DATE_FORMAT(f.departure_time, '%H:%i') as departure_time,
            DATE_FORMAT(f.arrival_time, '%H:%i') as arrival_time,
            ac.model as aircraft_model,
            ac.capacity,
            CONCAT(
                FLOOR(TIMESTAMPDIFF(MINUTE, f.departure_time, f.arrival_time) / 60), 
                'h ', 
                MOD(TIMESTAMPDIFF(MINUTE, f.departure_time, f.arrival_time), 60), 
                'm'
            ) as duration_formatted,
            CASE 
                WHEN f.departure_time > NOW() THEN 'Upcoming'
                ELSE 'Completed'
            END as flight_status
        FROM Flight_Crew fc
        INNER JOIN Flight f ON fc.flight_id = f.flight_id
        INNER JOIN Airport ao ON f.origin_airport_id = ao.airport_id
        INNER JOIN Airport ad ON f.destination_airport_id = ad.airport_id
        INNER JOIN Aircraft ac ON f.aircraft_id = ac.aircraft_id
        WHERE fc.crew_id = $crew_id
        ORDER BY f.departure_time DESC
    ";
    
    $result = $conn->query($query);
    
    if (!$result) {
        throw new Exception("Query failed: " . $conn->error);
    }
    
    $assignments = [];
    while ($row = $result->fetch_assoc()) {
        $assignments[] = $row;
    }
    
    echo json_encode([
        "success" => true,
        "assignments" => $assignments,
        "count" => count($assignments)
    ]);
    
    $conn->close();
    
} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
    if (isset($conn)) $conn->close();
}
?>