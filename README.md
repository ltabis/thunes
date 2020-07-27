# accounts-cli
A cli tool to manage your money.

## Preamble

I needed a tool to make my accounting, so I created this.
issues are welcomed.

## How to use

The goal of this program is to create bank accounts and add entries to them.
Accounts are composed of :
* a name
* a currency
* a balance

To create a new **account**, use:
```shell
$ accounts-cli --new my-account # Creates an account.
```

result:
```
Account 'my-account' created.
```

Entries are compose of :
* a label
* an amount
* it's type (withdrawal or deposit)
* a date (optional)
* notes (optional)

To create an **entry**, use:
```shell
$ accounts-cli --new my-account "GIFT" "100" + # Add an entry with "GIFT" as a label and "100" as the amount. It is a deposit.
$ accounts-cli --new my-account "Food" "21" - "14/07/2020" "Purchased at the local store" # this one as a date and a note, and it is a withdrawal.
```
result:
```
New entry 'GIFT' created.
New entry 'Food' created.

$ accounts-cli --list my-account

+-------+---------+--------------------------+-------------------------------+
| Label | Amount  | Date                     | Note                          |
+-------+---------+--------------------------+-------------------------------+
| GIFT  | + 100 $ | Mon Jul 27 06:52:21 2020 |                               |
+-------+---------+--------------------------+-------------------------------+
| Food  | - 21 $  | 14/07/2020               | Purchased at the local store  |
+-------+---------+--------------------------+-------------------------------+
'my-account' balance: 79$.
```


You can **add**, **list**, **remove** you accounts and entries, and check your **balance**.

use ``accounts-cli --help`` to get more informations.

## How to compile

```shell
$ cargo build --release
```

## Dependencies

- prettytable-rs
- serde_json
- colored
- chrono
- serde

