
## Tutti i Casi d'Uso del Sistema

| ID | Caso d'Uso | Authority | Breeder | Licenziatario | Inspector | Utilizzatore | Note |
|----|------------|-----------|---------|---------------|-----------|--------------|------|
| **UC1** | Registrare Varietà | ✅ Principale | ❌ | ❌ | ❌ | ❌ | Solo Authority |
| **UC2** | Modificare Stato Varietà | ✅ Principale | ❌ | ❌ | ❌ | ❌ | Solo Authority |
| **UC2A** | Revocare Varietà | ✅ Principale | ❌ | ❌ | ❌ | ❌ | Extend di UC2 |
| **UC3** | Emettere Licenza | ❌ | ✅ Principale | ❌ | ❌ | ❌ | Solo Breeder proprietario |
| **UC4** | Revocare Licenza | ⚠️ Emergenza | ✅ Principale | ❌ | ❌ | ❌ | Breeder o Authority |
| **UC4A** | Aggiornare Scadenza Licenza | ❌ | ✅ Principale | ❌ | ❌ | ❌ | Solo Breeder proprietario |
| **UC4B** | Rendere Licenza Permanente | ❌ | ✅ Principale | ❌ | ❌ | ❌ | Solo Breeder proprietario |
| **UC5** | Creare Lotto | ❌ | ❌ | ✅ Principale | ❌ | ❌ | Solo con licenza valida |
| **UC6** | Verificare Lotto | 👁️ Può | 👁️ Può | 👁️ Può | 👁️ Può | ✅ Principale | Pubblico, view |
| **UC7** | Consultare Proprie Licenze | ❌ | ❌ | ✅ Principale | ❌ | ❌ | Solo licenziatario |
| **UC8** | Consultare Licenze Emesse | ❌ | ✅ Principale | ❌ | ❌ | ❌ | Solo per sue varietà |
| **UC9** | Consultare Varietà Registrate | 👁️ Può | 👁️ Può | 👁️ Può | 👁️ Può | ✅ Principale | Pubblico, view |
| **UC10** | Ispezionare Lotto | ❌ | ❌ | ❌ | ✅ Principale | ❌ | Solo ispettori autorizzati |
| **UC11** | Approvare Lotto | ❌ | ❌ | ❌ | ✅ Principale | ❌ | Dopo ispezione positiva |
| **UC12** | Rifiutare Lotto | ❌ | ❌ | ❌ | ✅ Principale | ❌ | Dopo ispezione negativa |
| **UC13** | Gestire Ispettori | ✅ Principale | ❌ | ❌ | ❌ | ❌ | Solo Authority |
| **UC13A** | Aggiungere Ispettore | ✅ Principale | ❌ | ❌ | ❌ | ❌ | Sotto-caso UC13 |
| **UC13B** | Rimuovere Ispettore | ✅ Principale | ❌ | ❌ | ❌ | ❌ | Sotto-caso UC13 |
| **UC14** | Consultare Lotti Pendenti | ❌ | ❌ | ❌ | ✅ Principale | ❌ | Solo ispettori |
| **UC15** | Trasferire Authority | ✅ Principale | ❌ | ❌ | ❌ | ❌ | Processo a 2 fasi |
| **UC15A** | Iniziare Trasferimento Authority | ✅ Principale | ❌ | ❌ | ❌ | ❌ | Fase 1 |
| **UC15B** | Accettare Authority | ⚠️ Solo Pendente | ❌ | ❌ | ❌ | ❌ | Fase 2 |

**Totale Casi d'Uso**: 21 (di cui 3 dedicati a Inspector, 2 per Authority Transfer)

---

## Funzioni Smart Contract per Attore

### AUTHORITY (Ente Certificatore)

| Funzione | Descrizione | Modifier | Gas Medio | Test |
|----------|-------------|----------|-----------|------|
| `registerVariety()` | Registra nuova varietà vegetale | `onlyAuthority` | **326.248** | 22 |
| `revokeVariety()` | Revoca varietà per frode/errore | `onlyAuthority` | **51.603** | 4 |
| `addInspector()` | Autorizza nuovo ispettore | `onlyAuthority` | **47.810** | 12 |
| `removeInspector()` | Rimuove autorizzazione ispettore | `onlyAuthority` | **25.976** | 1 |
| `revokeLicenseByAuthority()` | Revoca licenza (emergenza) | `onlyAuthority` | **96.298** | 1 |
| `beginAuthorityTransfer()` | Inizia processo trasferimento Authority | `onlyAuthority` | **46.297** | 1 |
| `acceptAuthority()` | Accetta ruolo di Authority (finale) | `onlyPendingAuthority` | **28.742** | 1 |

