<?php
// ========== ERROR HANDLING ==========
error_reporting(E_ALL); // TEMPORARILY turn ON errors for debugging
ini_set('display_errors', 1);

// ========== CORS HEADERS ==========
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ========== DATABASE ==========
$host = "localhost";
$username = "root";
$password = "";
$database = "flight_system";

$conn = new mysqli($host, $username, $password, $database);

if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "Connection failed"]);
    exit();
}

// ========== GET ACTION ==========
$action = '';

if (isset($_GET['action'])) {
    $action = $_GET['action'];
} 
else if (isset($_POST['action'])) {
    $action = $_POST['action'];
} 
else {
    $input = json_decode(file_get_contents('php://input'), true);
    if ($input && isset($input['action'])) {
        $action = $input['action'];
        $_POST = array_merge($_POST, $input);
    }
}

// ========== ROUTES ==========
switch ($action) {
    case 'getFlights':
        getFlights($conn);
        break;
    case 'getBookings':
        getBookings($conn);
        break;
    case 'bookFlight':
        bookFlight($conn);
        break;
    case 'searchFlights':
        searchFlights($conn);
        break;
    default:
        echo json_encode(["success" => false, "message" => "Invalid action: $action"]);
        break;
}

// ========== FUNCTIONS ==========
function getFlights($conn) {
    $sql = "SELECT * FROM vw_exploreflights ORDER BY departure_time ASC";
    $result = $conn->query($sql);
    
    if ($result) {
        $flights = [];
        while($row = $result->fetch_assoc()) {
            $flights[] = $row;
        }
        echo json_encode(["success" => true, "data" => $flights]);
    } else {
        echo json_encode(["success" => false, "message" => "Error fetching flights"]);
    }
}

function getBookings($conn) {
    $user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;
    
    error_log("🔍 DEBUG: Fetching bookings for user_id = " . $user_id);
    
    if (!$user_id) {
        echo json_encode(["success" => false, "message" => "User ID required"]);
        return;
    }
    
    // ⚠️ ISSUE: vw_bookingdetails doesn't have passenger_id column!
    // We need to get it from the booking table directly
    $sql = "SELECT 
                vbd.*,
                b.passenger_id
            FROM vw_bookingdetails vbd
            JOIN booking b ON vbd.booking_id = b.booking_id
            WHERE b.passenger_id = ?
            ORDER BY vbd.booking_date DESC";
    
    $stmt = $conn->prepare($sql);
    
    if (!$stmt) {
        error_log("❌ Prepare failed: " . $conn->error);
        echo json_encode(["success" => false, "message" => "Query preparation failed: " . $conn->error]);
        return;
    }
    
    $stmt->bind_param("i", $user_id);
    
    if (!$stmt->execute()) {
        error_log("❌ Execute failed: " . $stmt->error);
        echo json_encode(["success" => false, "message" => "Query execution failed: " . $stmt->error]);
        return;
    }
    
    $result = $stmt->get_result();
    
    $bookings = [];
    while($row = $result->fetch_assoc()) {
        $bookings[] = $row;
    }
    
    error_log("✅ Found " . count($bookings) . " bookings for user " . $user_id);
    
    echo json_encode([
        "success" => true, 
        "data" => $bookings, 
        "count" => count($bookings),
        "user_id" => $user_id
    ]);
}

function bookFlight($conn) {
    // Get data
    $user_id = isset($_POST['user_id']) ? intval($_POST['user_id']) : 0;
    $flight_id = isset($_POST['flight_id']) ? intval($_POST['flight_id']) : 0;
    $seat_number = isset($_POST['seat_number']) ? trim($_POST['seat_number']) : 'A1'; // Default seat
    
    error_log("📌 Booking attempt: user=$user_id, flight=$flight_id, seat=$seat_number");
    
    // Validate
    if (!$user_id || !$flight_id) {
        echo json_encode(["success" => false, "message" => "Missing user_id or flight_id"]);
        return;
    }
    
    try {
        // Start transaction
        $conn->begin_transaction();
        
        // Check/create passenger
        $check_sql = "SELECT passenger_id FROM passenger WHERE passenger_id = ?";
        $stmt = $conn->prepare($check_sql);
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows == 0) {
            $insert_sql = "INSERT INTO passenger (passenger_id, phone_number) VALUES (?, NULL)";
            $stmt = $conn->prepare($insert_sql);
            $stmt->bind_param("i", $user_id);
            if (!$stmt->execute()) {
                throw new Exception("Failed to create passenger");
            }
            error_log("✅ Created new passenger: $user_id");
        }
        
        // Insert booking
        $booking_sql = "INSERT INTO booking (passenger_id, flight_id, seat_number, booking_date) 
                       VALUES (?, ?, ?, NOW())";
        $stmt = $conn->prepare($booking_sql);
        $stmt->bind_param("iis", $user_id, $flight_id, $seat_number);
        
        if ($stmt->execute()) {
            $booking_id = $conn->insert_id;
            $conn->commit();
            
            error_log("✅ Booking created: booking_id=$booking_id");
            
            echo json_encode([
                "success" => true, 
                "message" => "Flight booked!",
                "booking_id" => $booking_id,
                "seat_number" => $seat_number
            ]);
        } else {
            throw new Exception("Booking failed: " . $stmt->error);
        }
        
    } catch (Exception $e) {
        $conn->rollback();
        error_log("❌ Booking error: " . $e->getMessage());
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }
}

function searchFlights($conn) {
    // Simplified - you can add this later
    echo json_encode(["success" => false, "message" => "Not implemented"]);
}

// Close connection
$conn->close();
?>