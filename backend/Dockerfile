FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Create uploads directory if it doesn't exist
RUN mkdir -p uploads

EXPOSE 3001

CMD ["npm", "start"]
