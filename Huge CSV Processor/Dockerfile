# Usa Node.js come base
FROM node:22-slim

# Imposta la directory di lavoro
WORKDIR /usr/src/app

# Copia i file di configurazione
COPY package*.json tsconfig.json ./

# Installa le dipendenze
RUN npm install

# Copia il codice sorgente
COPY . .

# Compila TypeScript
RUN npx tsc

# Comando per avviare il processore
ENTRYPOINT ["node", "dist/index.js"]