**Totale funzioni Authority**: 7

---

### BREEDER (Proprietario Varietà)

| Funzione | Descrizione | Modifier | Gas Medio | Test |
|----------|-------------|----------|-----------|------|
| `issueLicense()` | Emette licenza per propria varietà | `onlyBreederOf(varietyId)` | **257.212** | 18 |
| `revokeLicense()` | Revoca licenza emessa | `onlyBreederOf(varietyId)` | **100.652** | 2 |
| `updateLicenseExpiration()` | Modifica data scadenza licenza | `onlyBreederOf(varietyId)` | **37.502** | 1 |
| `makeLicensePermanent()` | Rende licenza senza scadenza | `onlyBreederOf(varietyId)` | **37.401** | 1 |
| `getLicensesForVariety()` | Vede licenze emesse | `onlyBreederOf(varietyId)` | 🆓 View | - |

**Totale funzioni Breeder**: 5

---

### LICENZIATARIO (Produttore Autorizzato)

| Funzione | Descrizione | Modifier | Gas Medio | Test |
|----------|-------------|----------|-----------|------|
| `createBatch()` | Crea lotto di sementi | `onlyLicenseeOf(licenseId)` | **245.200** | 11 |
| `getMyLicenses()` | Vede proprie licenze attive | Nessuno (view) | 🆓 View | - |

**Totale funzioni Licenziatario**: 2

---

### INSPECTOR (Ispettore Certificato)

| Funzione | Descrizione | Modifier | Gas Medio | Test |
|----------|-------------|----------|-----------|------|
| `inspectBatch()` | Ispeziona lotto (approva/rifiuta) | `onlyInspector` | **71.885** | 6 |
| `getPendingInspections()` | Vede lotti da ispezionare | Nessuno (view) | 🆓 View | - |

**Totale funzioni Inspector**: 2

> **Nota**: La funzione `inspectBatch()` gestisce sia approvazione che rifiuto con un singolo metodo che accetta un parametro booleano `approved`.

---

### PUBBLICO (Chiunque - View Functions)

| Funzione | Descrizione | Modifier | Gas | Scopo |
|----------|-------------|----------|-----|-------|
| `verifyBatch()` | Verifica validità lotto tramite ID/QR | Nessuno (view) | 🆓 View | Utilizzatore finale |
| `getVariety()` | Recupera dettagli varietà | Nessuno (view) | 🆓 View | Trasparenza |
| `getLicense()` | Recupera dettagli licenza | Nessuno (view) | 🆓 View | Trasparenza |
| `getBatch()` | Recupera dettagli lotto | Nessuno (view) | 🆓 View | Trasparenza |
| `isInspector()` | Verifica se indirizzo è ispettore | Nessuno (view) | 🆓 View | Utilità |

**Totale funzioni Pubbliche**: 5

---

## Modifiers (Controlli di Accesso)

| Modifier | Condizione | Usato in | Scopo |
|----------|-----------|----------|-------|
| `onlyAuthority()` | `msg.sender == authority` | registerVariety, revokeVariety, addInspector, removeInspector, beginAuthorityTransfer | Operazioni amministrative |
| `onlyPendingAuthority()` | `msg.sender == pendingAuthority` | acceptAuthority | Accettazione trasferimento |
| `onlyBreederOf(varietyId)` | `msg.sender == varieties[varietyId].breeder` | issueLicense, revokeLicense, updateLicenseExpiration, makeLicensePermanent | Gestione licenze |
| `onlyLicenseeOf(licenseId)` | `msg.sender == licenses[licenseId].licensee` | createBatch | Produzione lotti |
| `onlyInspector()` | `authorizedInspectors[msg.sender] == true` | inspectBatch | Ispezioni qualità |
| `varietyExists(varietyId)` | `varietyId > 0 && varietyId <= varietyCounter` | Varie funzioni view | Validazione input |
| `licenseExists(licenseId)` | `licenseId > 0 && licenseId <= licenseCounter` | Varie funzioni view | Validazione input |
| `batchExists(batchId)` | `batchId > 0 && batchId <= batchCounter` | Varie funzioni view | Validazione input |

**Totale Modifiers**: 8

---

## Eventi (Event Log)

