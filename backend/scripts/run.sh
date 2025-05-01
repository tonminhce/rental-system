#! bin/bash

#bin/bash

NODE_ENV=$1
echo ${NODE_ENV}
cp -rp ./env/.env.${NODE_ENV} ./.env
rm -rf node_modules
npm install --include=dev
NODE_ENV=${NODE_ENV} npm run nest:build
NODE_ENV=${NODE_ENV} node dist/main.js