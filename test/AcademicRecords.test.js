// Purpose: A Mocha/Chai test file that includes unit and integration tests for your smart contracts.
// Contents: Test cases for credential issuance, verification, access control, and edge cases to ensure the contract behaves as expected.

const { expect } = require("chai");
const { ethers } = require("hardhat");
// Import the required functions directly from ethers
const { keccak256, toUtf8Bytes } = require("ethers");

describe("AcademicRecords", function () {
  let AcademicRecords;
  let contract;
  let admin, admin2, student;
  const sampleData = "sample record";

  beforeEach(async function () {
    [admin, admin2, student] = await ethers.getSigners();
    const ContractFactory = await ethers.getContractFactory("AcademicRecords");
    contract = await ContractFactory.deploy();
    await contract.waitForDeployment();
  });

  it("should deploy and set deployer as admin", async function () {
    expect(await contract.hasRole(await contract.ADMIN_ROLE(), admin.address)).to.be.true;
  });

  it("should allow admin to issue a credential", async function () {
    const recordHash = keccak256(toUtf8Bytes(sampleData));
    const ipfsHash = "QmTestIpfsHash";
    const tx = await contract.issueCredential(student.address, recordHash, ipfsHash);
    await expect(tx)
      .to.emit(contract, "CredentialIssued")
      .withArgs(student.address, 0, admin.address, recordHash, ipfsHash, anyValue);
  });

  it("should revoke a credential", async function () {
    const recordHash = keccak256(toUtf8Bytes(sampleData));
    const ipfsHash = "QmTestIpfsHash";
    await contract.issueCredential(student.address, recordHash, ipfsHash);
    const tx = await contract.revokeCredential(student.address, 0);
    await expect(tx)
      .to.emit(contract, "CredentialRevoked")
      .withArgs(student.address, 0, admin.address, anyValue);
  });

  it("should verify a valid credential", async function () {
    const recordHash = keccak256(toUtf8Bytes(sampleData));
    const ipfsHash = "QmTestIpfsHash";
    await contract.issueCredential(student.address, recordHash, ipfsHash);
    expect(await contract.verifyCredential(student.address, 0, recordHash)).to.be.true;
  });

  it("should not verify a revoked credential", async function () {
    const recordHash = keccak256(toUtf8Bytes(sampleData));
    const ipfsHash = "QmTestIpfsHash";
    await contract.issueCredential(student.address, recordHash, ipfsHash);
    await contract.revokeCredential(student.address, 0);
    expect(await contract.verifyCredential(student.address, 0, recordHash)).to.be.false;
  });
});

// Helper to handle dynamic timestamp values in events.
const anyValue = () => true; // placeholder matcher for timestamp