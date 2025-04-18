FROM ubuntu:22.04

RUN apt-get update && \
    apt-get install -y \
    curl \
    git \
    build-essential \
    cmake \
    libgomp1 \
    unzip \
    xz-utils \
    ca-certificates && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean

RUN useradd -ms /bin/bash bunuser
USER bunuser

ENV HOME=/home/bunuser
ENV BUN_INSTALL=$HOME/.bun
ENV PATH="$BUN_INSTALL/bin:$PATH"

RUN curl -fsSL https://bun.sh/install | bash

WORKDIR /home/bunuser/app

COPY --chown=bunuser:bunuser package.json bun.lock ./
RUN bun install

COPY --chown=bunuser:bunuser . .

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl --fail http://localhost:3000/health || exit 1

RUN bunx playwright install

CMD ["bun", "run", "src/app.ts"]
