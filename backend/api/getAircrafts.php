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
    // Check if specific aircraft ID is requested
    if (isset($_GET['id'])) {
        $aircraft_id = intval($_GET['id']);
        
        $stmt = $conn->prepare("SELECT * FROM Aircraft WHERE aircraft_id = ?");
        $stmt->bind_param("i", $aircraft_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            echo json_encode([
                "success" => false,
                "message" => "Aircraft not found"
            ]);
            exit();
        }
        
        $aircraft = $result->fetch_assoc();
        
        echo json_encode([
            "success" => true,
            "message" => "Aircraft retrieved successfully",
            "data" => $aircraft
        ]);
        
        $stmt->close();
    } 
    // Check if search by model is requested
    else if (isset($_GET['model'])) {
        $model = $conn->real_escape_string(trim($_GET['model']));
        
        $stmt = $conn->prepare("SELECT * FROM Aircraft WHERE model LIKE ?");
        $searchTerm = "%" . $model . "%";
        $stmt->bind_param("s", $searchTerm);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $aircrafts = [];
        while ($row = $result->fetch_assoc()) {
            $aircrafts[] = $row;
        }
        
        if (empty($aircrafts)) {
            echo json_encode([
                "success" => false,
                "message" => "No aircraft found with that model"
            ]);
            exit();
        }
        
        echo json_encode([
            "success" => true,
            "message" => "Aircraft retrieved successfully",
            "data" => $aircrafts
        ]);
        
        $stmt->close();
    }
    // Get all aircraft with optional pagination and filtering
    else {
        // Pagination parameters
        $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
        $limit = isset($_GET['limit']) ? max(1, intval($_GET['limit'])) : 50;
        $offset = ($page - 1) * $limit;
        
        // Filter parameters
        $search = isset($_GET['search']) ? $conn->real_escape_string(trim($_GET['search'])) : '';
        $status = isset($_GET['status']) ? $conn->real_escape_string(trim($_GET['status'])) : '';
        $min_capacity = isset($_GET['min_capacity']) ? intval($_GET['min_capacity']) : 0;
        $max_capacity = isset($_GET['max_capacity']) ? intval($_GET['max_capacity']) : 0;
        
        // Build WHERE clause
        $whereClauses = [];
        $params = [];
        $types = '';
        
        if (!empty($search)) {
            $whereClauses[] = "model LIKE ?";
            $params[] = "%" . $search . "%";
            $types .= 's';
        }
        
        if (!empty($status)) {
            $whereClauses[] = "status = ?";
            $params[] = $status;
            $types .= 's';
        }
        
        if ($min_capacity > 0) {
            $whereClauses[] = "capacity >= ?";
            $params[] = $min_capacity;
            $types .= 'i';
        }
        
        if ($max_capacity > 0) {
            $whereClauses[] = "capacity <= ?";
            $params[] = $max_capacity;
            $types .= 'i';
        }
        
        $whereSQL = empty($whereClauses) ? '' : 'WHERE ' . implode(' AND ', $whereClauses);
        
        // Get total count
        $countQuery = "SELECT COUNT(*) as total FROM Aircraft $whereSQL";
        $countStmt = $conn->prepare($countQuery);
        
        if (!empty($params)) {
            $countStmt->bind_param($types, ...$params);
        }
        
        $countStmt->execute();
        $countResult = $countStmt->get_result();
        $totalCount = $countResult->fetch_assoc()['total'];
        $countStmt->close();
        
        // Get aircrafts with pagination
        $query = "SELECT * FROM Aircraft $whereSQL ORDER BY model, capacity LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;
        $types .= 'ii';
        
        $stmt = $conn->prepare($query);
        $stmt->bind_param($types, ...$params);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $aircrafts = [];
        while ($row = $result->fetch_assoc()) {
            $aircrafts[] = $row;
        }
        
        $stmt->close();
        
        // Get status statistics
        $statsStmt = $conn->prepare("SELECT status, COUNT(*) as count FROM Aircraft GROUP BY status");
        $statsStmt->execute();
        $statsResult = $statsStmt->get_result();
        $statusStats = [];
        while ($row = $statsResult->fetch_assoc()) {
            $statusStats[$row['status']] = $row['count'];
        }
        $statsStmt->close();
        
        echo json_encode([
            "success" => true,
            "message" => "Aircraft retrieved successfully",
            "data" => $aircrafts,
            "pagination" => [
                "page" => $page,
                "limit" => $limit,
                "total" => $totalCount,
                "total_pages" => ceil($totalCount / $limit)
            ],
            "statistics" => [
                "status_distribution" => $statusStats,
                "total_aircrafts" => $totalCount
            ]
        ]);
    }
    
} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "message" => "Failed to retrieve aircraft: " . $e->getMessage()
    ]);
}

$conn->close();
?>