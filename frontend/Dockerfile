# Stage 1: Build
FROM node:20-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm install

# Build Arguments
ARG VITE_API_URL
ARG VITE_RPC_URL
ARG VITE_API_SECRET_TOKEN

# Bake them into the build
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_RPC_URL=$VITE_RPC_URL
ENV VITE_API_SECRET_TOKEN=$VITE_API_SECRET_TOKEN

COPY . .
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
