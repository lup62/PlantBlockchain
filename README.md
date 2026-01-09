# PlantBlockchain (PlantChain)

Registro su blockchain per varietà, licenze e batch di produzione con documenti su IPFS e workflow a ruoli.

## Stack
- **Smart Contracts**: Solidity + Hardhat
- **Backend API**: Node.js + Express (Pinata/IPFS integration)
- **Frontend UI**: React + Vite + TailwindCSS

## Struttura Progetto
- `blockchain/`: Smart contracts, scripts di deploy, test.
- `backend/`: API Server per gestione upload file e relay IPFS.
- `frontend/`: Interfaccia utente (Authority, Breeder, Licensee, Inspector, Verify).

## Documentazione Completa
👉 **[LEGGI LA GUIDA AL DEPLOY (DEPLOY_GUIDE.md)](./DEPLOY_GUIDE.md)**

Troverai istruzioni dettagliate per:
- Requisiti e setup.
- Configurazione variabili d'ambiente (.env).
- Deployment con Docker (consigliato) e Manuale.
- Troubleshooting.

## Quickstart (Docker)
Se hai già Docker e vuoi partire subito:

1. **Configura gli env**:
   ```bash
   cp backend/.env.template backend/.env
   cp frontend/.env.template frontend/.env
   ```
2. **Avvia lo stack**:
   ```bash
   docker compose up --build
   ```
3. **Deploy Contratto & Dati Demo** (in un altro terminale):
   ```bash
   docker compose exec blockchain npx hardhat run scripts/magic_deploy.js --network localhost
   ```
4. **Accedi**:
   - Frontend: http://localhost:4173
   - Backend: http://localhost:3001

## Test
- **Smart Contracts**: `docker compose exec blockchain npm test`
- **E2E Frontend**:
  ```bash
  docker compose exec frontend npx playwright install chromium
  docker compose exec frontend npm run test:e2e
  ```

## Fatto con tanto amore da:
- **Oronzo Franchini**
- **Pasquale Lorusso**
- **Giovanni Pastore**

