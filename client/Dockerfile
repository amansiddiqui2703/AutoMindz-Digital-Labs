FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
# react-quill@2 has peer dep conflict with React 19 — legacy-peer-deps required
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
