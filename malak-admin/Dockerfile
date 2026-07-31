# Malak Backoffice – Container für Cloud-Hosting (Railway, Render, Fly.io, VPS)
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY server.js ./
COPY public ./public
COPY data ./data

# Beim Hosting: Volume auf /app/data mounten (persistente Daten!)
# und ENV setzen: ADMIN_PASSWORD, SESSION_SECRET, ggf. DATA_DIR
ENV PORT=4000
EXPOSE 4000

CMD ["node", "server.js"]
