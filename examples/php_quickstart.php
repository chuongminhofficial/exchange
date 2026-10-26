<?php
/**
 * Quickstart Example — Exchange SaaS PHP SDK (V4.0)
 * Usage: EXCHANGE_API_KEY="sk_live_..." php examples/php_quickstart.php
 */
require_once __DIR__ . '/../sdk/php/ExchangeSDK.php';

use ExchangeSaaS\ExchangeClient;
use ExchangeSaaS\ExchangeAPIException;

try {
    $apiKey = getenv('EXCHANGE_API_KEY') ?: 'sk_live_your_api_key';
    $client = new ExchangeClient($apiKey, [
        'base_url'    => 'https://api.l.lc/exchange',
        'lang'        => 'vi',
        'client_host' => 'https://yourdomain.com',
    ]);

    $health = $client->checkHealth();
    print_r($health);

    $conv = $client->convert('USD', 'VND', 100, 'vi');
    echo "100 USD = " . number_format($conv['result'] ?? 0) . " VND ({$conv['message']})\n";
} catch (ExchangeAPIException $e) {
    echo "API Error [{$e->statusCode} {$e->errorCode}]: {$e->getMessage()}\n";
}
