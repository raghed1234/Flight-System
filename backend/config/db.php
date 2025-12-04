<?php
// ===== Show errors for debugging =====
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// ===== Database connection info =====
$host = "localhost";      // XAMPP default
$user = "root";           // MySQL default user
$pass = "";               // Leave empty if no password
$dbname = "flight_system"; // Your database name

// ===== Create connection =====
$conn = new mysqli($host, $user, $pass, $dbname);

// ===== Check connection =====
if ($conn) {
    echo"Connected Successfully";
}
else {
echo "Failed Connection";
}
?>
