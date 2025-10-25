const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ElectronicHealthRecords", function () {
  let ehrContract;
  let owner;
  let doctor1;
  let doctor2;
  let patient;
  let unauthorized;

  const SAMPLE_IPFS_HASH = "QmT5NvUtoM5nWFfrQdVrFtvGfKFmG7AHE8P34isapyhCxX";
  const SECOND_IPFS_HASH = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";

  beforeEach(async function () {
    // Get signers
    [owner, doctor1, doctor2, patient, unauthorized] = await ethers.getSigners();

    // Deploy contract
    const EHRFactory = await ethers.getContractFactory("ElectronicHealthRecords");
    ehrContract = await EHRFactory.deploy();
    await ehrContract.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      expect(await ehrContract.getAddress()).to.be.properAddress;
    });

    it("Should start with zero records", async function () {
      expect(await ehrContract.getRecordCount()).to.equal(0);
    });
  });

  describe("Adding Records", function () {
    it("Should add a record with permitted addresses", async function () {
      const permittedAddresses = [doctor1.address, doctor2.address];
      
      await ehrContract.connect(patient).addRecord(SAMPLE_IPFS_HASH, permittedAddresses);
      
      expect(await ehrContract.getRecordCount()).to.equal(1);
    });

    it("Should add a record with empty permitted list", async function () {
      await ehrContract.connect(patient).addRecord(SAMPLE_IPFS_HASH, []);
      
      expect(await ehrContract.getRecordCount()).to.equal(1);
    });

    it("Should emit RecordAdded event with correct parameters", async function () {
      const permittedAddresses = [doctor1.address];
      
      await expect(ehrContract.connect(patient).addRecord(SAMPLE_IPFS_HASH, permittedAddresses))
        .to.emit(ehrContract, "RecordAdded")
        .withArgs(
          1,
          SAMPLE_IPFS_HASH,
          patient.address,
          permittedAddresses,
          (timestamp) => timestamp > 0
        );
    });

    it("Should increment record count correctly", async function () {
      await ehrContract.connect(patient).addRecord(SAMPLE_IPFS_HASH, [doctor1.address]);
      expect(await ehrContract.getRecordCount()).to.equal(1);

      await ehrContract.connect(doctor1).addRecord(SECOND_IPFS_HASH, [doctor2.address]);
      expect(await ehrContract.getRecordCount()).to.equal(2);

      await ehrContract.connect(patient).addRecord(SAMPLE_IPFS_HASH, []);
      expect(await ehrContract.getRecordCount()).to.equal(3);
    });

    it("Should store uploader address correctly", async function () {
      await ehrContract.connect(patient).addRecord(SAMPLE_IPFS_HASH, [doctor1.address]);
      
      const [, uploader] = await ehrContract.getRecord(1);
      expect(uploader).to.equal(patient.address);
    });

    it("Should store timestamp correctly", async function () {
      const tx = await ehrContract.connect(patient).addRecord(SAMPLE_IPFS_HASH, []);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      const [, , , timestamp] = await ehrContract.getRecord(1);
      expect(timestamp).to.equal(block.timestamp);
    });
  });

  describe("Retrieving Records", function () {
    beforeEach(async function () {
      await ehrContract.connect(patient).addRecord(
        SAMPLE_IPFS_HASH,
        [doctor1.address, doctor2.address]
      );
    });

    it("Should retrieve record with correct IPFS hash", async function () {
      const [ipfsHash] = await ehrContract.getRecord(1);
      expect(ipfsHash).to.equal(SAMPLE_IPFS_HASH);
    });

    it("Should retrieve record with correct uploader", async function () {
      const [, uploader] = await ehrContract.getRecord(1);
      expect(uploader).to.equal(patient.address);
    });

    it("Should retrieve record with correct permitted addresses", async function () {
      const [, , permitted] = await ehrContract.getRecord(1);
      expect(permitted).to.deep.equal([doctor1.address, doctor2.address]);
    });

    it("Should retrieve all record fields correctly", async function () {
      const [ipfsHash, uploader, permitted, timestamp] = await ehrContract.getRecord(1);
      
      expect(ipfsHash).to.equal(SAMPLE_IPFS_HASH);
      expect(uploader).to.equal(patient.address);
      expect(permitted).to.deep.equal([doctor1.address, doctor2.address]);
      expect(timestamp).to.be.gt(0);
    });

    it("Should retrieve multiple different records", async function () {
      await ehrContract.connect(doctor1).addRecord(SECOND_IPFS_HASH, [patient.address]);

      const [ipfsHash1, uploader1] = await ehrContract.getRecord(1);
      const [ipfsHash2, uploader2] = await ehrContract.getRecord(2);

      expect(ipfsHash1).to.equal(SAMPLE_IPFS_HASH);
      expect(uploader1).to.equal(patient.address);
      expect(ipfsHash2).to.equal(SECOND_IPFS_HASH);
      expect(uploader2).to.equal(doctor1.address);
    });

    it("Should return empty data for non-existent record", async function () {
      const [ipfsHash, uploader, permitted, timestamp] = await ehrContract.getRecord(999);
      
      expect(ipfsHash).to.equal("");
      expect(uploader).to.equal(ethers.ZeroAddress);
      expect(permitted).to.deep.equal([]);
      expect(timestamp).to.equal(0);
    });
  });

  describe("Permission Checking", function () {
    beforeEach(async function () {
      await ehrContract.connect(patient).addRecord(
        SAMPLE_IPFS_HASH,
        [doctor1.address, doctor2.address]
      );
    });

    it("Should return true for uploader", async function () {
      expect(await ehrContract.isPermitted(1, patient.address)).to.be.true;
    });

    it("Should return true for permitted addresses", async function () {
      expect(await ehrContract.isPermitted(1, doctor1.address)).to.be.true;
      expect(await ehrContract.isPermitted(1, doctor2.address)).to.be.true;
    });

    it("Should return false for non-permitted addresses", async function () {
      expect(await ehrContract.isPermitted(1, unauthorized.address)).to.be.false;
    });

    it("Should return false for non-existent record", async function () {
      expect(await ehrContract.isPermitted(999, patient.address)).to.be.false;
    });

    it("Should work with empty permitted list", async function () {
      await ehrContract.connect(owner).addRecord(SECOND_IPFS_HASH, []);
      
      expect(await ehrContract.isPermitted(2, owner.address)).to.be.true;
      expect(await ehrContract.isPermitted(2, doctor1.address)).to.be.false;
    });

    it("Should handle large permitted lists", async function () {
      const signers = await ethers.getSigners();
      const largePermittedList = signers.slice(0, 10).map(s => s.address);
      
      await ehrContract.connect(patient).addRecord(SECOND_IPFS_HASH, largePermittedList);
      
      // Check first and last in list
      expect(await ehrContract.isPermitted(2, largePermittedList[0])).to.be.true;
      expect(await ehrContract.isPermitted(2, largePermittedList[9])).to.be.true;
      
      // Check someone not in list
      expect(await ehrContract.isPermitted(2, largePermittedList[10])).to.be.false;
    });
  });

  describe("Multiple Records Scenarios", function () {
    it("Should handle multiple records from same uploader", async function () {
      await ehrContract.connect(patient).addRecord(SAMPLE_IPFS_HASH, [doctor1.address]);
      await ehrContract.connect(patient).addRecord(SECOND_IPFS_HASH, [doctor2.address]);

      expect(await ehrContract.getRecordCount()).to.equal(2);
      expect(await ehrContract.isPermitted(1, doctor1.address)).to.be.true;
      expect(await ehrContract.isPermitted(2, doctor2.address)).to.be.true;
      expect(await ehrContract.isPermitted(1, doctor2.address)).to.be.false;
    });

    it("Should handle records from different uploaders", async function () {
      await ehrContract.connect(patient).addRecord(SAMPLE_IPFS_HASH, [doctor1.address]);
      await ehrContract.connect(doctor1).addRecord(SECOND_IPFS_HASH, [patient.address]);

      const [, uploader1] = await ehrContract.getRecord(1);
      const [, uploader2] = await ehrContract.getRecord(2);

      expect(uploader1).to.equal(patient.address);
      expect(uploader2).to.equal(doctor1.address);
    });

    it("Should maintain separate permission lists", async function () {
      await ehrContract.connect(patient).addRecord(SAMPLE_IPFS_HASH, [doctor1.address]);
      await ehrContract.connect(patient).addRecord(SECOND_IPFS_HASH, [doctor2.address]);

      expect(await ehrContract.isPermitted(1, doctor1.address)).to.be.true;
      expect(await ehrContract.isPermitted(1, doctor2.address)).to.be.false;
      expect(await ehrContract.isPermitted(2, doctor1.address)).to.be.false;
      expect(await ehrContract.isPermitted(2, doctor2.address)).to.be.true;
    });
  });

  describe("Edge Cases", function () {
    it("Should handle empty IPFS hash", async function () {
      await ehrContract.connect(patient).addRecord("", [doctor1.address]);
      
      const [ipfsHash] = await ehrContract.getRecord(1);
      expect(ipfsHash).to.equal("");
    });

    it("Should handle very long IPFS hash", async function () {
      const longHash = "Q".repeat(100);
      await ehrContract.connect(patient).addRecord(longHash, []);
      
      const [ipfsHash] = await ehrContract.getRecord(1);
      expect(ipfsHash).to.equal(longHash);
    });

    it("Should handle same address in permitted list multiple times", async function () {
      await ehrContract.connect(patient).addRecord(
        SAMPLE_IPFS_HASH,
        [doctor1.address, doctor1.address, doctor1.address]
      );
      
      expect(await ehrContract.isPermitted(1, doctor1.address)).to.be.true;
    });

    it("Should handle uploader in permitted list", async function () {
      await ehrContract.connect(patient).addRecord(
        SAMPLE_IPFS_HASH,
        [patient.address, doctor1.address]
      );
      
      expect(await ehrContract.isPermitted(1, patient.address)).to.be.true;
    });
  });

  describe("Gas Optimization Checks", function () {
    it("Should not consume excessive gas for adding records", async function () {
      const tx = await ehrContract.connect(patient).addRecord(
        SAMPLE_IPFS_HASH,
        [doctor1.address, doctor2.address]
      );
      const receipt = await tx.wait();
      
      // This is a rough check - adjust based on your requirements
      expect(receipt.gasUsed).to.be.lt(200000);
    });

    it("Should handle retrieval efficiently", async function () {
      await ehrContract.connect(patient).addRecord(SAMPLE_IPFS_HASH, [doctor1.address]);
      
      // View functions don't consume gas when called off-chain
      const [ipfsHash] = await ehrContract.getRecord(1);
      expect(ipfsHash).to.equal(SAMPLE_IPFS_HASH);
    });
  });
});