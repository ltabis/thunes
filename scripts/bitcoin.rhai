// TODO: rhai-env
const KEY = "xxx";

/// Format the price in EUR from a bitcoin amount using Coin Market Cap API.
fn on_LedgerBTC(amount) {
    let response = http::get("https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest")
        .headers([
            `X-CMC_PRO_API_KEY: ${KEY}`,
            "Accept: application/json"
        ])
        .parameters([
            "slug": "bitcoin",
            "convert": "EUR",
        ]);

    let btc_price = response["data"]["1"]["quote"]["EUR"]["price"];

    amount * btc_price
}