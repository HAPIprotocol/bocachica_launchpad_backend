# Building stage
FROM node:14-alpine AS builder

ADD . /build

WORKDIR /build

RUN npm ci

RUN npm run build

# Production stage
FROM node:14-alpine

WORKDIR /app

COPY --from=builder /build/dist ./dist
COPY --from=builder /build/package.json ./
COPY --from=builder /build/npm-shrinkwrap.json ./

RUN npm install --production

EXPOSE 3001

USER node

CMD npx typeorm -f ./dist/ormconfig.js migration:run && npm run start:prod
