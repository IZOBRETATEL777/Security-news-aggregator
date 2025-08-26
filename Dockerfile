FROM mcr.microsoft.com/playwright:v1.55.0-jammy


RUN apt-get update && apt-get install -y curl unzip xz-utils git && apt-get clean

RUN useradd -ms /bin/bash bunuser
USER bunuser

ENV HOME=/home/bunuser
ENV BUN_INSTALL=$HOME/.bun
ENV PATH="$BUN_INSTALL/bin:$PATH"

RUN curl -fsSL https://bun.sh/install | bash

WORKDIR $HOME/app

COPY --chown=bunuser:bunuser package.json bun.lock ./
RUN bun install

COPY --chown=bunuser:bunuser . .

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl --fail http://localhost:3000/health || exit 1

CMD ["bun", "run", "src/app.ts"]
