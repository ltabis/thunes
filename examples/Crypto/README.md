# Crypto example

This example uses a custom Rhai script to convert a Bitcoin account balance from BTC to euros using CoinMarketCap's API.
Check [CoinMarketCap's](https://coinmarketcap.com/api/) API docs to create a dev account and a key.

```sh
# Check the account balance using the bitcoin.rhai script.
API_KEY=my-key accounting --accounts ./accounts balance -s ./scripts/bitcoin.rhai
```