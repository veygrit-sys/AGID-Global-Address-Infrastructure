// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

contract AGIDRevocationFreshnessRegistry is AccessControl, Pausable {
    bytes32 public constant ROOT_ANCHOR_ROLE = keccak256("ROOT_ANCHOR_ROLE");
    bytes32 public constant REGISTRY_ADMIN_ROLE = keccak256("REGISTRY_ADMIN_ROLE");

    struct RootAnchor {
        bytes32 revocationRoot;
        bytes32 freshnessRoot;
        uint64 validUntil;
        uint64 anchoredAt;
    }

    mapping(bytes32 => RootAnchor) private anchors;

    event RevocationFreshnessRootAnchored(
        string indexed registryId,
        string indexed issuerId,
        bytes32 revocationRoot,
        bytes32 freshnessRoot,
        uint64 validUntil
    );

    constructor(address admin) {
        require(admin != address(0), "admin-required");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(REGISTRY_ADMIN_ROLE, admin);
        _grantRole(ROOT_ANCHOR_ROLE, admin);
    }

    function pause() external onlyRole(REGISTRY_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(REGISTRY_ADMIN_ROLE) {
        _unpause();
    }

    function anchorRevocationFreshnessRoot(
        string calldata registryId,
        string calldata issuerId,
        bytes32 revocationRoot,
        bytes32 freshnessRoot,
        uint64 validUntil
    ) external whenNotPaused onlyRole(ROOT_ANCHOR_ROLE) {
        require(bytes(registryId).length > 0, "registry-id-required");
        require(bytes(issuerId).length > 0, "issuer-id-required");
        require(validUntil > block.timestamp, "valid-until-in-past");

        anchors[_anchorKey(registryId, issuerId)] = RootAnchor({
            revocationRoot: revocationRoot,
            freshnessRoot: freshnessRoot,
            validUntil: validUntil,
            anchoredAt: uint64(block.timestamp)
        });

        emit RevocationFreshnessRootAnchored(registryId, issuerId, revocationRoot, freshnessRoot, validUntil);
    }

    function getAnchor(string calldata registryId, string calldata issuerId) external view returns (RootAnchor memory) {
        return anchors[_anchorKey(registryId, issuerId)];
    }

    function _anchorKey(string calldata registryId, string calldata issuerId) private pure returns (bytes32) {
        return keccak256(abi.encodePacked(registryId, "\x1f", issuerId));
    }
}
