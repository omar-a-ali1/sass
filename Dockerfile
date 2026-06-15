FROM node:22-alpine AS base

WORKDIR /usr/src/app

COPY package*.json ./

FROM base AS development

RUN npm install

COPY . .

FROM base AS builder

# تثبيت الحزم الخاصة بالإنتاج فقط وبشكل صارم ونظيف
RUN npm ci --only=production

FROM node:22-alpine AS production

ENV NODE_ENV=production
ENV PORT=5000

WORKDIR /usr/src/app

RUN chown -R node:node /usr/src/app

COPY --from=builder --chown=node:node /usr/src/app/node_modules ./node_modules

COPY --from=development --chown=node:node /usr/src/app/package.json ./package.json
COPY --from=development --chown=node:node /usr/src/app/server.js ./server.js
COPY --from=development --chown=node:node /usr/src/app/src ./src

RUN mkdir -p storage/logs && chown -R node:node storage

USER node

EXPOSE 5000

CMD ["npm", "start"]