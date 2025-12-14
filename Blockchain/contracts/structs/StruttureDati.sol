// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../enums/enum.sol";


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

struct VerificationResult {
    bool isValid;
    string message;
    Variety variety;
    License license;
    Batch batch;
    address breeder;
    bool licenseRevokedAferProduction;
    TrustLevel trustLevel;
}