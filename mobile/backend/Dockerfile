FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY server.cjs state_store.json ./
COPY admin_public ./admin_public

EXPOSE 8095
CMD ["node", "server.cjs"]
