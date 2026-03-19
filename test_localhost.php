<?php
$url = "http://localhost:8000/api/dashboard";
$options = array(
    'http' => array(
        'header' => "Content-type: application/json\r\nAccept: application/json\r\n",
        'method' => 'GET',
        'ignore_errors' => true // to capture 401s without crashing file_get_contents
    )
);
$context = stream_context_create($options);
$result = file_get_contents($url, false, $context);

echo "HTTP_RESPONSE_HEADER:\n";
var_dump($http_response_header[0]);
echo "HTTP_RESPONSE_BODY:\n";
echo $result;
