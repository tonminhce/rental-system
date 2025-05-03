#!/bin/bash
set -eu

APP_DIR="/app"
echo "[INFO] NODE_ENV: ${NODE_ENV}"
echo "[INFO] APP_PORT: ${APP_PORT}"

#---------------------------------
# Verify NODE_ENV if doesn't exist
#---------------------------------
if ! [[ -n ${NODE_ENV} ]]; then
  echo "[ERROR] Can not get NODE_ENV."
  exit 1
fi

#---------------------------------
# Verify node_modules if doesn't exist
#---------------------------------
if [[ ${NODE_ENV} = "local" ]]; then

  cp -rp ${APP_DIR}/.env.${NODE_ENV} .env
  START_CMD="npm run dev"

  if ! [[ -d "${APP_DIR}/node_modules" ]]; then
    npm install
  fi

elif [ ${NODE_ENV} = "production" ] || [ ${NODE_ENV} = "development" ]; then
  START_CMD="node main.js"

else
  echo "[ERROR] NODE_ENV: ${NODE_ENV} does not defined."
  exit 1

fi

#---------------------------------
# Run migration
#---------------------------------
echo "[INFO] Migration is running ........."
if [[ ${NODE_ENV} = "local" ]]; then
  cd src/
fi
npx sequelize-cli db:migrate

#---------------------------------
# Run seed
#---------------------------------
echo "[INFO] Seeding is running ........."
npx sequelize-cli db:seed:all --seeders-path database/seeders

#---------------------------------
# Start app
#---------------------------------
echo "[INFO] ${APP_NAME} is starting ........."
${START_CMD}