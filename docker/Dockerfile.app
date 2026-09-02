FROM node:20-alpine AS builder
WORKDIR /app/frontend
COPY app/frontend/package*.json ./
RUN npm install
COPY app/frontend ./
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY app/backend/package*.json ./backend/
RUN cd backend && npm install --production
COPY app/backend ./backend
COPY --from=builder /app/frontend/dist ./frontend_dist

WORKDIR /app/backend
EXPOSE 3001
CMD ["node", "src/index.js"]
