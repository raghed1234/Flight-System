<?php
// ===== Show errors for debugging =====
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// ===== Database connection info =====
$host = "localhost";
$user = "root";
$pass = "";
$dbname = "flight_system";

// ===== Create connection with exception handling =====
try {
    // Create connection
    $conn = new mysqli($host, $user, $pass, $dbname);
    
    // Check connection
    if ($conn->connect_error) {
        throw new Exception("Database connection failed: " . $conn->connect_error);
    }
    
    // Set charset
    if (!$conn->set_charset("utf8mb4")) {
        throw new Exception("Error setting charset: " . $conn->error);
    }
    
} catch (Exception $e) {
    // Log the error (for debugging)
    error_log("Database Error: " . $e->getMessage());
    
    // Return JSON error response
    header("Content-Type: application/json");
    die(json_encode([
        "success" => false,
        "message" => "Database connection error",
        "error" => $e->getMessage() // Only for development
    ]));
}

// Connection successful - no echo here!
?>