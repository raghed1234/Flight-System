<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database connection
require_once __DIR__ . "/../config/db.php";

// Get DELETE data
$admin_id = 0;

// Try to get admin_id from query string
if (isset($_GET['admin_id']) && is_numeric($_GET['admin_id'])) {
    $admin_id = intval($_GET['admin_id']);
} 
// Try to get from JSON body
else {
    $input = file_get_contents("php://input");
    if (!empty($input)) {
        $data = json_decode($input, true);
        if (isset($data['admin_id']) && is_numeric($data['admin_id'])) {
            $admin_id = intval($data['admin_id']);
        }
    }
}

// Validate admin_id
if ($admin_id <= 0) {
    echo json_encode([
        "success" => false,
        "message" => "Valid Admin ID is required"
    ]);
    exit();
}

// Start transaction
$conn->begin_transaction();

try {
    // First, check if admin exists
    $checkStmt = $conn->prepare("SELECT u.user_id FROM Users u INNER JOIN Admin a ON u.user_id = a.admin_id WHERE u.user_id = ?");
    $checkStmt->bind_param("i", $admin_id);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();
    $checkStmt->close();
    
    if ($checkResult->num_rows === 0) {
        // Admin doesn't exist or is not in Admin table
        echo json_encode([
            "success" => false,
            "message" => "Admin not found in the system"
        ]);
        exit();
    }
    
    // Delete admin
    $stmt = $conn->prepare("DELETE FROM Users WHERE user_id = ?");
    $stmt->bind_param("i", $admin_id);
    
    if (!$stmt->execute()) {
        throw new Exception("Delete query failed: " . $stmt->error);
    }
    
    $affected_rows = $stmt->affected_rows;
    $stmt->close();
    
    // Commit transaction
    $conn->commit();
    
    if ($affected_rows > 0) {
        echo json_encode([
            "success" => true,
            "message" => "Admin deleted successfully",
            "admin_id" => $admin_id
        ]);
    } else {
        // This shouldn't happen if we checked above, but just in case
        echo json_encode([
            "success" => false,
            "message" => "No admin was deleted"
        ]);
    }
    
} catch (Exception $e) {
    // Rollback on error
    $conn->rollback();
    
    echo json_encode([
        "success" => false,
        "message" => "Delete operation failed: " . $e->getMessage()
    ]);
} finally {
    $conn->close();
}
?>