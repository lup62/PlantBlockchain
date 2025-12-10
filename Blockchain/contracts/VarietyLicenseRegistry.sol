// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

import "./structs/StruttureDati.sol";

contract VafietyLicenseRegistry {
  address private authority; //indirizzo dell'Authority (per convenzione sarà colui che deploya il contratto)
  uint256 private varietyCounter; //contatore delle varietà registrate
  uint256 private batchCounter;  //contatore dei batch registrati

  //mappatura
  mapping (uint256 => Variety) private varieties; //mappatura delle varietà registrate
  mapping (uint256 => Batch) private batches; //mappatura dei batch registrati
  mapping (uint256 => License) private licenses; //mappatura delle licenze emesse
  mapping (uint256 => uint256[]) private varietyToLicenses; //mappatura delle licenze per ogni varietà
  mapping (address => bool) private authorizedInspectors; //mappatura degli ispettori autorizzati

  //modificatori
  modifier onlyAuthority() {
    require(msg.sender == authority, "Only authority can call this function");
    _;
  }

  modifier onlyInspector() {
    require(authorizedInspectors[msg.sender], "Only authorized inspectors can call this function");
    _;
  }

  modifier onlyBreederOf(uint256 _varietyId) {
    require(msg.sender != authority, "Authority cannot be a breeder");
    require(varieties[_varietyId].breeder == msg.sender, "Only breeder of this variety can call this function");
    _;
  }

  modifier onlyLicenseeOf(uint256 _licenseId) {
    require(msg.sender != authority, "Authority cannot be a licensee");
    require(licenses[_licenseId].licensee == msg.sender, "Only licensee of this license can call this function");
    _;
  }

  modifier varietyExists(uint256 _varietyID) {
    require(_varietyID > 0 && _varietyID <= batchCounter, "Invalid batch ID");
    _;
  }

  modifier batchExists(uint256 _batchId) {
    require(_batchId > 0 && _batchId <= batchCounter, "Invalid batch ID");
    _;
}




  //costruttore
  constructor() {
    authority = msg.sender; //l'authority è colui che deploya il contratto
    varietyCounter = 0;
    batchCounter = 0;
  }

  //funzioni per Authority
  function getAuthority() public view returns (address) {
    return authority;
  }

  function getVarietyCounter() public view returns (uint256) {
    return varietyCounter;
  }

  function getBatchCounter() public view returns (uint256) {
    return batchCounter;
  }

  function getVariety(uint256 _varietyId) public view returns (Variety memory) {
    return varieties[_varietyId];
  }

  function getBatch(uint256 _batchId) public view returns (Batch memory) {
    return batches[_batchId];
  }

  function getLicense(uint256 _licenseId) public view returns (License memory) {
    return licenses[_licenseId];
  }
}
