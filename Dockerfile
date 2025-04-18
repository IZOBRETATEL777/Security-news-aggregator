FROM ubuntu:22.04

RUN apt-get update && apt-get install -y \
    curl \
    git \
    build-essential \
    cmake \
    libgomp1 \
    nodejs \
    npm \
    ca-certificates \
    && apt-get clean

RUN curl -fsSL https://bun.sh/install | bash

ENV PATH="/root/.bun/bin:${PATH}"

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install

COPY . .

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl --fail http://localhost:3000/health || exit 1

RUN bunx playwright install

CMD ["bun", "run", "src/app.ts"]
