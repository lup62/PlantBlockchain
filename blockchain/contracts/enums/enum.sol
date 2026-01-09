// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

enum VarietyStatus { ACTIVE, REVOKED }
enum LicenseStatus { ACTIVE, REVOKED }
enum BatchStatus { VALID, INVALIDATED }
enum InspectionStatus { NOT_INSPECTED, APPROVED, REJECTED }
enum TrustLevel { INVALID, LOW, MEDIUM, HIGH }
