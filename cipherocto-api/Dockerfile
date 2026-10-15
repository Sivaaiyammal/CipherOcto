FROM node:24-slim

WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Node runs the TypeScript directly (type stripping), so there is no build step.
COPY src ./src

USER node
EXPOSE 4000
CMD ["node", "src/server.ts"]
