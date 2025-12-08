<?php
// ========== CORS HEADERS - MUST BE FIRST ==========
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Max-Age: 86400"); // 24 hours

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Set content type
header("Content-Type: application/json");

// ========== DATABASE CONNECTION ==========
$host = "localhost";
$username = "root";
$password = "";
$database = "flight_system";

$conn = new mysqli($host, $username, $password, $database);

if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "Connection failed: " . $conn->connect_error]);
    exit();
}

// ========== GET ACTION PARAMETER ==========
$action = '';

// Check GET parameter first
if (isset($_GET['action'])) {
    $action = $_GET['action'];
} 
// Check POST parameter (form data)
else if (isset($_POST['action'])) {
    $action = $_POST['action'];
} 
// Check JSON input
else {
    $input = json_decode(file_get_contents('php://input'), true);
    if ($input && isset($input['action'])) {
        $action = $input['action'];
        // Merge JSON data into $_POST for easy access
        $_POST = array_merge($_POST, $input);
    }
}

// ========== ROUTE ACTIONS ==========
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
        echo json_encode([
            "success" => false, 
            "message" => "Invalid action", 
            "received_action" => $action,
            "method" => $_SERVER['REQUEST_METHOD']
        ]);
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
        echo json_encode(["success" => false, "message" => "Error fetching flights: " . $conn->error]);
    }
}

function getBookings($conn) {
    // Get user_id from GET parameter
    $user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;
    
    if (!$user_id) {
        echo json_encode(["success" => false, "message" => "User ID required"]);
        return;
    }
    
    try {
        // Get bookings using the view
        $sql = "SELECT * FROM vw_bookingdetails 
                WHERE passenger_fname IN (
                    SELECT fname FROM users WHERE user_id = ?
                ) ORDER BY booking_date DESC";
        
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $bookings = [];
        while($row = $result->fetch_assoc()) {
            $bookings[] = $row;
        }
        
        echo json_encode(["success" => true, "data" => $bookings]);
        
    } catch (Exception $e) {
        echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
    }
}

function bookFlight($conn) {
    // Get data from POST (could be form data or JSON)
    $user_id = isset($_POST['user_id']) ? intval($_POST['user_id']) : 0;
    $flight_id = isset($_POST['flight_id']) ? intval($_POST['flight_id']) : 0;
    $seat_number = isset($_POST['seat_number']) ? trim($_POST['seat_number']) : '';
    
    // Debug log
    error_log("Booking attempt - user_id: $user_id, flight_id: $flight_id, seat: $seat_number");
    
    if (!$user_id || !$flight_id || !$seat_number) {
        echo json_encode([
            "success" => false, 
            "message" => "Missing required fields",
            "debug" => [
                "user_id" => $user_id,
                "flight_id" => $flight_id,
                "seat_number" => $seat_number,
                "post_data" => $_POST
            ]
        ]);
        return;
    }
    
    try {
        // Start transaction
        $conn->begin_transaction();
        
        // Check if passenger exists, create if not
        $check_sql = "SELECT passenger_id FROM passenger WHERE passenger_id = ?";
        $stmt = $conn->prepare($check_sql);
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows == 0) {
            // Create passenger record
            $insert_sql = "INSERT INTO passenger (passenger_id, phone_number) VALUES (?, NULL)";
            $stmt = $conn->prepare($insert_sql);
            $stmt->bind_param("i", $user_id);
            if (!$stmt->execute()) {
                throw new Exception("Failed to create passenger: " . $stmt->error);
            }
        }
        
        // SIMPLIFIED: Just insert booking without capacity checks for now
        $booking_sql = "INSERT INTO booking (passenger_id, flight_id, seat_number, booking_date) 
                       VALUES (?, ?, ?, NOW())";
        $stmt = $conn->prepare($booking_sql);
        $stmt->bind_param("iis", $user_id, $flight_id, $seat_number);
        
        if ($stmt->execute()) {
            $booking_id = $conn->insert_id;
            $conn->commit();
            
            echo json_encode([
                "success" => true, 
                "message" => "Flight booked successfully!",
                "booking_id" => $booking_id,
                "seat_number" => $seat_number
            ]);
        } else {
            throw new Exception("Booking failed: " . $stmt->error);
        }
        
    } catch (Exception $e) {
        $conn->rollback();
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }
}

function searchFlights($conn) {
    // Similar to your existing function
    $origin = isset($_GET['origin']) ? $_GET['origin'] : '';
    $destination = isset($_GET['destination']) ? $_GET['destination'] : '';
    $departure_date = isset($_GET['departure_date']) ? $_GET['departure_date'] : '';
    
    $sql = "SELECT * FROM vw_exploreflights WHERE 1=1";
    $params = [];
    $types = "";
    
    if (!empty($origin)) {
        $sql .= " AND (origin_code LIKE ? OR origin_city LIKE ?)";
        $params[] = "%$origin%";
        $params[] = "%$origin%";
        $types .= "ss";
    }
    
    if (!empty($destination)) {
        $sql .= " AND (destination_code LIKE ? OR destination_city LIKE ?)";
        $params[] = "%$destination%";
        $params[] = "%$destination%";
        $types .= "ss";
    }
    
    if (!empty($departure_date)) {
        $sql .= " AND DATE(departure_time) = ?";
        $params[] = $departure_date;
        $types .= "s";
    }
    
    $sql .= " ORDER BY departure_time ASC";
    
    $stmt = $conn->prepare($sql);
    
    if ($params) {
        $stmt->bind_param($types, ...$params);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    
    $flights = [];
    while($row = $result->fetch_assoc()) {
        $flights[] = $row;
    }
    
    echo json_encode(["success" => true, "data" => $flights]);
}

// Close connection
$conn->close();
?>