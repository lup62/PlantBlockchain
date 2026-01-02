export const CONTRACT_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "oldAuthority",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newAuthority",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "changeDate",
        "type": "uint256"
      }
    ],
    "name": "AuthorityChanged",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "batchID",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "varietyID",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "licensee",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "productionDate",
        "type": "uint256"
      }
    ],
    "name": "BatchCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "batchID",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "enum InspectionStatus",
        "name": "inspectionStatus",
        "type": "uint8"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "inspector",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "inspectionDate",
        "type": "uint256"
      }
    ],
    "name": "BatchInspected",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "inspector",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "addedDate",
        "type": "uint256"
      }
    ],
    "name": "InspectorAdded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "inspector",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "removedDate",
        "type": "uint256"
      }
    ],
    "name": "InspectorRemoved",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "licenseID",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "oldExpirationDate",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "newExpirationDate",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "updateDate",
        "type": "uint256"
      }
    ],
    "name": "LicenseExpirationUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "licenseID",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "varietyID",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "licensee",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "issueDate",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "expiryDate",
        "type": "uint256"
      }
    ],
    "name": "LicenseIssued",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "licenseID",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "reason",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "revocationDate",
        "type": "uint256"
      }
    ],
    "name": "LicenseRevoked",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "varietyID",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "denomination",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "registrationNumber",
        "type": "string"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "breeder",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "registrationDate",
        "type": "uint256"
      }
    ],
    "name": "VarietyRegistered",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "varietyID",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "reason",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "revocationDate",
        "type": "uint256"
      }
    ],
    "name": "VarietyRevoked",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "acceptAuthority",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_inspector",
        "type": "address"
      }
    ],
    "name": "addInspector",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_newAuthority",
        "type": "address"
      }
    ],
    "name": "beginAuthorityTransfer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_licenseID",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "_quantity",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_metadata",
        "type": "string"
      }
    ],
    "name": "createBatch",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAuthority",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_batchID",
        "type": "uint256"
      }
    ],
    "name": "getBatch",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "batchID",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "varietyID",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "licenseID",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "productionDate",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "quantity",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "metadata",
            "type": "string"
          },
          {
            "internalType": "enum BatchStatus",
            "name": "status",
            "type": "uint8"
          },
          {
            "internalType": "enum InspectionStatus",
            "name": "inspectionStatus",
            "type": "uint8"
          },
          {
            "internalType": "address",
            "name": "inspector",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "inspectionDate",
            "type": "uint256"
          }
        ],
        "internalType": "struct Batch",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getCounters",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "varietiesCounter",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "batchesCounter",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "licensesCounter",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_licenseID",
        "type": "uint256"
      }
    ],
    "name": "getLicense",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "licenseID",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "varietyID",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "licensee",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "issueDate",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "expiryDate",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "revocationDate",
            "type": "uint256"
          },
          {
            "internalType": "enum LicenseStatus",
            "name": "status",
            "type": "uint8"
          },
          {
            "internalType": "string",
            "name": "revocationReason",
            "type": "string"
          }
        ],
        "internalType": "struct License",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getLicensesByLicensee",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "licenseID",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "varietyID",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "licensee",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "issueDate",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "expiryDate",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "revocationDate",
            "type": "uint256"
          },
          {
            "internalType": "enum LicenseStatus",
            "name": "status",
            "type": "uint8"
          },
          {
            "internalType": "string",
            "name": "revocationReason",
            "type": "string"
          }
        ],
        "internalType": "struct License[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_varietyID",
        "type": "uint256"
      }
    ],
    "name": "getLicensesByVariety",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "licenseID",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "varietyID",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "licensee",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "issueDate",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "expiryDate",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "revocationDate",
            "type": "uint256"
          },
          {
            "internalType": "enum LicenseStatus",
            "name": "status",
            "type": "uint8"
          },
          {
            "internalType": "string",
            "name": "revocationReason",
            "type": "string"
          }
        ],
        "internalType": "struct License[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getPendingAuthority",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getPendingBatches",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "batchID",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "varietyID",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "licenseID",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "productionDate",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "quantity",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "metadata",
            "type": "string"
          },
          {
            "internalType": "enum BatchStatus",
            "name": "status",
            "type": "uint8"
          },
          {
            "internalType": "enum InspectionStatus",
            "name": "inspectionStatus",
            "type": "uint8"
          },
          {
            "internalType": "address",
            "name": "inspector",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "inspectionDate",
            "type": "uint256"
          }
        ],
        "internalType": "struct Batch[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_varietyID",
        "type": "uint256"
      }
    ],
    "name": "getVariety",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "varietyID",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "denomination",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "registrationNumber",
            "type": "string"
          },
          {
            "internalType": "address",
            "name": "breeder",
            "type": "address"
          },
          {
            "internalType": "string",
            "name": "documentHash",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "documentURI",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "registrationDate",
            "type": "uint256"
          },
          {
            "internalType": "enum VarietyStatus",
            "name": "status",
            "type": "uint8"
          }
        ],
        "internalType": "struct Variety",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_batchID",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "_approve",
        "type": "bool"
      }
    ],
    "name": "inspectBatch",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_inspector",
        "type": "address"
      }
    ],
    "name": "isInspectorAuthorized",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_varietyID",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "_licensee",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_expirationDate",
        "type": "uint256"
      }
    ],
    "name": "issueLicense",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_licenseID",
        "type": "uint256"
      }
    ],
    "name": "makeLicensePermanent",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_denomination",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_registrationNumber",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "_breeder",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "_documentHash",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_documentURI",
        "type": "string"
      }
    ],
    "name": "registerVariety",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_inspector",
        "type": "address"
      }
    ],
    "name": "removeInspector",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_licenseID",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "_reason",
        "type": "string"
      }
    ],
    "name": "revokeLicense",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_licenseID",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "_reason",
        "type": "string"
      }
    ],
    "name": "revokeLicenseByAuthority",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_varietyID",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "_reason",
        "type": "string"
      }
    ],
    "name": "revokeVariety",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_licenseID",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_newExpirationDate",
        "type": "uint256"
      }
    ],
    "name": "updateLicenseExpiration",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_batchID",
        "type": "uint256"
      }
    ],
    "name": "verifyBatch",
    "outputs": [
      {
        "components": [
          {
            "internalType": "bool",
            "name": "isValid",
            "type": "bool"
          },
          {
            "internalType": "string",
            "name": "message",
            "type": "string"
          },
          {
            "components": [
              {
                "internalType": "uint256",
                "name": "varietyID",
                "type": "uint256"
              },
              {
                "internalType": "string",
                "name": "denomination",
                "type": "string"
              },
              {
                "internalType": "string",
                "name": "registrationNumber",
                "type": "string"
              },
              {
                "internalType": "address",
                "name": "breeder",
                "type": "address"
              },
              {
                "internalType": "string",
                "name": "documentHash",
                "type": "string"
              },
              {
                "internalType": "string",
                "name": "documentURI",
                "type": "string"
              },
              {
                "internalType": "uint256",
                "name": "registrationDate",
                "type": "uint256"
              },
              {
                "internalType": "enum VarietyStatus",
                "name": "status",
                "type": "uint8"
              }
            ],
            "internalType": "struct Variety",
            "name": "variety",
            "type": "tuple"
          },
          {
            "components": [
              {
                "internalType": "uint256",
                "name": "licenseID",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "varietyID",
                "type": "uint256"
              },
              {
                "internalType": "address",
                "name": "licensee",
                "type": "address"
              },
              {
                "internalType": "uint256",
                "name": "issueDate",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "expiryDate",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "revocationDate",
                "type": "uint256"
              },
              {
                "internalType": "enum LicenseStatus",
                "name": "status",
                "type": "uint8"
              },
              {
                "internalType": "string",
                "name": "revocationReason",
                "type": "string"
              }
            ],
            "internalType": "struct License",
            "name": "license",
            "type": "tuple"
          },
          {
            "components": [
              {
                "internalType": "uint256",
                "name": "batchID",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "varietyID",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "licenseID",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "productionDate",
                "type": "uint256"
              },
              {
                "internalType": "string",
                "name": "quantity",
                "type": "string"
              },
              {
                "internalType": "string",
                "name": "metadata",
                "type": "string"
              },
              {
                "internalType": "enum BatchStatus",
                "name": "status",
                "type": "uint8"
              },
              {
                "internalType": "enum InspectionStatus",
                "name": "inspectionStatus",
                "type": "uint8"
              },
              {
                "internalType": "address",
                "name": "inspector",
                "type": "address"
              },
              {
                "internalType": "uint256",
                "name": "inspectionDate",
                "type": "uint256"
              }
            ],
            "internalType": "struct Batch",
            "name": "batch",
            "type": "tuple"
          },
          {
            "internalType": "address",
            "name": "breeder",
            "type": "address"
          },
          {
            "internalType": "bool",
            "name": "licenseRevokedAfterProduction",
            "type": "bool"
          },
          {
            "internalType": "enum TrustLevel",
            "name": "trustLevel",
            "type": "uint8"
          }
        ],
        "internalType": "struct VerificationResult",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];