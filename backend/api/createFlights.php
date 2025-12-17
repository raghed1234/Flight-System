<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . "/../config/db.php";

/* =========================
   HANDLE INPUT
========================= */
if (!empty($_FILES['flight_image']['name'])) {
    $data = $_POST;
    $file = $_FILES['flight_image'];
} else {
    $input = file_get_contents("php://input");
    $data = json_decode($input, true);
    $file = null;
}

/* =========================
   VALIDATION
========================= */
if (
    !isset($data['origin_airport_id']) ||
    !isset($data['destination_airport_id']) ||
    !isset($data['departure_time']) ||
    !isset($data['arrival_time']) ||
    !isset($data['aircraft_id'])
) {
    echo json_encode([
        "success" => false,
        "message" => "Missing required fields"
    ]);
    exit();
}

$origin_airport_id = intval($data['origin_airport_id']);
$destination_airport_id = intval($data['destination_airport_id']);
$departure_time = trim($data['departure_time']);
$arrival_time = trim($data['arrival_time']);
$aircraft_id = intval($data['aircraft_id']);

/* =========================
   IMAGE UPLOAD
========================= */
$flight_image = null;

if ($file && $file['error'] === UPLOAD_ERR_OK) {

    $uploadDir = __DIR__ . '/../../frontend/src/assets/';
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    $allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

    if (!in_array($ext, $allowed)) {
        echo json_encode(["success" => false, "message" => "Invalid image type"]);
        exit();
    }

    $fileName = 'flight_' . time() . '_' . uniqid() . '.' . $ext;
    $filePath = $uploadDir . $fileName;

    if (!move_uploaded_file($file['tmp_name'], $filePath)) {
        echo json_encode(["success" => false, "message" => "Image upload failed"]);
        exit();
    }

    // ✅ STORE ONLY filename
    $flight_image = $fileName;
}

/* =========================
   INSERT FLIGHT
========================= */
try {

    if ($flight_image) {
        $stmt = $conn->prepare(
            "INSERT INTO Flight 
            (origin_airport_id, destination_airport_id, departure_time, arrival_time, aircraft_id, flight_image)
            VALUES (?, ?, ?, ?, ?, ?)"
        );
        $stmt->bind_param(
            "iissis",
            $origin_airport_id,
            $destination_airport_id,
            $departure_time,
            $arrival_time,
            $aircraft_id,
            $flight_image
        );
    } else {
        $stmt = $conn->prepare(
            "INSERT INTO Flight 
            (origin_airport_id, destination_airport_id, departure_time, arrival_time, aircraft_id)
            VALUES (?, ?, ?, ?, ?)"
        );
        $stmt->bind_param(
            "iissi",
            $origin_airport_id,
            $destination_airport_id,
            $departure_time,
            $arrival_time,
            $aircraft_id
        );
    }

    $stmt->execute();
    $flight_id = $stmt->insert_id;
    $stmt->close();

    /* =========================
       FETCH CREATED FLIGHT
    ========================= */
    $stmt = $conn->prepare("
        SELECT f.*, 
               ao.code AS origin_code, ao.city AS origin_city,
               ad.code AS destination_code, ad.city AS destination_city,
               ac.model AS aircraft_model
        FROM Flight f
        JOIN Airport ao ON f.origin_airport_id = ao.airport_id
        JOIN Airport ad ON f.destination_airport_id = ad.airport_id
        JOIN Aircraft ac ON f.aircraft_id = ac.aircraft_id
        WHERE f.flight_id = ?
    ");
    $stmt->bind_param("i", $flight_id);
    $stmt->execute();
    $flight = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if ($flight['flight_image']) {
        $flight['flight_image_url'] =
            'http://' . $_SERVER['HTTP_HOST'] . '/frontend/src/assets/' . $flight['flight_image'];
    }

    echo json_encode([
        "success" => true,
        "message" => "Flight created successfully",
        "data" => $flight
    ]);

} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}

$conn->close();
