# Production backend image. Multi-stage so host junk (backend/.env, tsbuildinfo)
# never lands in a shipped layer; final image carries only npm-installed
# node_modules, compiled dist/, and the sequelize migration sources.
# ponytail: devDependencies stay installed at runtime because sequelize-cli
# (migrations at boot) is one; split it into a prod dep or bake migrations into
# a job image when image size starts to matter.
FROM node:20-slim AS build
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build

FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production
ENV APP_NAME=backend
ENV APP_PORT=8080
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY backend/package*.json backend/.sequelizerc ./
COPY backend/src/database ./src/database
COPY docker/node/entrypoint.sh /usr/bin/entrypoint.sh
RUN chmod +x /usr/bin/entrypoint.sh

EXPOSE 8080
ENTRYPOINT [ "/usr/bin/entrypoint.sh" ]
