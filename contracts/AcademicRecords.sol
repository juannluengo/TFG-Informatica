// smart contract(s) that handle the issuance, verification, and management of academic credentials.

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title AcademicRecords
 * @dev Smart contract for issuing, verifying, and managing academic credentials.
 *      Uses a hybrid on-chain/off-chain storage model where only essential metadata
 *      and cryptographic hashes are stored on-chain.
 */
contract AcademicRecords is AccessControl {
    // Role definition for administrators (university staff)
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // Structure to store academic credential details.
    struct Credential {
        bytes32 recordHash;    // Cryptographic hash of the academic record.
        string ipfsHash;       // Pointer to the full academic record stored off-chain (e.g., IPFS CID).
        uint256 timestamp;     // Timestamp when the credential was issued.
        address issuer;        // Address of the administrator issuing the credential.
        bool valid;            // Validity flag: true if active, false if revoked.
    }

    // Mapping from student address to their list of credentials.
    mapping(address => Credential[]) private credentials;

    // Events to log credential issuance and revocation.
    event CredentialIssued(
        address indexed student,
        uint256 indexed index,
        address indexed issuer,
        bytes32 recordHash,
        string ipfsHash,
        uint256 timestamp
    );
    event CredentialRevoked(
        address indexed student,
        uint256 indexed index,
        address indexed revoker,
        uint256 timestamp
    );

    // New event to track updates to credentials.
    event CredentialUpdated(
        address indexed student,
        uint256 indexed index,
        address indexed updater,
        bytes32 newRecordHash,
        string newIpfsHash,
        uint256 timestamp
    );

    /**
     * @dev Constructor.
     *      Sets the deployer as the default admin and grants them the ADMIN_ROLE.
     */
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Adds a new administrator.
     * @param newAdmin The address to be granted admin rights.
     * Requirements:
     * - Only accounts with the DEFAULT_ADMIN_ROLE can add new admins.
     * - `newAdmin` cannot be the zero address.
     */
    function addAdmin(address newAdmin) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newAdmin != address(0), "Invalid address");
        _grantRole(ADMIN_ROLE, newAdmin);
    }

    /**
     * @dev Issues a new academic credential to a student.
     * @param student The address of the student.
     * @param recordHash The cryptographic hash of the academic record.
     * @param ipfsHash The IPFS pointer (or similar) to the full academic record.
     * @return index The index of the newly added credential in the student’s credential array.
     * Requirements:
     * - Caller must have ADMIN_ROLE.
     * - `student` must not be the zero address.
     */
    function issueCredential(
        address student,
        bytes32 recordHash,
        string memory ipfsHash
    ) external onlyRole(ADMIN_ROLE) returns (uint256) {
        require(student != address(0), "Invalid student address");

        Credential memory cred = Credential({
            recordHash: recordHash,
            ipfsHash: ipfsHash,
            timestamp: block.timestamp,
            issuer: msg.sender,
            valid: true
        });

        credentials[student].push(cred);
        uint256 index = credentials[student].length - 1;
        emit CredentialIssued(student, index, msg.sender, recordHash, ipfsHash, block.timestamp);
        return index;
    }

    /**
     * @dev Revokes an academic credential.
     * @param student The address of the student.
     * @param index The index of the credential to revoke.
     * Requirements:
     * - Caller must have ADMIN_ROLE.
     * - The credential at the provided index must exist and be currently valid.
     */
    function revokeCredential(address student, uint256 index) external onlyRole(ADMIN_ROLE) {
        require(index < credentials[student].length, "Invalid credential index");
        Credential storage cred = credentials[student][index];
        require(cred.valid, "Credential already revoked");

        cred.valid = false;
        emit CredentialRevoked(student, index, msg.sender, block.timestamp);
    }

    /**
     * @dev Updates an existing academic credential.
     * @param student The address of the student.
     * @param index The index of the credential to update.
     * @param newRecordHash The new cryptographic hash of the updated academic record.
     * @param newIpfsHash The new IPFS pointer for the updated academic record.
     * Requirements:
     * - Caller must have ADMIN_ROLE.
     * - The credential must exist and be valid.
     */
    function updateCredential(
        address student,
        uint256 index,
        bytes32 newRecordHash,
        string memory newIpfsHash
    ) external onlyRole(ADMIN_ROLE) {
        require(index < credentials[student].length, "Invalid credential index");
        Credential storage cred = credentials[student][index];
        require(cred.valid, "Credential revoked, cannot update");

        cred.recordHash = newRecordHash;
        cred.ipfsHash = newIpfsHash;
        cred.timestamp = block.timestamp; // update timestamp to record update time

        emit CredentialUpdated(student, index, msg.sender, newRecordHash, newIpfsHash, block.timestamp);
    }

    /**
     * @dev Verifies if a given credential is valid and matches the provided hash.
     * @param student The address of the student.
     * @param index The index of the credential.
     * @param recordHash The hash to compare with the stored credential hash.
     * @return True if the credential exists, is valid, and the hash matches; otherwise false.
     */
    function verifyCredential(
        address student,
        uint256 index,
        bytes32 recordHash
    ) external view returns (bool) {
        require(index < credentials[student].length, "Invalid credential index");
        Credential memory cred = credentials[student][index];
        return (cred.valid && cred.recordHash == recordHash);
    }

    /**
     * @dev Returns the number of credentials associated with a student.
     * @param student The address of the student.
     * @return The count of credentials.
     */
    function getCredentialCount(address student) external view returns (uint256) {
        return credentials[student].length;
    }

    /**
     * @dev Retrieves details of a specific credential.
     * @param student The address of the student.
     * @param index The index of the credential.
     * @return The Credential struct.
     */
    function getCredential(address student, uint256 index) external view returns (Credential memory) {
        require(index < credentials[student].length, "Invalid credential index");
        return credentials[student][index];
    }
}