| Evento | Parametri | Quando viene emesso | Chi ascolta |
|--------|-----------|---------------------|-------------|
| `VarietyRegistered` | varietyId, denomination, breeder, timestamp | Dopo registerVariety() | Authority UI, Breeder UI |
| `VarietyRevoked` | varietyId, reason, timestamp | Dopo revokeVariety() | Tutti, per alert |
| `LicenseIssued` | licenseId, varietyId, licensee, expirationDate, timestamp | Dopo issueLicense() | Breeder UI, Licensee UI |
| `LicenseRevoked` | licenseId, reason, timestamp | Dopo revokeLicense() | Licensee UI (alert!) |
| `LicenseExpirationUpdated` | licenseId, newExpiration, timestamp | Dopo updateLicenseExpiration() | Licensee UI |
| `LicenseMadePermanent` | licenseId, timestamp | Dopo makeLicensePermanent() | Licensee UI |
| `BatchCreated` | batchId, licenseId, producer, quantity, timestamp | Dopo createBatch() | Licensee UI, Inspector UI, Analytics |
| `BatchInspected` | batchId, inspector, approved, reason, timestamp | Dopo inspectBatch() | Licensee UI, Inspector UI |
| `InspectorAdded` | inspectorAddress, timestamp | Dopo addInspector() | Authority UI, Inspector UI |
| `InspectorRemoved` | inspectorAddress, timestamp | Dopo removeInspector() | Authority UI, Inspector UI |
| `AuthorityTransferInitiated` | currentAuthority, pendingAuthority, timestamp | Dopo beginAuthorityTransfer() | Authority UI |
| `AuthorityTransferred` | oldAuthority, newAuthority, timestamp | Dopo acceptAuthority() | Tutti, per sicurezza |

**Totale Eventi**: 12

---

## Strutture Dati (Structs)

### Variety (Varietà)
```solidity
struct Variety {
    uint256 id;
    string denomination;      // Nome commerciale
    address breeder;          // Proprietario
    uint256 registrationDate;
    VarietyStatus status;     // ACTIVE, REVOKED
    string ipfsHash;          // Documenti su IPFS
}
```

### License (Licenza)
```solidity
struct License {
    uint256 id;
    uint256 varietyId;
    address licensee;         // Chi riceve la licenza
    uint256 issueDate;
    uint256 expirationDate;   // 0 = permanente
    LicenseStatus status;     // ACTIVE, REVOKED, EXPIRED
    string ipfsHash;          // Contratto di licenza
}
```

### Batch (Lotto)
```solidity
struct Batch {
    uint256 id;
    uint256 licenseId;
    address producer;
    uint256 quantity;         // In kg o unità
    uint256 creationDate;
    BatchStatus status;       // PENDING, APPROVED, REJECTED
    InspectionStatus inspectionStatus;  // NOT_INSPECTED, APPROVED, REJECTED
    address inspector;        // Chi ha ispezionato
    string inspectionReason;  // Motivazione
    string ipfsHash;          // Certificati
}
```

### VerificationResult (Risultato Verifica)
```solidity
struct VerificationResult {
    bool isValid;             // Lotto valido?
    string varietyName;
    address breeder;
    address producer;
    uint256 quantity;
    string trustLevel;        // "HIGH", "MEDIUM", "LOW", "INVALID"
    string message;           // Dettagli per l'utente
}
```

---

## Enumerazioni (Enums)

| Enum | Valori | Descrizione |
|------|--------|-------------|
| `VarietyStatus` | ACTIVE, REVOKED | Stato varietà |
| `LicenseStatus` | ACTIVE, REVOKED, EXPIRED | Stato licenza |
| `BatchStatus` | PENDING, APPROVED, REJECTED | Stato lotto (deprecato, usa InspectionStatus) |
| `InspectionStatus` | NOT_INSPECTED, APPROVED, REJECTED | Stato ispezione lotto |

---

## Flussi di Lavoro Completi

### Flusso 1: Dalla Registrazione alla Verifica Finale

```
1️⃣ Authority registra varietà
   ↓ (VarietyRegistered event)
   ↓ Documenti caricati su IPFS
   
2️⃣ Breeder emette licenza a Licenziatario
   ↓ (LicenseIssued event)
   ↓ Contratto licenza su IPFS
   
3️⃣ Licenziatario crea lotto
   ↓ (BatchCreated event)
   ↓ Certificati su IPFS
   
4️⃣ Inspector vede lotto pendente
   ↓ getPendingInspections()
   
5️⃣ Inspector ispeziona fisicamente
   ↓ inspectBatch(batchId, true/false, "reason")
   
6️⃣ Sistema aggiorna stato lotto
   ↓ (BatchInspected event)
   ↓ 
   ├─→ APPROVED → Trust Level: HIGH ✅
   └─→ REJECTED → Trust Level: LOW ❌
   
7️⃣ Utilizzatore finale verifica QR code
   ↓ verifyBatch(batchId)
   
8️⃣ Sistema mostra trust level e dettagli completi
   └─→ Varietà + Licenza + Lotto + Ispezione
```

### Flusso 2: Gestione Ispettori

