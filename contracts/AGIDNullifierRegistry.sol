// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

contract AGIDNullifierRegistry is AccessControl, Pausable {
    bytes32 public constant NULLIFIER_WRITER_ROLE = keccak256("NULLIFIER_WRITER_ROLE");
    bytes32 public constant REGISTRY_ADMIN_ROLE = keccak256("REGISTRY_ADMIN_ROLE");

    mapping(bytes32 => bool) private usedNullifiers;

    event NullifierUsed(bytes32 indexed registryKeyHash, string indexed scope);

    constructor(address admin) {
        require(admin != address(0), "admin-required");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(REGISTRY_ADMIN_ROLE, admin);
        _grantRole(NULLIFIER_WRITER_ROLE, admin);
    }

    function pause() external onlyRole(REGISTRY_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(REGISTRY_ADMIN_ROLE) {
        _unpause();
    }

    function markNullifierUsed(bytes32 nullifierHash, string calldata scope, bytes32 registryKeyHash)
        external
        whenNotPaused
        onlyRole(NULLIFIER_WRITER_ROLE)
    {
        require(nullifierHash != bytes32(0), "nullifier-required");
        require(bytes(scope).length > 0, "scope-required");
        require(registryKeyHash != bytes32(0), "registry-key-required");

        bytes32 key = _nullifierKey(nullifierHash, scope, registryKeyHash);
        require(!usedNullifiers[key], "nullifier-already-used");
        usedNullifiers[key] = true;

        emit NullifierUsed(registryKeyHash, scope);
    }

    function isNullifierUsed(bytes32 nullifierHash, string calldata scope, bytes32 registryKeyHash)
        external
        view
        returns (bool)
    {
        return usedNullifiers[_nullifierKey(nullifierHash, scope, registryKeyHash)];
    }

    function _nullifierKey(bytes32 nullifierHash, string calldata scope, bytes32 registryKeyHash)
        private
        pure
        returns (bytes32)
    {
        return keccak256(abi.encode(registryKeyHash, scope, nullifierHash));
    }
}
