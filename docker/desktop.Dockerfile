FROM ubuntu:22.04

COPY . .

RUN apt update && apt install libwebkit2gtk-4.1-dev \
    build-essential \
    curl \
    wget \
    file \
    libxdo-dev \
    libssl-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev \
    pkg-config \
    clang -y

RUN curl --proto '=https' --tlsv1.2 https://sh.rustup.rs -sSf | sh -s -- -y

RUN ~/.cargo/bin/cargo build --release
ENTRYPOINT "./target/release/thunes-desktop"
