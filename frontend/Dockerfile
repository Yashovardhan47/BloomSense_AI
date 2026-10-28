FROM node:22-alpine AS build

WORKDIR /app
ARG VITE_DEMO_MODE=true
ARG VITE_API_URL=/api/v1
ARG VITE_GOOGLE_CLIENT_ID=
ENV VITE_DEMO_MODE=$VITE_DEMO_MODE \
    VITE_API_URL=$VITE_API_URL \
    VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run test && npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
