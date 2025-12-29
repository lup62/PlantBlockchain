# ============================================
# Backend API - Node.js + Express
# ============================================
FROM node:18-alpine

# Imposta directory di lavoro
WORKDIR /app

# Copia file dipendenze
COPY package*.json ./

# Installa dipendenze
RUN npm ci --only=production

# Copia tutto il codice
COPY . .

# Crea directory uploads
RUN mkdir -p uploads

# Esponi porta
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Avvia server
CMD ["npm", "start"]

# Metadata
LABEL maintainer="o.franchini@studenti.poliba.it"
LABEL description="Variety License Registry - Backend API"
LABEL version="1.0.0"