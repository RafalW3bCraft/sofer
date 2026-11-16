# sofer — all-in-one production image (Express server + built SPA).
# Node 24 LTS (required by the Firebase JS SDK hybrid AI modules).
# Build:  docker build -t sofer .
# Run:    docker run --rm -p 3001:3001 --env-file .env sofer
# Firebase Web config is public client config and must be supplied at build time.

FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY client/package.json client/package-lock.json ./client/
COPY server/package.json server/package-lock.json ./server/
RUN npm ci && npm --prefix client ci && npm --prefix server ci

FROM deps AS build
WORKDIR /app
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_APP_ID
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_RECAPTCHA_ENTERPRISE_SITE_KEY
ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY \
    VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN \
    VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID \
    VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID \
    VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID \
    VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET \
    VITE_FIREBASE_RECAPTCHA_ENTERPRISE_SITE_KEY=$VITE_FIREBASE_RECAPTCHA_ENTERPRISE_SITE_KEY \
    VITE_FIREBASE_APPCHECK_DEBUG=false \
    VITE_USE_FIREBASE_EMULATORS=false
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
