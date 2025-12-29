# 🌱 Variety License Registry

**Sistema blockchain decentralizzato per la gestione di varietà vegetali, licenze e tracciabilità della produzione**

[![Solidity](https://img.shields.io/badge/Solidity-0.8.28-blue)](https://soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-2.22-yellow)](https://hardhat.org/)
[![License](https://img.shields.io/badge/License-UNLICENSED-red)]()

---

## 📋 Indice

- [Panoramica](#-panoramica)
- [Caratteristiche Principali](#-caratteristiche-principali)
- [Architettura](#-architettura)
- [Attori del Sistema](#-attori-del-sistema)
- [Flusso di Lavoro](#-flusso-di-lavoro)
- [Installazione](#-installazione)
- [Utilizzo](#-utilizzo)
- [Testing](#-testing)
- [Sistema di Verifica](#-sistema-di-verifica)
- [Sicurezza](#-sicurezza)
- [Gas Optimization](#-gas-optimization)
- [Deployment](#-deployment)
- [Roadmap](#-roadmap)

---

## 🎯 Panoramica

Il **Variety License Registry** è uno smart contract sviluppato su Ethereum che implementa un sistema completo per:

- ✅ **Registrazione** di varietà vegetali protette
- 📜 **Gestione licenze** per la coltivazione/produzione
- 📦 **Tracciabilità** dei lotti di produzione (batch)
- 🔍 **Sistema di ispezione** per la validazione qualitativa
- 🛡️ **Verifica dell'autenticità** con livelli di fiducia

### Caso d'Uso Principale

Immagina un sistema dove:
1. Un'**autorità centrale** (es. ente governativo) registra varietà vegetali protette
2. I **breeder** (creatori delle varietà) emettono licenze ai coltivatori
3. I **licenziatari** producono lotti tracciabili sulla blockchain
4. Gli **ispettori** certificano la qualità e conformità
5. I **consumatori finali** verificano l'autenticità tramite QR code

---

## ✨ Caratteristiche Principali

### 🔐 Controllo degli Accessi
- Sistema basato su ruoli (Authority, Breeder, Inspector, Licensee)
- Modifier personalizzati per ogni funzione critica
- Trasferimento sicuro dell'Authority (two-step process)

### 📊 Gestione Completa del Ciclo di Vita
```
Varietà → Licenza → Batch → Ispezione → Verifica
```

### 🎖️ Sistema di Trust Level
- **HIGH** (3): Batch valido, approvato, nessun warning
- **MEDIUM** (2): Valido ma non ispezionato o con warning
- **LOW** (1): Rifiutato dall'ispettore ma con licenza valida
- **INVALID** (0): Problemi legali (varietà revocata, licenza non valida)

### 📝 Eventi Completi
Tutti gli eventi critici sono tracciati on-chain per audit trail completo

### ⚡ Gas Efficient
- Ottimizzazione dell'optimizer Solidity (runs: 200)
- Gestione efficiente degli array pending con swap-and-pop

---

## 🏗️ Architettura

### Strutture Dati Principali

```solidity
struct Variety {
  uint256 varietyID;
  string denomination;
  string registrationNumber;
  address breeder;
  string documentHash;
  string documentURI;
  uint256 registrationDate;
  VarietyStatus status;
}

struct License {
  uint256 licenseID;
  uint256 varietyID;
  address licensee;
  uint256 issueDate;
  uint256 expiryDate;
  uint256 revocationDate;
  LicenseStatus status;
  string revocationReason;
}

struct Batch {
  uint256 batchID;
  uint256 varietyID;
  uint256 licenseID;
  uint256 productionDate;
  string quantity;
  string metadata;
  BatchStatus status;
  InspectionStatus inspectionStatus;
  address inspector;
  uint256 inspectionDate;
}
```

### Enumerazioni

```solidity
enum VarietyStatus { ACTIVE, REVOKED }
enum LicenseStatus { ACTIVE, REVOKED }
enum BatchStatus { VALID, INVALIDATED }
enum InspectionStatus { NOT_INSPECTED, APPROVED, REJECTED }
enum TrustLevel { INVALID, LOW, MEDIUM, HIGH }
```

---

## 👥 Attori del Sistema

### 1. 🏛️ Authority
**Chi è:** Ente governativo o organizzazione centrale

**Responsabilità:**
- Registrare nuove varietà vegetali
- Revocare varietà in caso di frode
- Aggiungere/rimuovere ispettori autorizzati
- Revocare licenze in caso di emergenza
- Trasferire il ruolo di Authority

**Funzioni:**
```solidity
registerVariety()
revokeVariety()
addInspector()
removeInspector()
revokeLicenseByAuthority()
beginAuthorityTransfer()
```

---

### 2. 🌱 Breeder
**Chi è:** Creatore/detentore dei diritti sulla varietà

**Responsabilità:**
- Emettere licenze ai coltivatori
- Revocare licenze in caso di violazioni
- Aggiornare la scadenza delle licenze
- Rendere licenze permanenti

**Funzioni:**
```solidity
issueLicense()
revokeLicense()
updateLicenseExpiration()
makeLicensePermanent()
```

---

### 3. 👨‍🌾 Licensee (Licenziatario)
**Chi è:** Coltivatore/produttore autorizzato

**Responsabilità:**
- Creare lotti di produzione tracciabili
- Fornire informazioni su quantità e metadata

**Funzioni:**
```solidity
createBatch()
```

---

### 4. 🔍 Inspector
**Chi è:** Ispettore autorizzato dall'Authority

**Responsabilità:**
- Ispezionare i batch di produzione
- Approvare o rifiutare i lotti
- Visualizzare i batch in attesa di ispezione

**Funzioni:**
```solidity
inspectBatch()
getPendingBatches()
```

---

### 5. 👤 Utente Pubblico
**Chi è:** Consumatore finale o verificatore

**Capacità:**
- Verificare l'autenticità di un batch tramite ID
- Visualizzare informazioni pubbliche su varietà, licenze e batch

**Funzioni:**
```solidity
verifyBatch() // VIEW
getVariety() // VIEW
getLicense() // VIEW
getBatch() // VIEW
```

---

## 🔄 Flusso di Lavoro

### Scenario Completo: Dalla Registrazione alla Verifica

```
1. REGISTRAZIONE VARIETÀ
   Authority registra "Pomodoro San Marzano DOP"
   ↓
2. EMISSIONE LICENZA
   Breeder concede licenza a Farm XYZ
   ↓
3. CREAZIONE BATCH
   Farm XYZ produce lotto #001 (500 kg)
   ↓
4. ISPEZIONE
   Inspector certifica la qualità
   ↓
5. VERIFICA
   Consumatore scansiona QR code → Trust Level: HIGH ✅
```

### Diagramma di Stato - Batch

```
NOT_INSPECTED ────┐
                  │
                  ├──> APPROVED (VALID)
                  │
                  └──> REJECTED (INVALIDATED)
```

### Gestione Pending Batches

I batch vengono automaticamente aggiunti a un array di "pending" alla creazione e rimossi dopo la prima ispezione, ottimizzando la gestione per gli ispettori.

---

## 🚀 Installazione

### Prerequisiti

- Node.js >= v16.0.0
- npm >= 8.0.0
- Git

### Setup

```bash
# Clone del repository
git clone https://github.com/your-org/variety-license-registry.git
cd variety-license-registry/Blockchain

# Installazione dipendenze
npm install

# Compila i contratti
npx hardhat compile

# Esegui i test
npx hardhat test

# Coverage dei test
npx hardhat coverage
```

---

## 📖 Utilizzo

### Deploy Locale

```bash
# Avvia nodo locale Hardhat
npx hardhat node

# In un altro terminale, deploy
npx hardhat run scripts/deploy.js --network localhost
```

### Interazione con il Contratto

```javascript
const { ethers } = require("hardhat");

async function main() {
  const registry = await ethers.getContractAt(
    "VarietyLicenseRegistry",
    "CONTRACT_ADDRESS"
  );

  // Registra una varietà
  const tx = await registry.registerVariety(
    "Pomodoro San Marzano",
    "REG-2024-001",
    breederAddress,
    "QmHash123...",
    "ipfs://metadata"
  );
  await tx.wait();

  console.log("Varietà registrata!");
}

main();
```

---

## 🧪 Testing

### Esecuzione Test

```bash
# Tutti i test
npx hardhat test

# Test specifico
npx hardhat test test/VarietyLicenseRegistry.test.js

# Con gas report
REPORT_GAS=true npx hardhat test

# Coverage
npx hardhat coverage
```

### Copertura dei Test

Il progetto include **30+ test** che coprono:

- ✅ Deployment e inizializzazione
- ✅ Gestione Authority e ispettori
- ✅ Registrazione e revoca varietà
- ✅ Emissione e gestione licenze
- ✅ Creazione batch
- ✅ Sistema di ispezione
- ✅ Verifica batch con tutti i trust level
- ✅ Edge cases e sicurezza

**Target Coverage:** >95%

---

## 🔍 Sistema di Verifica

### Funzione `verifyBatch()`

Questa è la funzione **più importante** per gli utenti finali. Restituisce un oggetto `VerificationResult` completo:

```solidity
struct VerificationResult {
  bool isValid;                         // Batch valido o invalido
  string message;                       // Dettagli/warning
  Variety variety;                      // Dati della varietà
  License license;                      // Dati della licenza
  Batch batch;                          // Dati del batch
  address breeder;                      // Indirizzo del breeder
  bool licenseRevokedAfterProduction;  // Flag warning
  TrustLevel trustLevel;               // Livello di fiducia
}
```

### Matrice dei Trust Level

| Condizione | isValid | TrustLevel | Scenario |
|-----------|---------|------------|----------|
| Approved + Nessun problema | ✅ true | HIGH | Prodotto certificato e conforme |
| Valid + Non ispezionato | ✅ true | MEDIUM | Prodotto legale ma non certificato |
| Valid + Warning (licenza scaduta dopo) | ✅ true | MEDIUM | Prodotto valido con avviso |
| Rejected da inspector | ❌ false | LOW | Problemi qualitativi |
| Varietà revocata | ❌ false | INVALID | Problemi legali gravi |
| Licenza non valida alla produzione | ❌ false | INVALID | Produzione non autorizzata |

### Esempio di Utilizzo (Frontend)

```javascript
async function verificaBatch(batchID) {
  const result = await contract.verifyBatch(batchID);
  
  if (result.trustLevel === 3) {
    console.log("✅ PRODOTTO CERTIFICATO");
    console.log(`Varietà: ${result.variety.denomination}`);
    console.log(`Produttore: ${result.breeder}`);
  } else if (result.trustLevel === 0) {
    console.log("❌ PRODOTTO NON VALIDO");
    console.log(`Motivo: ${result.message}`);
  }
  
  return result;
}
```

---

## 🛡️ Sicurezza

### Misure di Sicurezza Implementate

1. **Access Control**
   - Modifier per ogni ruolo
   - Verifiche multiple su ogni funzione critica

2. **Prevenzione Duplicati**
   - Mapping per numeri di registrazione univoci
   - Controllo licenze attive duplicate

3. **Validazione Input**
   - Require per tutti i parametri critici
   - Controlli su stringhe vuote, indirizzi zero

4. **Immutabilità dei Dati**
   - I batch non possono essere modificati
   - Solo aggiunta di nuove ispezioni

5. **Two-Step Authority Transfer**
   - Previene trasferimenti accidentali
   - Richiede accettazione esplicita

6. **Gestione Temporale**
   - Controlli di coerenza temporale
   - Prevenzione di backdating

### Audit Consigliati

Prima del deployment in produzione:
- ✅ Audit di sicurezza professionale
- ✅ Test formali con fuzzing
- ✅ Revisione economica del gas
- ✅ Test su testnet pubblica per 30+ giorni

---

## ⚡ Gas Optimization

### Strategie Implementate

1. **Optimizer Solidity**
   ```javascript
   optimizer: {
     enabled: true,
     runs: 200  // Bilanciamento deploy/execution
   }
   ```

2. **Efficient Storage**
   - Uso di `uint256` invece di tipi più piccoli (packing non conveniente)
   - Minimizzazione di SSTORE operations

3. **Array Management**
   - Swap-and-pop per rimozione da array pending
   - Evita loop complessi on-chain

4. **String Optimization**
   - Hash su IPFS per documenti grandi
   - String brevi per metadati on-chain

### Gas Report Esempio

| Funzione | Gas Medio | Scenario |
|----------|-----------|----------|
| registerVariety | ~150,000 | Prima registrazione |
| issueLicense | ~120,000 | Emissione licenza |
| createBatch | ~100,000 | Creazione batch |
| inspectBatch | ~80,000 | Prima ispezione |
| verifyBatch | ~50,000 | View (gratis) |

---

## 🌐 Deployment

### Testnet (Sepolia)

```bash
# Configura .env
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
PRIVATE_KEY=your_private_key

# Deploy
npx hardhat run scripts/deploy.js --network sepolia

# Verifica su Etherscan
npx hardhat verify --network sepolia CONTRACT_ADDRESS
```

### Mainnet

⚠️ **ATTENZIONE:** Il contratto supera il limite di 24KB. Prima del deployment su mainnet:

1. Abilitare optimizer con `runs` basso (50-100)
2. Considerare di splittare in contratti modulari
3. Valutare Layer 2 (Polygon, Arbitrum) per costi ridotti

---

## 🗺️ Roadmap

### ✅ Fase 1: Core Implementation (Completata)
- [x] Smart contract base
- [x] Sistema di ruoli
- [x] Test completi
- [x] Documentazione

### 🚧 Fase 2: Frontend & Integrazione (In Progress)
- [ ] Web app React per gestione
- [ ] Sistema QR code per verifica
- [ ] Mobile app per ispettori
- [ ] API REST per integrazioni

### 📋 Fase 3: Advanced Features
- [ ] Sistema di royalties per breeder
- [ ] Marketplace di licenze
- [ ] Integrazione IoT (sensori in campo)
- [ ] Oracle per dati meteo/ambientali

### 🌍 Fase 4: Scaling & Adoption
- [ ] Deploy su Layer 2
- [ ] Partnership con enti certificatori
- [ ] Interoperabilità con altri registri
- [ ] Standard ERC per varietà vegetali

---

## 📄 Licenza

Questo progetto è attualmente **UNLICENSED**. Per utilizzi commerciali, contattare gli autori.

---

## 👨‍💻 Autori

- **Your Name** - *Initial work* - [GitHub](https://github.com/yourusername)

---

## 🙏 Ringraziamenti

- Community Hardhat
- OpenZeppelin per best practices
- Ethereum Foundation

---

## 📞 Contatti

- **Email:** your.email@example.com
- **Discord:** YourServer#1234
- **Twitter:** @YourHandle

---

## 📚 Risorse Aggiuntive

- [Documentazione Tecnica Dettagliata](./docs/TECHNICAL.md)
- [Guida Utente](./docs/USER_GUIDE.md)
- [API Reference](./docs/API.md)
- [FAQ](./docs/FAQ.md)

---

**Made with ❤️ and ☕ for a transparent food supply chain**
