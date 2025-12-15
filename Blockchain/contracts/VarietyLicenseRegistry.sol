// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

import "./structs/StruttureDati.sol";

contract VarietyLicenseRegistry {
  address private authority; //indirizzo dell'Authority (per convenzione sarà colui che deploya il contratto)
  uint256 private varietyCounter; //contatore delle varietà registrate
  uint256 private batchCounter;  //contatore dei batch registrati
  uint256 private licenseCounter; //contatore delle licenze emesse
  address private pendingAuthority; //indirizzo del nuovo indirizzo dell'Authority in caso di trasferimento
  uint256[] private pendingBatchIDs; //array degli ID dei batch in attesa di ispezione


  //mappatura
  mapping (uint256 => Variety) private varieties; //mappatura delle varietà registrate
  mapping (uint256 => Batch) private batches; //mappatura dei batch registrati
  mapping (uint256 => License) private licenses; //mappatura delle licenze emesse
  mapping(address => uint256[]) private licenseeToLicenses; //mappatura delle licenze per ogni licenziatario [licensee address => array di licenseID]
  mapping (uint256 => uint256[]) private varietyToLicenses; //mappatura delle licenze per ogni varietà [varietyID => array di licenseID]
  mapping (address => bool) private authorizedInspectors; //mappatura degli ispettori autorizzati
  mapping (string => bool) private registrationNumbers; //mappatura dei numeri di registrazione delle varietà per evitare duplicati
  mapping(uint256 => uint256) private batchIdToPendingIndex; //mappatura per tracciare l'indice di un batch nell'array dei batch in pending




  /*
    =========MODIFIER==========
  */

  //SOLO AUTHORITY
  modifier onlyAuthority() {
    require(msg.sender == authority, "Only authority can call this function");
    _;
  }

  //SOLO ISPETTORI AUTORIZZATI
  modifier onlyInspector() {
    require(authorizedInspectors[msg.sender], "Only authorized inspectors can call this function");
    _;
  }

  //SOLO BREEDER DELLA VARIETÀ
  modifier onlyBreederOf(uint256 _varietyId) {
    require(msg.sender != authority, "Authority cannot be a breeder");
    require(varieties[_varietyId].breeder == msg.sender, "Only breeder of this variety can call this function");
    _;
  }

  //SOLO LICENZATARIO
  modifier onlyLicenseeOf(uint256 _licenseId) {
    require(msg.sender != authority, "Authority cannot be a licensee");
    require(licenses[_licenseId].licensee == msg.sender, "Only licensee of this license can call this function");
    _;
  }

  //ESISTENZA VARIETÀ, BATCH, LICENZA
  modifier varietyExists(uint256 _varietyID) {
    require(_varietyID > 0 && _varietyID <= varietyCounter, "Invalid variety ID");
    _;
  }
  modifier batchExists(uint256 _batchId) {
    require(_batchId > 0 && _batchId <= batchCounter, "Invalid batch ID");
    _;
  }
  modifier licenseExists(uint256 _licenseId) {
    require(_licenseId > 0 && _licenseId <= licenseCounter, "Invalid license ID");
    _;
  }






  /*
    =========EVENTI==========
  */
  event VarietyRegistered(
    uint256 indexed varietyID,
    string denomination,
    string registrationNumber,
    address indexed breeder,
    uint256 registrationDate
  );

  event VarietyRevoked(
    uint256 indexed varietyID,
    string reason,
    uint256 revocationDate
  );

  event InspectorAdded(
    address indexed inspector,
    uint256 addedDate
  );

  event InspectorRemoved(
    address indexed inspector,
    uint256 removedDate
  );

  event AuthorityChanged(
    address indexed oldAuthority,
    address indexed newAuthority,
    uint256 changeDate
  );

  event LicenseIssued(
    uint256 indexed licenseID,
    uint256 indexed varietyID,
    address indexed licensee,
    uint256 issueDate,
    uint256 expiryDate
  );

  event LicenseRevoked(
    uint256 indexed licenseID,
    string reason,
    uint256 revocationDate
  );

  event LicenseExpirationUpdated(
    uint256 indexed licenseID,
    uint256 oldExpirationDate,
    uint256 newExpirationDate,
    uint256 updateDate
  );

  event BatchCreated(
    uint256 indexed batchID,
    uint256 indexed varietyID,
    address indexed licensee,
    uint256 productionDate
  );

  event BatchInspected(
    uint256 indexed batchID,
    InspectionStatus inspectionStatus,
    address indexed inspector,
    uint256 inspectionDate
  );

  event authorityTransferred(
    address indexed oldAuthority,
    address indexed newAuthority,
    uint256 transferDate
  );




  //CONSTRUCTOR
  constructor() {
    authority = msg.sender; //l'authority è colui che deploya il contratto
    varietyCounter = 0;
    batchCounter = 0;
    licenseCounter = 0;
  }



  //++++Funzioni AUTHORITY+++++

  /**
    @notice Registra una varietà;
    @param _denomination Denominazione della varietà;
    @param _registrationNumber Numero di registrazione della varietà;
    @param _breeder Indirizzo del breeder della varietà;
    @param _documentHash Hash del documento di registrazione della varietà;
    @param _documentURI URI del documento di registrazione della varietà;
   */

  function registerVariety(
    string memory _denomination,
    string memory _registrationNumber,
    address _breeder,
    string memory _documentHash,
    string memory _documentURI
  ) public onlyAuthority {
    require(_breeder != authority, "Authority cannot be breeder");
    require(bytes(_denomination).length > 0, "Denomination cannot be empty");
    require(bytes(_registrationNumber).length > 0, "Registration number cannot be empty");
    require(!registrationNumbers[_registrationNumber], "Registration number already exists");
    require (_breeder != address(0), "Breeder address cannot be zero");
    require (bytes(_documentHash).length > 0, "Document hash cannot be empty");

    varietyCounter++; //incrementa il contatore delle varietà
    uint256 newVarietyID = varietyCounter; //ottiene il nuovo ID della varietà

    //crea la nuova varietà
    varieties[newVarietyID] = Variety({
      varietyID: newVarietyID,
      denomination: _denomination,
      registrationNumber: _registrationNumber,
      breeder: _breeder,
      documentHash: _documentHash,
      documentURI: _documentURI,
      registrationDate: block.timestamp,
      status: VarietyStatus.ACTIVE
    });

    registrationNumbers[_registrationNumber] = true; //segna il numero di registrazione come esistente, serve per evitare duplicati

    emit VarietyRegistered(newVarietyID, _denomination, _registrationNumber, _breeder, block.timestamp);
  }


  /**
    @notice Revoca una varietà (da utlizzare in casi eccezionali es. frode o erore nella registrazione);
    @param _varietyID ID della varietà da revocare;
    @param _reason Motivo della revoca;
  */
  function revokeVariety(
    uint256 _varietyID, 
    string memory _reason
    ) external onlyAuthority varietyExists(_varietyID) {
    require(varieties[_varietyID].status == VarietyStatus.ACTIVE, "Variety is already revoked");
    require(bytes(_reason).length>0, "Reason cannot be empty");
    Variety storage variety = varieties[_varietyID];

    variety.status = VarietyStatus.REVOKED;
    emit VarietyRevoked(_varietyID, _reason, block.timestamp);
  }


  /**
   @notice Aggiunge un ispettore autorizzato;
   @param _inspector Indirizzo dell'ispettore da autorizzare;
  */
  function addInspector(address _inspector) external onlyAuthority {
    require(_inspector != address(0), "Inspector address cannot be zero");
    require(!authorizedInspectors[_inspector], "Inspector is already authorized");

    authorizedInspectors[_inspector] = true;

    emit InspectorAdded(_inspector, block.timestamp);
  }

  /**
   @notice Rimuove un ispettore autorizzato;
   @param _inspector Indirizzo dell'ispettore da rimuovere;
  */
  function removeInspector(address _inspector) external onlyAuthority {
    require(authorizedInspectors[_inspector], "Inspector not present in the list of authorized inspectors");
    
    authorizedInspectors[_inspector] = false;

    emit InspectorRemoved(_inspector, block.timestamp);
  }

  
  /**
   @notice Inizia il processo di trasferimento dell'Authority a un nuovo indirizzo;
   @dev Questa funzione imposta un indirizzo "pending" che deve poi essere accettato dal nuovo indirizzo tramite la funzione acceptAuthority;
   @param _newAuthority Nuovo indirizzo dell'Authority;
   */
  function beginAuthorityTransfer(address _newAuthority) external onlyAuthority {
      require(_newAuthority != address(0), "Zero address");
      require(_newAuthority != authority, "Same as current authority");
      pendingAuthority = _newAuthority;
  }

  /**
   @notice Accetta il trasferimento dell'Authority al nuovo indirizzo;
   @dev Questa funzione deve essere chiamata dal nuovo indirizzo impostato come "pending" tramite la funzione beginAuthorityTransfer;
   */
  function acceptAuthority() external {
      require(msg.sender == pendingAuthority, "Not pending authority");
      emit AuthorityChanged(authority, pendingAuthority, block.timestamp);
      authority = pendingAuthority;
      pendingAuthority = address(0);

      emit AuthorityChanged(authority, pendingAuthority, block.timestamp);
  }





  //++++Funzioni ISPETTORI BREEDER+++++

  /**
    @notice Emette una licenza per una varietà registrata;
    @param _varietyID ID della varietà per cui emettere la licenza;
    @param _licensee Indirizzo del licenziatario;
    @param _expirationDate Data di scadenza della licenza (timestamp); se impostato a 0 la licenza non scade mai;
  */

  function issueLicense(
    uint256 _varietyID,
    address _licensee,
    uint256 _expirationDate
  ) external varietyExists(_varietyID) onlyBreederOf(_varietyID)  {
    require(_licensee != authority, "Authority cannot be licensee");
    require(_licensee != msg.sender, "Cannot issue license to yourself");
    require(_licensee != address(0), "Licensee address cannot be zero");
    require(varieties[_varietyID].status == VarietyStatus.ACTIVE, "Variety must be active to issue a license");

    if (_expirationDate == 0) {
      _expirationDate = type(uint256).max; //se la data di scadenza è 0, la licenza non scade mai
    } else {
      require(_expirationDate > block.timestamp, "Expiration date must be in the future");
    }

    // verifica che il licenziatario non abbia già una licenza attiva (non scaduta) per la stessa varietà
    uint256[] storage existingLicenses = licenseeToLicenses[_licensee];
    for (uint256 i = 0; i < existingLicenses.length; i++) {
      License storage license = licenses[existingLicenses[i]];

      bool sameVariety = (license.varietyID == _varietyID);
      bool notRevoked = (license.status == LicenseStatus.ACTIVE);

      // attiva se: permanente (max) oppure scade in futuro
      bool notExpired = (license.expiryDate == type(uint256).max) || (block.timestamp < license.expiryDate);

      if (sameVariety && notRevoked && notExpired) {
          revert("Licensee already has an active license for this variety");
      }
    }


    //crea la nuova licenza
    licenseCounter++;
    uint256 newLicenseID = licenseCounter;

    licenses[newLicenseID] = License({
      licenseID: newLicenseID,
      varietyID: _varietyID,
      licensee: _licensee,
      issueDate: block.timestamp,
      expiryDate: _expirationDate,
      revocationDate: 0,
      status: LicenseStatus.ACTIVE,
      revocationReason: ""
    });

    //aggiorna le mappature
    licenseeToLicenses[_licensee].push(newLicenseID);
    varietyToLicenses[_varietyID].push(newLicenseID);

    emit LicenseIssued(newLicenseID, _varietyID, _licensee, block.timestamp, _expirationDate);
  }



  /**
  @notice Revoca una licenza emessa; 
  LA REVOCA PUÒ ESSERE EFFETTUATA SOLO DAL BREEDER DELLA VARIETÀ CORRISPONDENTE;
  IN CASO DI EMERGENZA L'AUTHORITY PUÒ REVOCARE LA LICENZA TRAMITE LA FUNZIONE "revokeLicenseByAuthority";
  @param _licenseID ID della licenza da revocare;
  @param _reason Motivo della revoca;
  */
  function revokeLicense(
    uint256 _licenseID,
    string memory _reason
  ) external licenseExists(_licenseID) onlyBreederOf(licenses[_licenseID].varietyID)  {
    require(licenses[_licenseID].status == LicenseStatus.ACTIVE, "License is not active");
    require(bytes(_reason).length > 0, "Reason cannot be empty");

    License storage license = licenses[_licenseID];
    license.status = LicenseStatus.REVOKED;
    license.revocationDate = block.timestamp;
    license.revocationReason = _reason;

    emit LicenseRevoked(_licenseID, _reason, block.timestamp);

  }

  /**
    @notice Revoca una licenza emessa; 
    @dev LA REVOCA PUÒ ESSERE EFFETTUATA SOLO DALL'AUTHORITY IN CASO DI EMERGENZA;
    @param _licenseID ID della licenza da revocare;
    @param _reason Motivo della revoca;
  */
  function revokeLicenseByAuthority(
    uint256 _licenseID,
    string memory _reason
  ) external onlyAuthority licenseExists(_licenseID) {
    require(licenses[_licenseID].status == LicenseStatus.ACTIVE, "License is not active");
    require(bytes(_reason).length > 0, "Reason cannot be empty");

    License storage license = licenses[_licenseID];
    license.status = LicenseStatus.REVOKED;
    license.revocationDate = block.timestamp;
    license.revocationReason = _reason;

    emit LicenseRevoked(_licenseID, _reason, block.timestamp);

  }


  /**
  @notice Aggiornare la scadenza di una licenza esistente;
  @param _licenseID ID della licenza da prolungare;
  @param _newExpirationDate Nuova data di scadenza della licenza (timestamp);
  @dev 
  */
  function updateLicenseExpiration(
    uint256 _licenseID,
    uint256 _newExpirationDate
  ) external licenseExists(_licenseID) {
      License storage license = licenses[_licenseID];
      uint256 varietyId = license.varietyID;
      require(
        varieties[varietyId].breeder == msg.sender,
        "Only breeder can update expiration"
      );

      require(license.status == LicenseStatus.ACTIVE, "License is not active");
      if(_newExpirationDate == 0) {
          _newExpirationDate = type(uint256).max; //se la data di scadenza è 0, la licenza non scade mai
      } else {
          require(_newExpirationDate > block.timestamp, "Expiration date must be in the future");
      }

      uint256 oldExpirationDate = license.expiryDate;
      license.expiryDate = _newExpirationDate;
      emit LicenseExpirationUpdated(_licenseID, oldExpirationDate, _newExpirationDate, block.timestamp);
  }

  /**
  @notice rende una licenza permanentemente valida (senza scadenza);
  @param _licenseID ID della licenza da rendere permanente;
  @dev funzione facoltativa perchè la licenza può già essere emessa senza scadenza impostando la data di scadenza a 0 nella funzione issueLicense;
  */
  function makeLicensePermanent(
    uint256 _licenseID
  ) external licenseExists(_licenseID) {
    License storage license = licenses[_licenseID];
    require(
       license.expiryDate != type(uint256).max,
       "License is already permanent");

    uint256 varietyId = license.varietyID;
    require(
      varieties[varietyId].breeder == msg.sender,
      "Only breeder can make license permanent"
    );

    require(license.status == LicenseStatus.ACTIVE, "License is not active");
    uint256 oldExpirationDate = license.expiryDate;
    license.expiryDate = type(uint256).max; //imposta la data di scadenza al massimo valore possibile (licenza permanente)
    emit LicenseExpirationUpdated(_licenseID, oldExpirationDate, type(uint256).max, block.timestamp);
  }




  //++++Funzioni Licenziataro+++++
  
  /**
  @notice crea un nuovo lotto di produzione associato a una varietà per cui il licenziatario possiede una licenza attiva;
  @param _licenseID ID della licenza associata alla varietà prodotta;
  @param _quantity Quantità prodotta (es. "100 kg");
  @param _metadata Metadati aggiuntivi relativi al batch (es. note di produzione, condizioni ambientali, ecc.);
  @dev La data di produzione viene impostata automaticamente alla data corrente (block.timestamp);
  @dev Una volta creato, il batch non può essere modificato o cancellato, bisogna creare un nuovo batch in caso di errori,
  sarà poi compito dell'ispettore validare o invalidare il batch tramite l'ispezione.
  */

  function createBatch(
    uint256 _licenseID,
    string memory _quantity,
    string memory _metadata
  ) external licenseExists(_licenseID) onlyLicenseeOf(_licenseID)  {
    License storage license = licenses[_licenseID];
    require(license.status == LicenseStatus.ACTIVE, "License must be active to create a batch");
    require(
      license.expiryDate == type(uint256).max || license.expiryDate > block.timestamp,
      "License has expired"
    );
    require(bytes(_quantity).length > 0, "Quantity cannot be empty");

    batchCounter++; //incrementa il contatore dei batch
    uint256 newBatchID = batchCounter; //ottiene il nuovo ID del batch

    //crea il nuovo batch
    batches[newBatchID] = Batch({
      batchID: newBatchID,
      varietyID: license.varietyID,
      licenseID: _licenseID,
      productionDate: block.timestamp,
      quantity: _quantity,
      metadata: _metadata,
      status: BatchStatus.VALID,
      inspectionStatus: InspectionStatus.NOT_INSPECTED,
      inspector: address(0),
      inspectionDate: 0
    });

    pendingBatchIDs.push(newBatchID); //aggiunge il batch all'array dei batch in pending
    batchIdToPendingIndex[newBatchID] = pendingBatchIDs.length - 1; //traccia l'indice del batch nell'array dei batch in pending
    

    emit BatchCreated(newBatchID, license.varietyID, msg.sender, block.timestamp);
  }





  //++++Funzioni Ispettore+++++

  /**
  @notice Ispeziona un batch di produzione e ne determina la validità;
  @param _batchID ID del batch da ispezionare;
  @param _approve Booleano che indica se il batch è approvato (true) o rifiutato (false);
  @dev Il batch ha la possibilità di essere ri-ispezionato; si dà per buona l'ultima ispezione effettuata;
  @dev L'ispettore si dà per affidabile, non sono previste limitazioni sul numero di ispezioni effettuabili;
   */

  function inspectBatch(
    uint256 _batchID,
    bool _approve
    ) external onlyInspector batchExists(_batchID) {
    Batch storage batch = batches[_batchID];

    // 1. GESTIONE RIMOZIONE DALL'ARRAY PENDING (Solo se è la prima volta che viene ispezionato)
    // Se inspectionStatus è NOT_INSPECTED, significa che è ancora nell'array pending.
    if (batch.inspectionStatus == InspectionStatus.NOT_INSPECTED) {
        
        uint256 indexToRemove = batchIdToPendingIndex[_batchID];
        uint256 lastIndex = pendingBatchIDs.length - 1;

        // Se l'elemento da rimuovere non è l'ultimo, scambialo con l'ultimo
        if (indexToRemove != lastIndex) {
            uint256 lastBatchId = pendingBatchIDs[lastIndex];
            
            pendingBatchIDs[indexToRemove] = lastBatchId; // Sposta l'ultimo al posto di quello da rimuovere
            batchIdToPendingIndex[lastBatchId] = indexToRemove; // Aggiorna l'indice nella mappa per il batch spostato
        }

        pendingBatchIDs.pop(); // Rimuovi l'ultimo elemento (che ora è un duplicato o quello target)
        delete batchIdToPendingIndex[_batchID]; // Rimuovi il batch target dalla mappa
    }

    // 2. AGGIORNAMENTO STATO
    batch.inspector = msg.sender;
    batch.inspectionDate = block.timestamp;

    if (_approve) {
      batch.inspectionStatus = InspectionStatus.APPROVED;
      batch.status = BatchStatus.VALID;
    } else {
      batch.inspectionStatus = InspectionStatus.REJECTED;
      batch.status = BatchStatus.INVALIDATED;
    }

    emit BatchInspected( _batchID, batch.inspectionStatus, msg.sender, block.timestamp);
  }


  /**
   @notice funzione getter per ispettore per controllare i batch in pending
   @return Array di batch non ancora ispezionati
   */
  function getPendingBatches() external view onlyInspector returns (Batch[] memory) {
    uint256 count = pendingBatchIDs.length;
    Batch[] memory pendingList = new Batch[](count);

    for (uint256 i = 0; i < count; i++) {
        uint256 batchId = pendingBatchIDs[i];
        pendingList[i] = batches[batchId];
    }

    return pendingList;
}

  //++++Funzioni di lettura pubbliche VIEW (NON CONSUMA GAS)+++++


  /**
  @notice Funzione interna per concatenare messaggi di errore/avviso;
  @param base The base string to concatenate;
  @param add The string to append to the base string;
  */
  function _append(string memory base, string memory add)
    internal
    pure
    returns (string memory)
  {
    if (bytes(base).length == 0) return add;
    return string(abi.encodePacked(base, " | ", add));
  }

  /**
  @notice Recupera le informazioni di un batch di produzione (Fun principale per gli utenti finali es. scansione con QR code);
  @param _batchID ID del batch da recuperare;
  @return VerificationResult Struttura contenente i risultati della verifica del batch, della varietà e della licenza associata;
   */

  function verifyBatch(uint256 _batchID)
    external
    view
    batchExists(_batchID)
    returns (VerificationResult memory)
  {
    Batch memory batch = batches[_batchID];
    Variety memory variety = varieties[batch.varietyID];
    License memory license = licenses[batch.licenseID];

    bool isValid = true;
    bool hasWarning = false;
    bool licenseRevokedAfterProduction = false;

    TrustLevel trustLevel = TrustLevel.MEDIUM;
    string memory details = "";


    // Sanity check: la licenza deve riferirsi alla stessa varietà del batch
    if (license.varietyID != batch.varietyID) {
      isValid = false;
      trustLevel = TrustLevel.INVALID;
      details = _append(details, "Inconsistent data: license does not match batch variety");
    }

    // --- 1) Controlli "legali" sulla varietà ---
    if (variety.status != VarietyStatus.ACTIVE) {
        isValid = false;
        trustLevel = TrustLevel.INVALID;
        details = _append(details, "Variety revoked");
    }

    // --- 2) Coerenza temporale con registrazione varietà ---
    if (batch.productionDate < variety.registrationDate) {
        isValid = false;
        trustLevel = TrustLevel.INVALID;
        details = _append(details, "Batch produced before variety registration");
    }

    // --- 3) Coerenza temporale con emissione licenza ---
    if (batch.productionDate < license.issueDate) {
        isValid = false;
        trustLevel = TrustLevel.INVALID;
        details = _append(details, "Batch produced before license issue");
    }

    // --- 4) Gestione revoca licenza (errore o warning) ---
    if (license.status == LicenseStatus.REVOKED) {
        // Se revocationDate è 0 ma status è REVOKED -> stato incoerente: warning
        if (license.revocationDate == 0) {
            hasWarning = true;
            details = _append(details, "WARNING: License is REVOKED but revocationDate is 0");
        } else {
            // Prodotto dopo o uguale alla revoca => invalido
            if (batch.productionDate >= license.revocationDate) {
                isValid = false;
                trustLevel = TrustLevel.INVALID;
                details = _append(details, "License revoked before batch production");
            } else {
                // Prodotto prima => warning
                licenseRevokedAfterProduction = true;
                hasWarning = true;
                details = _append(details, "WARNING: License revoked after batch production");
            }
        }
    }

    // --- 5) Gestione scadenza licenza (errore o warning) ---
    // fonte primaria: expiryDate (per evitare incoerenze con status)
    bool licenseHasExpiry = (license.expiryDate != type(uint256).max);

    if (licenseHasExpiry) {
        // Se batch prodotto dopo la scadenza => invalido
        if (batch.productionDate > license.expiryDate) {
            isValid = false;
            trustLevel = TrustLevel.INVALID;
            details = _append(details, "License expired before batch production");
        } else {
            // Se la licenza è scaduta ora (ma batch è precedente) => warning
            if (block.timestamp > license.expiryDate) {
                hasWarning = true;
                details = _append(details, "WARNING: License expired after batch production");
            }
        }
    }

    // --- 6) Ispezione (alla fine) + TrustLevel ---
    if (batch.inspectionStatus == InspectionStatus.REJECTED) {
        details = _append(details, "Batch rejected by inspector");
        isValid = false;

        // se era già INVALID resta INVALID; altrimenti LOW (invalido “qualitativo”)
        if (trustLevel != TrustLevel.INVALID) trustLevel = TrustLevel.LOW;

    } else if (batch.inspectionStatus == InspectionStatus.APPROVED) {
        if (isValid) {
            // APPROVED + nessun warning => HIGH, altrimenti MEDIUM
            trustLevel = hasWarning ? TrustLevel.MEDIUM : TrustLevel.HIGH;

            if (bytes(details).length == 0) {
                details = "Batch valid and approved by inspector";
            } else {
                details = _append(details, "Approved by inspector");
            }
        } else {
            // non “salva” batch legalmente invalido
            if (trustLevel != TrustLevel.INVALID) trustLevel = TrustLevel.LOW;
        }

    } else { // NOT_INSPECTED
        details = _append(details, "Batch not yet inspected");

        if (isValid) {
            // valido ma non ispezionato => MEDIUM (anche se warning resta MEDIUM)
            trustLevel = TrustLevel.MEDIUM;
        } else {
            if (trustLevel != TrustLevel.INVALID) trustLevel = TrustLevel.LOW;
        }
    }

    // fallback raro
    if (bytes(details).length == 0) {
        details = isValid ? "Batch valid, no problems" : "Batch invalid";
    }

    return VerificationResult({
        isValid: isValid,
        message: details,
        variety: variety,
        license: license,
        batch: batch,
        breeder: variety.breeder,
        licenseRevokedAfterProduction: licenseRevokedAfterProduction,
        trustLevel: trustLevel
    });
  }

  //+++++GETTERS BASE+++++

  /**
   @notice Recupera l'indirizzo dell'Authority;
   @return address Indirizzo dell'Authority;
   */
  function getAuthority() external view returns (address) {
    return authority;
  }

  /**
   @notice Recupera l'indirizzo dell'Authority in pending (se in fase di trasferimento);
   @return address Indirizzo dell'Authority in pending;
   */
  function getPendingAuthority() external view returns (address) {
    return pendingAuthority;
  }


  /**
    @notice Verifica se un ispettore è autorizzato;
    @param _inspector Indirizzo dell'ispettore da verificare;
   */
  function isInspectorAuthorized(address _inspector) external view returns (bool) {
    return authorizedInspectors[_inspector];
  }

  /**
  @notice Recupera tutti i counter;
  */
  function getCounters() external view returns (uint256 varietiesCounter, uint256 batchesCounter, uint256 licensesCounter) {
    return (varietyCounter, batchCounter, licenseCounter);
  }

  /**
    @notice Recupera una varietà registrata dato il suo ID;
    @param _varietyID ID della varietà da recuperare;
   */
  function getVariety(uint256 _varietyID) external view
    varietyExists(_varietyID)
    returns (Variety memory)
  {
    return varieties[_varietyID];
  }

  /**
    @notice Recupera una licenza emessa dato il suo ID;
    @param _licenseID ID della licenza da recuperare;
   */
  function getLicense(uint256 _licenseID) external view
    licenseExists(_licenseID)
    returns (License memory)
  {
    return licenses[_licenseID];
  }

  /**
    @notice Recupera un batch di produzione dato il suo ID;
    @param _batchID ID del batch da recuperare;
   */
  function getBatch(uint256 _batchID) external view
    batchExists(_batchID)
    returns (Batch memory)
  {
    return batches[_batchID];
  }

  /**
  @notice Recupera tutte le licenze di un licenziatario (loggato);
  @return Array di licenze possedute dal licenziatario;
   */  
  function getLicensesByLicensee() external view returns (License[] memory) {
    uint256[] memory licenseIDs = licenseeToLicenses[msg.sender];
    License[] memory result = new License[](licenseIDs.length);

    for (uint256 i = 0; i < licenseIDs.length; i++) {
      result[i] = licenses[licenseIDs[i]];
    }

    return result;
  }


  /**
   @notice Recupera tutte le licenze associate a una varietà (solo breeder);
   @param _varietyID ID della varietà di cui recuperare le licenze;
   @return Array di licenze associate alla varietà;
   */

  function getLicensesByVariety(uint256 _varietyID)
    external
    view
    varietyExists(_varietyID)
    onlyBreederOf(_varietyID)
    returns (License[] memory)
  {
    uint256[] memory licenseIDs = varietyToLicenses[_varietyID];
    License[] memory result = new License[](licenseIDs.length);

    for (uint256 i = 0; i < licenseIDs.length; i++) {
      result[i] = licenses[licenseIDs[i]];
    }

    return result;
  }
}