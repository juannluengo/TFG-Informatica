// This contract lets an administrator issue credentials to a student by saving a hash and metadata
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract AcademicRecords {
    struct Credential {
        bytes32 recordHash;
        uint256 timestamp;
        address issuer;
    }

    // Mapping from student address to a list of credentials
    mapping(address => Credential[]) public credentials;

    // Only allowed addresses (like university administrators) should be able to issue credentials
    mapping(address => bool) public isAdmin;

    // Modifier to restrict access
    modifier onlyAdmin() {
        require(isAdmin[msg.sender], "Not authorized");
        _;
    }

    constructor() {
        // Optionally, assign the deployer as an admin
        isAdmin[msg.sender] = true;
    }

    // Function to add an admin (could later add a more robust role management)
    function addAdmin(address _admin) external onlyAdmin {
        isAdmin[_admin] = true;
    }

    // Function to issue a new credential
    function issueCredential(address student, bytes32 recordHash) external onlyAdmin {
        credentials[student].push(Credential({
            recordHash: recordHash,
            timestamp: block.timestamp,
            issuer: msg.sender
        }));
    }

    // Function to verify a credential by comparing hash values
    function verifyCredential(address student, bytes32 recordHash, uint index) external view returns (bool) {
        require(index < credentials[student].length, "Invalid index");
        return (credentials[student][index].recordHash == recordHash);
    }
}
