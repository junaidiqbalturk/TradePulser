<?php
// This simple script mocks an API request to the running laragon API
// using file_get_contents to avoid PowerShell escaping issues.
$url = "http://tradepulser.test/api/dashboard";
$options = array(
    'http' => array(
        'header' => "Content-type: application/json\r\nAccept: application/json\r\n",
        'method' => 'GET'
    )
);
$context = stream_context_create($options);
$result = @file_get_contents($url, false, $context);
if ($result === FALSE) {
    echo "ERROR: Could not fetch from $url. Is the API actually running/reachable at tradepulser.test?";
}
else {
    echo "SUCCESS: API Responded:\n";
    echo $result;
}
