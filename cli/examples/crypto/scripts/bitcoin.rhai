//! This scripts performs a query to CoinMarketCap's API to fetch Bitcoin price and convert the BTC account
//! balance to euros.

// API key for CoinMarketCap, see https://coinmarketcap.com/api/
const KEY = env::variable("API_KEY");
// Create a basic http client from rhai-http.
const client = http::client();

// Format the price in EUR from a bitcoin amount using Coin Market Cap API.
fn on_BTC(transactions) {
    // Query the API.
    let response = global::client.request(#{
        "method": "GET",
        "url": "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?slug=bitcoin&convert=EUR",
        "headers": [
            `X-CMC_PRO_API_KEY: ${global::KEY}`,
            `Accept: application/json`
        ],
        "output": "json",
    });

    // Get bitcoin price from the results.
    let btc_price = response["data"]["1"]["quote"]["EUR"]["price"];

    // Convert the transactions bitcoin amount in euro.
    #{
        "currency": "EUR",
        "amount": sum(transactions) * btc_price
    }
}