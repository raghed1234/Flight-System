<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
// signup.php

// 1. Database connection
$servername = "localhost";
$username = "root";
$password = ""; // default XAMPP password is empty
$dbname = "flightsystem";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die(json_encode(["success" => false, "message" => "Connection failed: " . $conn->connect_error]));
}

// 2. Get JSON input from React
$data = json_decode(file_get_contents("php://input"), true);

// 3. Validate input (basic)
if (!isset($data['name'], $data['phone'], $data['email'], $data['password'])) {
    echo json_encode(["success" => false, "message" => "Missing required fields"]);
    exit;
}

// 4. Prepare SQL to avoid SQL injection
$stmt = $conn->prepare("INSERT INTO users (name, phone, email, password) VALUES (?, ?, ?, ?)");
$stmt->bind_param("ssss", $data['name'], $data['phone'], $data['email'], $data['password']);

// 5. Execute
if ($stmt->execute()) {
    echo json_encode(["success" => true, "message" => "User registered successfully"]);
} else {
    echo json_encode(["success" => false, "message" => $stmt->error]);
}

$stmt->close();
$conn->close();
?>