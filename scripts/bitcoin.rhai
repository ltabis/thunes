// TODO: rhai-env
const KEY = env::variable("API_KEY");

const client = http::client();

/// Format the price in EUR from a bitcoin amount using Coin Market Cap API.
fn on_LedgerBTC(transactions) {
    // TODO: abstraction.
    let total = 0.0;

    for t in transactions {
        total += t.amount;
    }

    let response = global::client.request(#{
        "method": "GET",
        "url": "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?slug=bitcoin&convert=EUR",
        "headers": [
            `X-CMC_PRO_API_KEY: ${global::KEY}`,
            `Accept: application/json`
        ],
        "output": "json",
    });

    let btc_price = response["data"]["1"]["quote"]["EUR"]["price"];

    // "EUR/CRYPTO" is used to sum the total amount of crypto outside the total EUR holdings.
    #{ "currency": "EUR/CRYPTO", "amount": total * btc_price }
}

fn on_LedgerETH(transactions) {
    // TODO: abstraction.
    let total = 0.0;

    for t in transactions {
        total += t.amount;
    }

    let response = global::client.request(#{
        "method": "GET",
        "url": "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?slug=ethereum&convert=EUR",
        "headers": [
            `X-CMC_PRO_API_KEY: ${global::KEY}`,
            `Accept: application/json`
        ],
        "output": "json",
    });

    let eth_price = response["data"]["1027"]["quote"]["EUR"]["price"];

    // "EUR/CRYPTO" is used to sum the total amount of crypto outside the total EUR holdings.
    #{ "currency": "EUR/CRYPTO", "amount": total * eth_price }
}
