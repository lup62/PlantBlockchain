# Guida rapida: da GitHub al frontend funzionante

## 1) Clona il repo
```sh
git clone <URL_GITHUB>
cd PlantBlockchain
```

## 2) Prepara gli .env
- Backend:
  ```sh
  cp backend/.env.template backend/.env
  ```
  (Puoi lasciare i valori di default; `API_SECRET_TOKEN` vuoto evita 401 in dev.)
- Frontend:
  ```sh
  cp frontend/.env.template frontend/.env
  ```
  (Default: API su 3001, RPC su 8545, chain 31337.)

## 3) Avvia lo stack con Docker
```sh
docker compose up --build
```
Porte:
- Frontend: http://localhost:4173
- Backend API: http://localhost:3001
- Hardhat RPC: http://localhost:8545

## 4) Popola dati demo (contratto + seed)
In un terminale separato, con i container attivi:
```sh
docker compose exec blockchain npx hardhat run scripts/magic_deploy.js --network localhost
```
Deploya il contratto, aggiorna il `CONTRACT_ADDRESS` nel frontend e inserisce inspector/varietà/licenza demo.

## 5) Test rapidi
- Health backend:
  ```sh
  curl http://localhost:3001/api/health
  ```
- Test smart contract (opzionale):
  ```sh
  docker compose exec blockchain npm test
  ```
- E2E frontend (Playwright):
  ```sh
  docker compose exec frontend npx playwright install chromium   # una sola volta
  docker compose exec frontend npm run test:e2e
  ```

## 6) Usa l’app
Apri http://localhost:4173. Con il seed già fatto vedi dati demo. Per usare Metamask:
- Rete: Hardhat, RPC http://127.0.0.1:8545, Chain ID 31337.
- Importa una chiave dal log Hardhat (20 account predefiniti).

## 7) Note
- Se cambi API/porta, aggiorna i `.env` e rilancia `docker compose up --build`.
- Ricostruzione solo frontend: `docker compose build frontend`.
- Avvisi su `version` in compose: già rimosso.
