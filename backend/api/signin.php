<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "flight_system";

// 1. Connect to database
$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die(json_encode(["success" => false, "message" => "Connection failed"]));
}

// 2. Get JSON input from React
$data = json_decode(file_get_contents("php://input"), true);

// 3. Validate input
if (!isset($data['email'], $data['password'])) {
    echo json_encode(["success" => false, "message" => "Missing email or password"]);
    exit;
}

$email = $data['email'];
$password = $data['password'];

// 4. Find user by email
$stmt = $conn->prepare("SELECT * FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

// 5. If user not found
if ($result->num_rows === 0) {
    echo json_encode(["success" => false, "message" => "User not found"]);
    exit;
}

// 6. Fetch user data
$user = $result->fetch_assoc();

// 7. Check password (plain text for now)
if ($user['password'] !== $password) {
    echo json_encode(["success" => false, "message" => "Incorrect password"]);
    exit;
}

// 8. Success — send back user info
echo json_encode([
    "success" => true,
    "message" => "Login successful",
        "user" => [
        "id" => $user['user_id'],
        "fname" => $user['fname'],
        "lname" => $user['lname'],
        "email" => $user['email'],
        "role" => $user['role']
        ]
]);

$stmt->close();
$conn->close();
?>