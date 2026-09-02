# Container deploy sidesteps buildpack uncertainty and uses the official Bun image.
FROM oven/bun:1.3.14-slim

WORKDIR /app

# Install dependencies first so they cache across code changes.
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile || bun install

COPY . .

# Heroku injects PORT at runtime; src/config.ts reads it.
CMD ["bun", "run", "src/index.ts"]
