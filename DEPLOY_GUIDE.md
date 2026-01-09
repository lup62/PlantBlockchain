# Guida Completa al Deploy di PlantBlockchain

Questa guida offre una panoramica dettagliata di come deployare l'intero stack PlantBlockchain, sia utilizzando Docker (metodo raccomandato) che manualmente componente per componente.

## Indice
1. [Prerequisiti](#prerequisiti)
2. [Configurazione Metamask](#configurazione-metamask)
3. [Configurazione Ambiente (.env)](#configurazione-ambiente-env)
4. [Deploy con Docker (Raccomandato)](#deploy-con-docker-raccomandato)
5. [Deploy Manuale (Senza Docker)](#deploy-manuale-senza-docker)
    - [Blockchain (Hardhat)](#1-blockchain-hardhat)
    - [Backend (Express)](#2-backend-express)
    - [Frontend (React/Vite)](#3-frontend-reactvite)
6. [Troubleshooting](#troubleshooting-e-problemi-comuni)

---

## Prerequisiti

Per eseguire il progetto, assicurati di avere installato:

*   **Node.js**: v18 o superiore (v20 raccomandata).
*   **Git**: Per clonare il repository.
*   **Docker Desktop**: Per il deployment via container (opzionale se fai deployment manuale).
*   **Metamask**: Estensione browser per interagire con la blockchain.

Clona il repository:
```bash
git clone https://github.com/lup62/PlantBlockchain.git
cd PlantBlockchain
```

---

## Configurazione Metamask

Per interagire con la blockchain locale serve aggiungere la rete Hardhat e importare un account di test.

1. Apri Metamask > menu reti > "Aggiungi rete" > "Aggiungi una rete manualmente".
2. Inserisci i valori:
   - Nome rete: `Hardhat Localhost`
   - Nuovo URL RPC: `http://localhost:8545`
   - ID chain: `31337`
   - Simbolo valuta: `ETH`
3. Importa un account di test con una private key stampata da:
   - `npx hardhat node` (manuale), oppure
   - `scripts/magic_deploy.js` (Docker o manuale).

Nota: se riavvii il nodo Hardhat, le chiavi cambiano. In quel caso reimporta l'account o fai il reset dell'account in Metamask (Impostazioni > Avanzate > Cancella attivita tab).

---

## Configurazione Ambiente (.env)

Ogni servizio ha bisogno del suo file `.env`. Sono forniti dei template `.env.template` in ogni cartella.

### 1. Backend (`backend/.env`)
Copia il template:
```bash
cp backend/.env.template backend/.env
```
Configura le variabili:
*   `PORT`: Porta del server (default: `3001`).
*   `FRONTEND_URL`: URL del frontend per CORS (es. `http://localhost:5173` o `http://localhost:4173` con Docker).
*   `JSON_RPC_PROVIDER`: URL RPC della blockchain (es. `http://127.0.0.1:8545`).
*   `API_SECRET_TOKEN`: Token segreto per proteggere upload (opzionale in dev).
*   `PINATA_API_KEY` & `PINATA_SECRET_API_KEY`: Credenziali Pinata per upload IPFS reale (opzionale in dev locale).

### 2. Frontend (`frontend/.env`)
Copia il template:
```bash
cp frontend/.env.template frontend/.env
```
Configura le variabili:
*   `VITE_API_URL`: URL del backend (es. `http://localhost:3001`).
*   `VITE_RPC_URL`: URL RPC della blockchain (es. `http://localhost:8545`).
*   `VITE_CHAIN_ID`: ID della chain Hardhat (default: `31337`).
*   `VITE_CONTRACT_ADDRESS`: **Importante!** Questo valore sarà popolato automaticamente o dovrai inserirlo manualmente dopo il deploy del contratto.

---

## Deploy con Docker (Raccomandato)

Docker orchestra automaticamente blockchain, backend e frontend.

### 1. Avvio dello Stack
Dalla root del progetto:
```bash
docker compose up --build
```
Questo comando:
*   Avvia un nodo Hardhat locale.
*   Avvia il backend (porta 3001).
*   Avvia il frontend buildato in modalità preview (porta 4173).

Gli indirizzi saranno:
*   **Frontend**: `http://localhost:4173`
*   **Backend**: `http://localhost:3001`
*   **Blockchain RPC**: `http://localhost:8545`

### 2. Deploy del Contratto & Dati Demo
Una volta che i container sono attivi, in un **nuovo terminale** esegui:
```bash
docker compose exec blockchain npx hardhat run scripts/magic_deploy.js --network localhost
```
Questo script:
1.  Deploya lo smart contract sulla blockchain locale.
2.  Aggiorna automaticamente il file `contractABI.js` nel frontend.
3.  Crea dati di test (Ispettore, Varietà, Licenze).
4.  Stampa a video il Seed Phrase e le chiavi private per i test.

**Nota:** Dopo questo comando, ricarica la pagina del frontend per vedere i cambiamenti.

### 3. Persistenza Dati
*   I file caricati dal backend sono salvati in un volume Docker `backend-uploads`.
*   La blockchain locale **non** persiste i dati al riavvio del container `blockchain` a meno che non si configuri un volume specifico per il nodo Hardhat (di default Hardhat resetta lo stato al riavvio).

---

## Deploy Manuale (Senza Docker)

Se preferisci eseguire i servizi singolarmente sulla tua macchina.

### 1. Blockchain (Hardhat)
Entra nella cartella:
```bash
cd blockchain
npm install
```

Avvia il nodo locale:
```bash
npx hardhat node
```
Tieni questo terminale aperto. Il nodo girerà su `http://127.0.0.1:8545`.

In un **altro terminale**, deploya il contratto:
```bash
cd blockchain
npx hardhat run scripts/magic_deploy.js --network localhost
```
Prendi nota dell'indirizzo del contratto (anche se lo script prova ad aggiornare il frontend, verifica se è corretto).

### 2. Backend (Express)
Entra nella cartella:
```bash
cd backend
npm install
```

Assicurati che `backend/.env` punti al tuo nodo locale (`http://127.0.0.1:8545`).

Avvia il server:
```bash
npm run dev
```
Il server girerà su `http://localhost:3001`.

### 3. Frontend (React/Vite)
Entra nella cartella:
```bash
cd frontend
npm install
```

Assicurati che `frontend/.env` abbia:
```
VITE_API_URL=http://localhost:3001
VITE_RPC_URL=http://localhost:8545
```

Avvia in modalità sviluppo:
```bash
npm run dev
```
Il frontend sarà accessibile su `http://localhost:5173`.

---

## Troubleshooting e Problemi Comuni

### "DockerDesktopLinuxEngine not found"
Verifica che Docker Desktop sia avviato e che l'integrazione WSL2 sia abilitata se sei su Windows.

### "Contract not deployed" / "Call revert exception"
1.  Il frontend sta cercando di parlare con un contratto che non esiste sulla blockchain attuale.
2.  Assicurati di aver eseguito `scripts/magic_deploy.js`.
3.  Controlla che l'indirizzo in `frontend/src/utils/contractABI.js` corrisponda a quello stampato dal deploy script.
4.  Resetta il "Nonce" in Metamask (Impostazioni > Avanzate > Cancella attività tab) se hai riavviato la blockchain.

### Problemi di connessione Backend <-> Blockchain
*   Se usi Docker, il backend deve puntare a `http://blockchain:8545` (nome del servizio nel compose).
*   Se usi manuale, deve puntare a `http://127.0.0.1:8545`.

### File Upload fallisce
*   Controlla i permessi della cartella `backend/uploads`.
*   Verifica che `API_SECRET_TOKEN` corrisponda tra frontend e backend se lo stai usando.
