<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database connection
require_once __DIR__ . "/../config/db.php";

try {
    // Check if specific airport ID is requested
    if (isset($_GET['id'])) {
        $airport_id = intval($_GET['id']);
        
        $stmt = $conn->prepare("SELECT * FROM Airport WHERE airport_id = ?");
        $stmt->bind_param("i", $airport_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            echo json_encode([
                "success" => false,
                "message" => "Airport not found"
            ]);
            exit();
        }
        
        $airport = $result->fetch_assoc();
        
        echo json_encode([
            "success" => true,
            "message" => "Airport retrieved successfully",
            "data" => $airport
        ]);
        
        $stmt->close();
    } 
    // Check if search by code is requested
    else if (isset($_GET['code'])) {
        $code = strtoupper($conn->real_escape_string(trim($_GET['code'])));
        
        $stmt = $conn->prepare("SELECT * FROM Airport WHERE code = ?");
        $stmt->bind_param("s", $code);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            echo json_encode([
                "success" => false,
                "message" => "Airport not found"
            ]);
            exit();
        }
        
        $airport = $result->fetch_assoc();
        
        echo json_encode([
            "success" => true,
            "message" => "Airport retrieved successfully",
            "data" => $airport
        ]);
        
        $stmt->close();
    }
    // Get all airports with optional pagination
    else {
        // Pagination parameters
        $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
        $limit = isset($_GET['limit']) ? max(1, intval($_GET['limit'])) : 50;
        $offset = ($page - 1) * $limit;
        
        // Search parameters
        $search = isset($_GET['search']) ? $conn->real_escape_string(trim($_GET['search'])) : '';
        $country = isset($_GET['country']) ? $conn->real_escape_string(trim($_GET['country'])) : '';
        $city = isset($_GET['city']) ? $conn->real_escape_string(trim($_GET['city'])) : '';
        
        // Build WHERE clause
        $whereClauses = [];
        $params = [];
        $types = '';
        
        if (!empty($search)) {
            $whereClauses[] = "(name LIKE ? OR code LIKE ? OR city LIKE ? OR country LIKE ?)";
            $searchTerm = "%" . $search . "%";
            $params = array_merge($params, [$searchTerm, $searchTerm, $searchTerm, $searchTerm]);
            $types .= 'ssss';
        }
        
        if (!empty($country)) {
            $whereClauses[] = "country LIKE ?";
            $params[] = "%" . $country . "%";
            $types .= 's';
        }
        
        if (!empty($city)) {
            $whereClauses[] = "city LIKE ?";
            $params[] = "%" . $city . "%";
            $types .= 's';
        }
        
        $whereSQL = empty($whereClauses) ? '' : 'WHERE ' . implode(' AND ', $whereClauses);
        
        // Get total count
        $countQuery = "SELECT COUNT(*) as total FROM Airport $whereSQL";
        $countStmt = $conn->prepare($countQuery);
        
        if (!empty($params)) {
            $countStmt->bind_param($types, ...$params);
        }
        
        $countStmt->execute();
        $countResult = $countStmt->get_result();
        $totalCount = $countResult->fetch_assoc()['total'];
        $countStmt->close();
        
        // Get airports with pagination
        $query = "SELECT * FROM Airport $whereSQL ORDER BY country, city, name LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;
        $types .= 'ii';
        
        $stmt = $conn->prepare($query);
        $stmt->bind_param($types, ...$params);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $airports = [];
        while ($row = $result->fetch_assoc()) {
            $airports[] = $row;
        }
        
        $stmt->close();
        
        echo json_encode([
            "success" => true,
            "message" => "Airports retrieved successfully",
            "data" => $airports,
            "pagination" => [
                "page" => $page,
                "limit" => $limit,
                "total" => $totalCount,
                "total_pages" => ceil($totalCount / $limit)
            ]
        ]);
    }
    
} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "message" => "Failed to retrieve airports: " . $e->getMessage()
    ]);
}

$conn->close();
?>