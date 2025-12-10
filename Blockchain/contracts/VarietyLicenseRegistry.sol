// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

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


  //costruttore
  constructor() {
    authority = msg.sender; //l'authority è colui che deploya il contratto
    varietyCounter = 0;
    batchCounter = 0;
  }

  //getter e setter
  function getAuthority() public view returns (address) {
    return authority;
  }

  function getVarietyCounter() public view returns (uint256) {
    return varietyCounter;
  }

  function getBatchCounter() public view returns (uint256) {
    return batchCounter;
  }

  


}
