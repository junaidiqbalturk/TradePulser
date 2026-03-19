<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Fake an authentication as the first user
$user = \App\Models\User::first();
if (!$user) {
    die("No users found to authenticate as.\n");
}
$app->make('auth')->login($user);

$request = Illuminate\Http\Request::create('/api/dashboard', 'GET');
$response = app()->handle($request);

echo "Status Code: " . $response->getStatusCode() . "\n\n";
$content = $response->getContent();
$json = json_decode($content, true);
if (json_last_error() === JSON_ERROR_NONE) {
    echo json_encode($json, JSON_PRETTY_PRINT);
}
else {
    echo $content;
}
