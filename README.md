# PlantBlockchain (PlantChain)

Registro su blockchain per varieta, licenze e batch di produzione con documenti su IPFS e workflow a ruoli.

## Stack
- Solidity + Hardhat (smart contract)
- Node/Express (API + integrazione Pinata/IPFS)
- React + Vite + Tailwind (frontend)

## Struttura progetto
- `blockchain/` smart contract, scripts, test
- `backend/` API per upload/relay IPFS
- `frontend/` UI (Authority, Breeder, Licensee, Inspector, Verify)

## Quickstart (Docker)
1) Prepara gli `.env`:
```
cp backend/.env.template backend/.env
cp frontend/.env.template frontend/.env
```
2) Avvia lo stack:
```
docker compose up --build
```
3) Deploy + seed dati demo:
```
docker compose exec blockchain npx hardhat run scripts/magic_deploy.js --network localhost
```

Oppure se vuoi solo il deploy senza popolamento dei dati:
```
docker compose exec blockchain npx hardhat run scripts/deploy.js --network localhost
```
4) Apri:
- Frontend: http://localhost:4173
- Backend: http://localhost:3001
- RPC Hardhat: http://localhost:8545

## Sviluppo locale (senza Docker)
1) Prepara gli `.env` (come sopra).
2) Terminale 1 (node Hardhat):
```
cd blockchain
npm install
npx hardhat node
```
3) Terminale 2 (backend):
```
cd backend
npm install
npm run dev
```
4) Terminale 3 (frontend):
```
cd frontend
npm install
npm run dev
```
5) Deploy contratto:
```
cd blockchain
npx hardhat run scripts/magic_deploy.js --network localhost
```

## Deploy contratto e seed
`scripts/magic_deploy.js`:
- deploya `VarietyLicenseRegistry`
- aggiorna `frontend/src/utils/config.js` con `CONTRACT_ADDRESS`
- inserisce dati demo (inspector, varieta, licenza)

## Configurazione
Backend (`backend/.env.template`):
- `PORT`, `FRONTEND_URL`, `IPFS_GATEWAY`
- `PINATA_API_KEY`, `PINATA_SECRET_API_KEY`
- `API_SECRET_TOKEN` (deve combaciare con `VITE_API_SECRET_TOKEN`)

Frontend (`frontend/.env.template`):
- `VITE_API_URL`, `VITE_RPC_URL`, `VITE_CHAIN_ID`
- `VITE_IPFS_GATEWAY`, `VITE_API_SECRET_TOKEN`

## Uso con MetaMask
- Network: Hardhat Local
- RPC: http://127.0.0.1:8545
- Chain ID: 31337
- L'account deployer e l'Authority iniziale

## Test
Smart contract:
```
cd blockchain
npm test
```
E2E (Playwright):
```
docker compose exec frontend npx playwright install chromium
docker compose exec frontend npm run test:e2e
```

## Note
- Se cambi API/porte, aggiorna gli `.env` e ricostruisci il frontend.
- Se la UI mostra Authority "Loading" o "Access Denied", verifica che il contratto sia deployato e `CONTRACT_ADDRESS` sia aggiornato.

## License
Nessun file di licenza presente nel repo.
