FROM node:18-alpine 

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm ci

COPY . .

# Next.js inlines NEXT_PUBLIC_* at build time, so they must be present before `npm run build`.
# compose/ansible pass these exact build-arg names.
ARG NEXT_PUBLIC_RENTAL_SERVICE_BACKEND_ENDPOINT
ARG NEXT_PUBLIC_CHAT
ARG NEXT_PUBLIC_GOONG_MAPTILES_KEY
ENV NEXT_PUBLIC_RENTAL_SERVICE_BACKEND_ENDPOINT=$NEXT_PUBLIC_RENTAL_SERVICE_BACKEND_ENDPOINT \
    NEXT_PUBLIC_CHAT=$NEXT_PUBLIC_CHAT \
    NEXT_PUBLIC_GOONG_MAPTILES_KEY=$NEXT_PUBLIC_GOONG_MAPTILES_KEY

RUN npm run build

EXPOSE 4000

ENV PORT 4000

CMD ["npm", "run", "start"] 
