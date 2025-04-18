FROM oven/bun:latest

WORKDIR /app

RUN apt-get update && apt-get install -y git

COPY package.json bun.lock ./
RUN bun install

COPY . .

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 CMD curl --fail http://localhost:3000/health || exit 1

RUN bunx playwright install

CMD ["bun", "run", "src/app.ts"]
