<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . "/../config/db.php";

$input = file_get_contents("php://input");
$data = json_decode($input, true);

if (!isset($data['flight_id']) && isset($_GET['flight_id'])) {
    $data['flight_id'] = $_GET['flight_id'];
}

if (!isset($data['flight_id'])) {
    echo json_encode(["success" => false, "message" => "Flight ID required"]);
    exit();
}

$flight_id = intval($data['flight_id']);

$conn->begin_transaction();

try {

    /* =========================
       GET IMAGE NAME
    ========================= */
    $stmt = $conn->prepare("SELECT flight_image FROM Flight WHERE flight_id = ?");
    $stmt->bind_param("i", $flight_id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        throw new Exception("Flight not found");
    }

    $flight = $result->fetch_assoc();
    $stmt->close();

    /* =========================
       DELETE IMAGE FILE
    ========================= */
    if (!empty($flight['flight_image'])) {
        $imagePath = __DIR__ . '/../../frontend/src/assets/' . $flight['flight_image'];
        if (file_exists($imagePath)) {
            unlink($imagePath);
        }
    }

    /* =========================
       DELETE FLIGHT
    ========================= */
    $stmt = $conn->prepare("DELETE FROM Flight WHERE flight_id = ?");
    $stmt->bind_param("i", $flight_id);
    $stmt->execute();
    $stmt->close();

    $conn->commit();

    echo json_encode([
        "success" => true,
        "message" => "Flight and image deleted successfully"
    ]);

} catch (Exception $e) {

    $conn->rollback();
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}

$conn->close();
