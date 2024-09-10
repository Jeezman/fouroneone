<?php
// Read the variables sent via POST from AT
$sessionId   = $_POST["sessionId"];
$serviceCode = $_POST["serviceCode"];
$phoneNumber = $_POST["phoneNumber"];
$text        = $_POST["text"];

if ($text == "") {
    // This is the first request. Respond with the main menu.
    $response  = "CON Welcome to the USSD app\n";
    $response .= "1. Check balance\n";
    $response .= "2. Withdraw cash";
} else if ($text == "1") {
    // Check balance option
    $response = "END Your balance is $10.";
} else if ($text == "2") {
    // Withdraw cash option
    $response = "END Your withdrawal request has been processed.";
} else {
    $response = "END Invalid option.";
}

// Print the response to the Africa's Talking API
header('Content-type: text/plain');
echo $response;
