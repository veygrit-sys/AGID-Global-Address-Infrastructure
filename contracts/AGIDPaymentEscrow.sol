// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract AGIDPaymentEscrow is AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant PAYMENT_RECORDER_ROLE = keccak256("PAYMENT_RECORDER_ROLE");
    bytes32 public constant REGISTRY_ADMIN_ROLE = keccak256("REGISTRY_ADMIN_ROLE");

    enum PaymentStatus {
        Unknown,
        Authorized,
        Escrowed,
        Released,
        Refunded,
        Cancelled
    }

    struct PaymentRecord {
        string escrowId;
        bytes32 payerCommitment;
        bytes32 payeeCommitment;
        bytes32 purposeHash;
        address tokenContract;
        string tokenSymbol;
        uint256 amount;
        PaymentStatus paymentStatus;
        uint64 updatedAt;
    }

    mapping(bytes32 => PaymentRecord) private payments;

    event PaymentRecorded(string indexed paymentId, string indexed escrowId, uint8 paymentStatus);

    constructor(address admin) {
        require(admin != address(0), "admin-required");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(REGISTRY_ADMIN_ROLE, admin);
        _grantRole(PAYMENT_RECORDER_ROLE, admin);
    }

    function pause() external onlyRole(REGISTRY_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(REGISTRY_ADMIN_ROLE) {
        _unpause();
    }

    function recordPayment(
        string calldata paymentId,
        string calldata escrowId,
        bytes32 payerCommitment,
        bytes32 payeeCommitment,
        bytes32 purposeHash,
        address tokenContract,
        string calldata tokenSymbol,
        uint256 amount,
        uint8 paymentStatus
    ) external whenNotPaused nonReentrant onlyRole(PAYMENT_RECORDER_ROLE) {
        require(bytes(paymentId).length > 0, "payment-id-required");
        require(bytes(escrowId).length > 0, "escrow-id-required");
        require(paymentStatus > uint8(PaymentStatus.Unknown) && paymentStatus <= uint8(PaymentStatus.Cancelled), "invalid-status");

        payments[_paymentKey(paymentId)] = PaymentRecord({
            escrowId: escrowId,
            payerCommitment: payerCommitment,
            payeeCommitment: payeeCommitment,
            purposeHash: purposeHash,
            tokenContract: tokenContract,
            tokenSymbol: tokenSymbol,
            amount: amount,
            paymentStatus: PaymentStatus(paymentStatus),
            updatedAt: uint64(block.timestamp)
        });

        emit PaymentRecorded(paymentId, escrowId, paymentStatus);
    }

    function getPayment(string calldata paymentId) external view returns (PaymentRecord memory) {
        return payments[_paymentKey(paymentId)];
    }

    function _paymentKey(string calldata paymentId) private pure returns (bytes32) {
        return keccak256(bytes(paymentId));
    }
}
