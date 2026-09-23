// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

contract AGIDIssuerRegistry is AccessControl, Pausable {
    bytes32 public constant REGISTRY_ADMIN_ROLE = keccak256("REGISTRY_ADMIN_ROLE");
    bytes32 public constant ISSUER_MANAGER_ROLE = keccak256("ISSUER_MANAGER_ROLE");

    enum IssuerStatus {
        Unknown,
        Active,
        Suspended,
        Revoked
    }

    struct IssuerRecord {
        address issuerAddress;
        IssuerStatus issuerStatus;
        bytes32 issuerPublicKeyCommitment;
        bytes32 metadataHash;
        bytes32 policyHash;
        uint64 updatedAt;
    }

    mapping(bytes32 => IssuerRecord) private issuers;

    event IssuerRegistered(string indexed issuerId, address indexed issuerAddress, uint8 issuerStatus);
    event IssuerStatusChanged(string indexed issuerId, uint8 issuerStatus);

    constructor(address admin) {
        require(admin != address(0), "admin-required");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(REGISTRY_ADMIN_ROLE, admin);
        _grantRole(ISSUER_MANAGER_ROLE, admin);
    }

    function pause() external onlyRole(REGISTRY_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(REGISTRY_ADMIN_ROLE) {
        _unpause();
    }

    function registerIssuer(
        string calldata issuerId,
        address issuerAddress,
        uint8 issuerStatus,
        bytes32 issuerPublicKeyCommitment,
        bytes32 metadataHash,
        bytes32 policyHash
    ) external whenNotPaused onlyRole(ISSUER_MANAGER_ROLE) {
        require(bytes(issuerId).length > 0, "issuer-id-required");
        require(issuerAddress != address(0), "issuer-address-required");
        require(issuerStatus > uint8(IssuerStatus.Unknown) && issuerStatus <= uint8(IssuerStatus.Revoked), "invalid-status");

        issuers[_issuerKey(issuerId)] = IssuerRecord({
            issuerAddress: issuerAddress,
            issuerStatus: IssuerStatus(issuerStatus),
            issuerPublicKeyCommitment: issuerPublicKeyCommitment,
            metadataHash: metadataHash,
            policyHash: policyHash,
            updatedAt: uint64(block.timestamp)
        });

        emit IssuerRegistered(issuerId, issuerAddress, issuerStatus);
    }

    function setIssuerStatus(string calldata issuerId, uint8 issuerStatus)
        external
        whenNotPaused
        onlyRole(ISSUER_MANAGER_ROLE)
    {
        require(issuerStatus > uint8(IssuerStatus.Unknown) && issuerStatus <= uint8(IssuerStatus.Revoked), "invalid-status");
        bytes32 key = _issuerKey(issuerId);
        require(issuers[key].issuerAddress != address(0), "issuer-not-found");
        issuers[key].issuerStatus = IssuerStatus(issuerStatus);
        issuers[key].updatedAt = uint64(block.timestamp);
        emit IssuerStatusChanged(issuerId, issuerStatus);
    }

    function getIssuer(string calldata issuerId) external view returns (IssuerRecord memory) {
        return issuers[_issuerKey(issuerId)];
    }

    function _issuerKey(string calldata issuerId) private pure returns (bytes32) {
        return keccak256(bytes(issuerId));
    }
}
