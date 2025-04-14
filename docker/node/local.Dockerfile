FROM node:20-slim

ARG NODE_ENV
ARG APP_PORT

ENV NODE_ENV=${NODE_ENV}
ENV APP_PORT=${APP_PORT}
ENV APP_NAME=backend
ENV APP_DIR=/app
ENV SRC_DIR=./backend
ENV DOCKER_DIR=./docker/node

WORKDIR ${APP_DIR}

COPY ${SRC_DIR} .
COPY ${DOCKER_DIR}/entrypoint.sh /usr/bin/entrypoint.sh

RUN npm i --frozen-lockfile
RUN npm cache clean --force
RUN chmod +x /usr/bin/entrypoint.sh

EXPOSE ${APP_PORT}

ENTRYPOINT [ "/usr/bin/entrypoint.sh" ]