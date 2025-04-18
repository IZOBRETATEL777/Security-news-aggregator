FROM ubuntu:22.04

RUN useradd -ms /bin/bash bunuser

RUN apt-get update && apt-get install -y \
    curl \
    git \
    build-essential \
    cmake \
    libgomp1 \
    nodejs \
    npm \
    unzip \
    xz-utils \
    ca-certificates \
    && apt-get clean

USER bunuser
ENV BUN_INSTALL=/home/bunuser/.bun
ENV PATH="${BUN_INSTALL}/bin:${PATH}"

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
