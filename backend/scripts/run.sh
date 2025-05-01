#!/bin/bash

NODE_ENV=$1
echo ${NODE_ENV}

cp -rp ./env/.env.${NODE_ENV} ./.env
rm -rf node_modules
npm install --include=dev

# Build project
NODE_ENV=${NODE_ENV} npm run nest:build

# Start app
NODE_ENV=${NODE_ENV} node dist/main.js
