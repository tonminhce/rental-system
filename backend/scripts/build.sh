#bin/bash

NODE_ENV=$1
echo ${NODE_ENV}
cp -rp ./env/.env.${NODE_ENV} ./.env
rm -rf node_modules
npm install --include=dev
npm run NODE_ENV=${NODE_ENV} nest:build
