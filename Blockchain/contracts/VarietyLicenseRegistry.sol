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

  //mappatura
  mapping (uint256 => Variety) private varieties; //mappatura delle varietà registrate
  mapping (uint256 => Batch) private batches; //mappatura dei batch registrati
  mapping (uint256 => License) private licenses; //mappatura delle licenze emesse
  mapping(address => uint256[]) private licenseeToLicenses; //mappatura delle licenze per ogni licenziatario [licensee address => array di licenseID]
  mapping (uint256 => uint256[]) private varietyToLicenses; //mappatura delle licenze per ogni varietà [varietyID => array di licenseID]
  mapping (address => bool) private authorizedInspectors; //mappatura degli ispettori autorizzati
  mapping (string => bool) private registrationNumbers; //mappatura dei numeri di registrazione delle varietà per evitare duplicati




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
    @notice Cambia l'indirizzo dell'Authority; 
    @dev !!ATTENZIONE!! Questa operazione è IRREVERSIBILE e fa perdere il controllo del contratto all'attuale Authority;
    @param _newAuthority Nuovo indirizzo dell'Authority;
  */
  function changeAuthority(address _newAuthority) external onlyAuthority {
    require(_newAuthority != address(0), "New authority address cannot be zero");
    require(_newAuthority != authority, "New authority address must be different from the current one");

    address oldAuthority = authority;
    authority = _newAuthority;
    
    emit AuthorityChanged(oldAuthority, _newAuthority, block.timestamp);
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
  ) external onlyBreederOf(_varietyID) varietyExists(_varietyID) {
    require(_licensee != authority, "Authority cannot be licensee");
    require(_licensee != address(0), "Licensee address cannot be zero");
    require(varieties[_varietyID].status == VarietyStatus.ACTIVE, "Variety must be active to issue a license");

    if (_expirationDate == 0) {
      _expirationDate = type(uint256).max; //se la data di scadenza è 0, la licenza non scade mai
    } else {
      require(_expirationDate > block.timestamp, "Expiration date must be in the future");
    }

    //verifca che il licenziatario non abbia già una licenza attiva per la stessa varietà
    uint256[] storage existingLicenses = licenseeToLicenses[_licensee];
    for (uint256 i = 0; i < existingLicenses.length; i++) {
      License storage lic = licenses[existingLicenses[i]];
      if (lic.varietyID == _varietyID && lic.status == LicenseStatus.ACTIVE) {
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
  ) external onlyLicenseeOf(_licenseID) licenseExists(_licenseID) {
    License storage license = licenses[_licenseID];
    require(license.status == LicenseStatus.ACTIVE, "License must be active to create a batch");
    require(license.expiryDate > block.timestamp, "License has expired");

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

    emit BatchCreated(newBatchID, license.varietyID, msg.sender, block.timestamp);
  }





  //++++Funzioni Ispettore+++++

  /**
  @notice Ispeziona un batch di produzione e ne determina la validità;
  @param _batchID ID del batch da ispezionare;
  @param _approve Booleano che indica se il batch è approvato (true) o rifiutato (false);
  @dev Il batch ha la possibilità di essere ri-ispezionato;
   */

  function inspectBatch(
    uint256 _batchID,
    bool _approve
    ) external onlyInspector batchExists(_batchID) {
    Batch storage batch = batches[_batchID];

    //aggiorna lo stato del batch in base all'ispezione
    batch.inspector = msg.sender;
    batch.inspectionDate = block.timestamp;

    if (_approve) {
      batch.inspectionStatus = InspectionStatus.APPROVED; //se approvato
      batch.status = BatchStatus.VALID;
    } else {
      batch.inspectionStatus = InspectionStatus.REJECTED; //se rifiutato
      batch.status = BatchStatus.INVALIDATED;
    }

    emit BatchInspected( _batchID, batch.inspectionStatus, msg.sender, block.timestamp);
  }



  //++++Funzioni di lettura pubbliche VIEW (NON CONSUMA GAS)+++++

  /**
  @notice Recupera le informazioni di un batch di produzione (Fun principale per gli utenti finali es. scansione con QR code);
  @param _batchID ID del batch da recuperare;
  @return VerificationResult Struttura contenente i risultati della verifica del batch, della varietà e della licenza associata;
   */
   function verifyBatch(uint256 _batchID) 
   external view batchExists(_batchID) returns (VerificationResult memory) {
    
    Batch memory batch = batches[_batchID]; //ottiene il batch
    Variety memory variety = varieties[batch.varietyID]; //ottiene la varietà associata al batch
    License memory license = licenses[batch.licenseID];  //ottiene la licenza associata alla varietà del batch

    bool isValid = true; //indica se il batch è valido
    string memory message = "Batch valid, no problems"; //messaggio di stato
    bool licenseRevokedAfterProduction = false; //indica se la licenza è stata revocata dopo la produzione del batch
    TrustLevel trustLevel = TrustLevel.MEDIUM; //default trust level

    //1. Verifica varietà
    if (variety.status != VarietyStatus.ACTIVE) {
      isValid = false;
      message = "Variety is revoked";
      trustLevel = TrustLevel.LOW;

      //ritorna il risultato della verifica
      return VerificationResult({
        isValid: isValid,
        message: message,
        variety: variety,
        license: license,
        batch: batch,
        breeder: variety.breeder,
        licenseRevokedAfterProduction: licenseRevokedAfterProduction,
        trustLevel: trustLevel
      });
    }

    //2. Lotto prodotto dopo emissione licenza?
    if (batch.productionDate < variety.registrationDate) {
      isValid = false;
      message = "Batch produced before variety registration";
      trustLevel = TrustLevel.LOW;

      //ritorna il risultato della verifica
      return VerificationResult({
        isValid: isValid,
        message: message,
        variety: variety,
        license: license,
        batch: batch,
        breeder: variety.breeder,
        licenseRevokedAfterProduction: licenseRevokedAfterProduction,
        trustLevel: trustLevel
      });
    }

    //3. Gestione licenza revocata (CRITICA)
    if(license.status == LicenseStatus.REVOKED) {
      if(batch.productionDate < license.revocationDate) {
        isValid = true;
        message = "Batch valid - License was revoked after batch production";
        licenseRevokedAfterProduction = true;
        trustLevel = TrustLevel.LOW;

      } else {
        isValid = false;
        message = "License revoked before batch production";
        trustLevel = TrustLevel.INVALID;

        //ritorna il risultato della verifica
        return VerificationResult({
          isValid: isValid,
          message: message,
          variety: variety,
          license: license,
          batch: batch,
          breeder: variety.breeder,
          licenseRevokedAfterProduction: licenseRevokedAfterProduction,
          trustLevel: trustLevel
        });
      }
    }

    //4. Verifica licenza attiva e non scaduta
    if(block.timestamp > license.expiryDate) {
      
      //Controlla se prodotto prima della scadenza
      if(batch.productionDate <= license.expiryDate) {
        isValid = true;
        message = "Batch valid - License expired after batch production";
        trustLevel = TrustLevel.MEDIUM;
      } else {
        isValid = false;
        message = "License expired before batch production";
        trustLevel = TrustLevel.INVALID;

        //ritorna il risultato della verifica
        return VerificationResult({
          isValid: isValid,
          message: message,
          variety: variety,
          license: license,
          batch: batch,
          breeder: variety.breeder,
          licenseRevokedAfterProduction: licenseRevokedAfterProduction,
          trustLevel: trustLevel
        });
      }

    }

    //5. Se tutti i controlli passano, ritorna il risultato positivo
    return VerificationResult({
      isValid: isValid,
      message: message,
      variety: variety,
      license: license,
      batch: batch,
      breeder: variety.breeder,
      licenseRevokedAfterProduction: licenseRevokedAfterProduction,
      trustLevel: trustLevel
    });
  }
}