#!/bin/bash

NODE_ENV=$1
echo ${NODE_ENV}

cp -rp ./env/.env.${NODE_ENV} ./.env
rm -rf node_modules
npm install --include=dev

# Build project
NODE_ENV=${NODE_ENV} npm run nest:build

# Run migrations
npx sequelize-cli db:migrate \
  --config src/database/config.js \
  --env ${NODE_ENV}

# Run seeders
npx sequelize-cli db:seed:all \
  --config src/database/config.js \
  --env ${NODE_ENV} \
  --seeders-path src/database/seeders

# Start app
NODE_ENV=${NODE_ENV} node dist/main.js
