# 1단계: Node.js 환경에서 빌드
FROM node:20-slim AS build
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npm run build

# 2단계: Nginx를 통해 정적 파일 서빙 및 리버스 프록시
FROM nginx:alpine
# 커스텀 Nginx 설정 복사
COPY nginx.conf /etc/nginx/conf.d/default.conf
# 빌드된 정적 파일 복사
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
