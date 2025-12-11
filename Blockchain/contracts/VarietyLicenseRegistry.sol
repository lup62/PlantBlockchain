// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

import "./structs/StruttureDati.sol";

contract VafietyLicenseRegistry {
  address private authority; //indirizzo dell'Authority (per convenzione sarà colui che deploya il contratto)
  uint256 private varietyCounter; //contatore delle varietà registrate
  uint256 private batchCounter;  //contatore dei batch registrati
  uint256 private licenseCounter; //contatore delle licenze emesse

  //mappatura
  mapping (uint256 => Variety) private varieties; //mappatura delle varietà registrate
  mapping (uint256 => Batch) private batches; //mappatura dei batch registrati
  mapping (uint256 => License) private licenses; //mappatura delle licenze emesse
  mapping (uint256 => uint256[]) private varietyToBatches; //mappatura dei batch per ogni varietà
  mapping (uint256 => uint256[]) private varietyToLicenses; //mappatura delle licenze per ogni varietà
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
    require(_varietyID > 0 && _varietyID <= batchCounter, "Invalid batch ID");
    _;
  }
  modifier batchExists(uint256 _batchId) {
    require(_batchId > 0 && _batchId <= batchCounter, "Invalid batch ID");
    _;
  }
  modifier licenseExists(uint256 _licenseId) {
    require(_licenseId > 0 && _licenseId <= varietyCounter, "Invalid license ID");
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

    registrationNumbers[_registrationNumber] = true; //segna il numero di registrazione come esistente

    emit VarietyRegistered(newVarietyID, _denomination, _registrationNumber, _breeder, block.timestamp);
  }


  /*
  @notice Revoca una varietà (da utlizzare in casi eccezionali es. frode o erore nella registrazione);
  @param _varietyID ID della varietà da revocare;
  @param resason Motivo della revoca;
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


  /*
   @Aggiunge un ispettore autorizzato;
   @param _inspector Indirizzo dell'ispettore da autorizzare;
  */
  function addInspector(address _inspector) external onlyAuthority {
    require(_inspector != address(0), "Inspector address cannot be zero");
    require(!authorizedInspectors[_inspector], "Inspector is already authorized");

    authorizedInspectors[_inspector] = true;

    emit InspectorAdded(_inspector, block.timestamp);
  }

}
