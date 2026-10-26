/**
 * Quickstart Example — Exchange SaaS JavaScript/TypeScript SDK (V4.0)
 * Usage: EXCHANGE_API_KEY="sk_live_..." node examples/js_quickstart.js
 */
const { ExchangeClient, ExchangeAPIError } = require('../sdk/js/exchange_sdk.js');

const client = new ExchangeClient({
  apiKey: process.env.EXCHANGE_API_KEY || 'sk_live_your_api_key',
  baseUrl: 'https://api.l.lc/exchange',
  lang: 'en',
  clientHost: 'https://yourdomain.com'
});

async function main() {
  try {
    const health = await client.checkHealth();
    console.log('[Health Check]:', health);

    const gold = await client.getSymbolRate('XAUUSD');
    console.log('[XAUUSD Rate EN]:', gold.data?.name, gold.data?.price_usd);

    const convVi = await client.convert('USD', 'VND', 100, { lang: 'vi' });
    console.log('[Convert VI]:', convVi.message, '->', convVi.result);
  } catch (err) {
    if (err instanceof ExchangeAPIError) {
      console.error(`API Error [${err.statusCode} ${err.errorCode}]: ${err.message}`);
    } else {
      console.error('Unexpected error:', err);
    }
  }
}

main();
