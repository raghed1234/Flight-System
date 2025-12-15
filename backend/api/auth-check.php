<?php
session_start();
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

if (!isset($_SESSION['user'])) {
    http_response_code(401);
    echo json_encode(["authenticated" => false, "message" => "Not authenticated"]);
    exit;
}

echo json_encode([
    "authenticated" => true,
    "user" => $_SESSION['user']
]);