```
1️⃣ Authority aggiunge ispettore
   ↓ addInspector(inspectorAddress)
   ↓ (InspectorAdded event)
   
2️⃣ Inspector riceve notifica
   ↓ Dashboard aggiornata
   
3️⃣ Inspector accede a dashboard
   ↓ getPendingInspections()
   
4️⃣ Inspector ispeziona lotti
   ↓ inspectBatch(batchId, approved, reason)
   
[Se necessario]
5️⃣ Authority rimuove ispettore
   ↓ removeInspector(inspectorAddress)
   ↓ (InspectorRemoved event)
   
6️⃣ Ispettore perde accesso funzioni
   └─→ onlyInspector modifier blocca
```

### Flusso 3: Trasferimento Authority (2-Phase)

```
1️⃣ Authority corrente inizia trasferimento
   ↓ beginAuthorityTransfer(newAuthorityAddress)
   ↓ (AuthorityTransferInitiated event)
   ↓ pendingAuthority = newAuthorityAddress
   
2️⃣ Nuovo Authority viene notificato
   ↓ Dashboard mostra richiesta pendente
   
3️⃣ Nuovo Authority accetta
   ↓ acceptAuthority()
   ↓ (AuthorityTransferred event)
   ↓ authority = newAuthorityAddress
   ↓ pendingAuthority = address(0)
   
✅ Trasferimento completato
```

---

## 🎯 Trust Levels nella Verifica

| Trust Level | Colore | Condizioni | Messaggio |
|-------------|--------|------------|-----------|
| **INVALID** | 🔴 ⛔ | Lotto non esiste / Licenza revocata / Varietà revocata | "Lotto non valido o non autorizzato" |
| **LOW** | 🔴 | inspectionStatus == REJECTED | "Lotto rifiutato da ispettore certificato. Motivo: [reason]" |
| **MEDIUM** | 🟡 | inspectionStatus == NOT_INSPECTED + licenza valida | "Lotto valido su blockchain, non ancora ispezionato fisicamente" |
| **HIGH** | 🟢 ✅ | inspectionStatus == APPROVED + licenza valida | "Lotto valido e verificato da ispettore certificato" |

### Logica Trust Level
```
IF (licenza revocata OR varietà revocata OR lotto non esiste)
   → INVALID
ELSE IF (inspection == REJECTED)
   → LOW
ELSE IF (inspection == APPROVED)
   → HIGH
ELSE
   → MEDIUM
```

---

## 💰 Analisi Gas Report

### Deployment
- **VarietyLicenseRegistry**: 4.022.661 gas (13,4% del limite blocco)

### Funzioni più costose (Top 5)
1. `registerVariety()` → 326.248 gas
2. `issueLicense()` → 257.212 gas (media)
3. `createBatch()` → 245.200 gas (media)
4. `revokeLicense()` → 100.652 gas
5. `revokeLicenseByAuthority()` → 96.298 gas

### Funzioni più economiche (Top 5)
1. `removeInspector()` → 25.976 gas
2. `acceptAuthority()` → 28.742 gas
3. `makeLicensePermanent()` → 37.401 gas
4. `updateLicenseExpiration()` → 37.502 gas
5. `beginAuthorityTransfer()` → 46.297 gas

### Range di variabilità
- **inspectBatch()**: 39.059 - 86.830 gas (alta variabilità)
- **issueLicense()**: 228.714 - 262.950 gas (media variabilità)
- **createBatch()**: 232.192 - 246.584 gas (bassa variabilità)

## ✅ Caratteristiche Implementate

### Core Features
- ✅ Registrazione varietà con IPFS
- ✅ Emissione e revoca licenze
- ✅ Gestione scadenza licenze (con permanenti)
- ✅ Creazione lotti con tracciabilità
- ✅ Sistema di ispezione (singolo metodo approve/reject)
- ✅ Verifica pubblica con trust levels
- ✅ Gestione ispettori (add/remove)
- ✅ Trasferimento Authority (2-phase commit)

### Security Features
- ✅ Controlli di accesso granulari (8 modifiers)
- ✅ Validazione input (exists checks)
- ✅ Event logging completo (12 eventi)
- ✅ Immutabilità registro blockchain
- ✅ Separazione ruoli (5 attori distinti)

### Storage Features
- ✅ Storage documenti su IPFS/Pinata
- ✅ Hashes IPFS on-chain per integrità
- ✅ Mapping efficienti per query rapide
- ✅ Contatori per ID sequenziali

## Autori

**Progetto universitario Politecnico di Bari**

- **Oronzo Franchini**
- **Pasquale Lorusso**
- **Giovanni Pastore**

**Corso**: Ingegneria del Software  
**Anno Accademico**: 2025/2026  
**Repository**: https://github.com/lup62/PlantBlockchain
