# sofer — all-in-one production image (Express server + built SPA).
# Pinned Node 24 LTS (production-preferred runtime; 22+ also supported).
# Build:  docker build -t sofer .
# Run:    docker run --rm -p 3001:3001 --env-file .env sofer
#         (or pass the provider API key via your platform's secret store)

FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY client/package.json client/package-lock.json ./client/
COPY server/package.json server/package-lock.json ./server/
RUN npm ci && npm --prefix client ci && npm --prefix server ci

FROM deps AS build
WORKDIR /app
COPY . .
RUN npm run build

FROM node:24-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
# Non-root runtime user.
RUN addgroup -S sofer && adduser -S sofer -G sofer
# Server runtime deps only (express + zod).
COPY server/package.json server/package-lock.json ./server/
RUN npm --prefix server ci --omit=dev && npm cache clean --force
COPY --from=build /app/server/dist ./server/dist
COPY --from=build /app/client/dist ./client/dist
USER sofer
EXPOSE 3001
ENV PORT=3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3001/api/health || exit 1
CMD ["node", "server/dist/index.js"]
