# Docker Quickstart

## Prerequisiti
- Docker e Docker Compose installati
- Copia i template env:
  - `cp backend/.env.template backend/.env` (aggiorna PINATA_API_KEY/SECRET se vuoi usare IPFS reale; lascia vuoto API_SECRET_TOKEN per dev aperto)
  - `cp frontend/.env.template frontend/.env` (allinea VITE_API_URL/VITE_RPC_URL al tuo setup)

## Avvio stack
```sh
docker compose up --build
```
- Frontend: http://localhost:4173
- Backend: http://localhost:3001
- RPC Hardhat: http://localhost:8545

## Popola dati demo
Dentro il container Hardhat:
```sh
docker compose exec blockchain npx hardhat run scripts/magic_deploy.js --network localhost
```
Aggiorna il `CONTRACT_ADDRESS` nel frontend automaticamente.

## Note
- Il compose usa preview build per il frontend (Node 20). Se modifichi il codice, ricostruisci l'immagine (`docker compose build frontend`).
- Se non vuoi l'avviso di versione compose, l'abbiamo già tolto. Use network bridge di default. 
