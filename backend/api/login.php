<?php
session_start();
// Allow multiple ports
$allowed_origins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $origin);
}

header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");



// ===== Handle preflight requests =====
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ===== Only allow POST =====
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit();
}

// ===== Include database connection =====
require_once __DIR__ . "/../config/db.php";

try {
    // ===== Get JSON input =====
    $input = file_get_contents('php://input');
    if (empty($input)) {
        echo json_encode(["status" => "error", "message" => "No data received"]);
        exit();
    }
    
    $data = json_decode($input, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        echo json_encode(["status" => "error", "message" => "Invalid JSON data"]);
        exit();
    }
    
    $email = trim($data["email"] ?? "");
    $password = trim($data["password"] ?? "");

    if (empty($email) || empty($password)) {
        echo json_encode(["status" => "error", "message" => "Email and password are required"]);
        exit();
    }

    // ===== Check if user exists =====
    $sql = "SELECT user_id, email, password, fname, lname, role FROM Users WHERE email = ?";
    $stmt = $conn->prepare($sql);
    
    if (!$stmt) {
        throw new Exception("Query preparation failed: " . $conn->error);
    }
    
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        echo json_encode(["status" => "error", "message" => "Invalid email or password"]);
        $stmt->close();
        $conn->close();
        exit();
    }
    
    $user = $result->fetch_assoc();
    $stmt->close();
    
    // ===== Verify password =====
    $passwordValid = false;
    
    // Method 1: password_verify for hashed passwords
    if (password_verify($password, $user["password"])) {
        $passwordValid = true;
    } 
    // Method 2: Direct comparison (for testing)
    elseif ($password === $user["password"]) {
        $passwordValid = true;
    }
    
    if (!$passwordValid) {
        echo json_encode(["status" => "error", "message" => "Invalid email or password"]);
        $conn->close();
        exit();
    }

    $user_id = $user["user_id"];
    $role = $user["role"];
    $additional_info = [];
    
    // ===== Get additional info based on role =====
    if ($role === 'admin') {
        $admin_sql = "SELECT admin_id FROM Admin WHERE admin_id = ?";
        $admin_stmt = $conn->prepare($admin_sql);
        $admin_stmt->bind_param("i", $user_id);
        $admin_stmt->execute();
        $admin_result = $admin_stmt->get_result();
        
        if ($admin_result->num_rows > 0) {
            $additional_info['is_admin'] = true;
        }
        $admin_stmt->close();
        
    } elseif ($role === 'crew') {
        $crew_sql = "SELECT crew_id, rank, flight_hours, phone_number FROM Crew WHERE crew_id = ?";
        $crew_stmt = $conn->prepare($crew_sql);
        $crew_stmt->bind_param("i", $user_id);
        $crew_stmt->execute();
        $crew_result = $crew_stmt->get_result();
        
        if ($crew_data = $crew_result->fetch_assoc()) {
            $additional_info = $crew_data;
        }
        $crew_stmt->close();
        
    } elseif ($role === 'passenger') {
        $passenger_sql = "SELECT passenger_id, phone_number FROM Passenger WHERE passenger_id = ?";
        $passenger_stmt = $conn->prepare($passenger_sql);
        $passenger_stmt->bind_param("i", $user_id);
        $passenger_stmt->execute();
        $passenger_result = $passenger_stmt->get_result();
        
        if ($passenger_data = $passenger_result->fetch_assoc()) {
            $additional_info = $passenger_data;
        }
        $passenger_stmt->close();
    }

    // ===== Prepare user data =====
    $user_data = [
        'id' => $user["user_id"],
        'fname' => $user["fname"],
        'lname' => $user["lname"],
        'email' => $user["email"],
        'role' => $role
    ];
    
    // Merge additional info (like phone_number, etc.)
    $user_data = array_merge($user_data, $additional_info);
    
    // ===== Store in session =====
    $_SESSION['user'] = $user_data;
    $_SESSION['logged_in'] = true;

    // ===== Success response =====
    echo json_encode([
        "status" => "success",
        "message" => "Login successful",
        "user" => $user_data  // This should be 'user' not 'data'
    ]);
    
    // ===== Clean up =====
    $conn->close();
    
} catch (Exception $e) {
    // ===== Error handling =====
    session_unset();
    session_destroy();
    
    http_response_code(500);
    echo json_encode([
        "status" => "error", 
        "message" => "Server error: " . $e->getMessage()
    ]);
    
    // Log error for debugging
    error_log("Login Error: " . $e->getMessage() . " at " . date('Y-m-d H:i:s'));
    
    if (isset($conn) && $conn) {
        $conn->close();
    }
}
?>