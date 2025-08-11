# Thunes

Thunes is a simple desktop app that you can use to manage your expenses and budgets.
Thunes does not synchronise your bank accounts, you provide every transaction manually.

<!-- TODO: See my blog to see why I built it this way -->

It is mainly built for my needs, but I figured it would be interesting to share the source code anyways.

<!-- [![Build](https://img.shields.io/github/actions/workflow/status/ltabis/budgeteer/build.yml?branch=main)](https://github.com/ltabis/budgeteer/actions)
[![License](https://img.shields.io/github/license/ltabis/budgeteer)](https://github.com/ltabis/budgeteer/blob/main/LICENSE)
[![Last Commit](https://img.shields.io/github/last-commit/ltabis/budgeteer)](https://github.com/ltabis/budgeteer/commits/main)
[![Release](https://img.shields.io/github/v/release/ltabis/budgeteer?include_prereleases)](https://github.com/ltabis/budgeteer/releases) -->

## Features

- Track income and expenses for any account with any currency
- Organize transactions into categories
- Monthly budgeting
- Simple analytics and charts
- Local storage

## Getting Started

Go to [releases](https://github.com/ltabis/thunes/releases) and download the latest version of the app for your platform.
<!-- You can also download the [demo database]() and import it in the app to try it out. -->

<!-- ## Screenshots

TODO: -->

## Contributing

Pull requests are welcome! If you'd like to contribute, check the issues or submit a feature request.

## Development

### Tech Stack

- **[Rust](https://www.rust-lang.org/)** – High-performance core logic
- **[Tauri](https://tauri.app/)** – Secure and tiny desktop app framework
- **[SurrealDB](https://surrealdb.com/)** – A powerful multi-model database
- **[Typescript / React](https://fr.react.dev/)** – Easy frontend development

### Prerequisites

- [Rust](https://rustup.rs/)
- [Node.js](https://nodejs.org/)
- [Tauri CLI](https://tauri.app/v1/guides/getting-started/prerequisites/)

### Clone and Run

```bash
git clone https://github.com/ltabis/thunes
cd thunes/desktop
yarn
yarn tauri dev
```

<!-- TODO: react-devtools -->

## License

[MIT](./LICENSE)
