# Frontend (Vite + React)
FROM node:20-alpine

WORKDIR /app

# Install deps
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build-time env (can be overridden at build)
ARG VITE_API_URL=http://backend:3001
ARG VITE_RPC_URL=http://blockchain:8545
ARG VITE_CHAIN_ID=31337
ARG VITE_IPFS_GATEWAY=https://ipfs.io/ipfs/

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_RPC_URL=$VITE_RPC_URL
ENV VITE_CHAIN_ID=$VITE_CHAIN_ID
ENV VITE_IPFS_GATEWAY=$VITE_IPFS_GATEWAY

EXPOSE 4173

# Build and serve static preview
RUN npm run build
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "4173"]
