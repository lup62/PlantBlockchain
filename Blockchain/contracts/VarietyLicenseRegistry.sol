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


  //CONSTRUCTOR
  constructor() {
    authority = msg.sender; //l'authority è colui che deploya il contratto
    varietyCounter = 0;
    batchCounter = 0;
    licenseCounter = 0;
  }


  //Funzioni 

  

}
