const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("VarietyLicenseRegistry High Coverage Test Suite", function () {
    let registry;
    let owner, breeder, licensee, inspector, other;

    const VARIETY_NAME = "Super Tomato v1";
    const REG_NUM = "REG-123456";
    const DOC_HASH = "QmXoypizj2WkeBvYtUAcU34f6/327382743284723";
    const DOC_URI = "https://gateway.pinata.cloud/ipfs/QmXoypizj2WkeBvYtUAcU34f6";
    const abiCoder = ethers.AbiCoder.defaultAbiCoder();
    const mappingSlot = (key, slot) => ethers.keccak256(abiCoder.encode(["uint256", "uint256"], [key, slot]));

    beforeEach(async function () {
        [owner, breeder, licensee, inspector, other] = await ethers.getSigners();
        const RegistryFactory = await ethers.getContractFactory("VarietyLicenseRegistry");
        registry = await RegistryFactory.deploy();
    });

    const anyValue = () => true;

    describe("1. Administrative & Roles", function () {
        it("Should identify the authority", async function () {
            expect(await registry.getAuthority()).to.equal(owner.address);
        });

        it("Should handle inspector lifecycle", async function () {
            await registry.addInspector(inspector.address);
            expect(await registry.isInspectorAuthorized(inspector.address)).to.be.true;

            await registry.removeInspector(inspector.address);
            expect(await registry.isInspectorAuthorized(inspector.address)).to.be.false;
        });

        it("Should handle authority transfer", async function () {
            await registry.beginAuthorityTransfer(other.address);
            expect(await registry.getPendingAuthority()).to.equal(other.address);
            await registry.connect(other).acceptAuthority();
            expect(await registry.getAuthority()).to.equal(other.address);
        });

        it("Should revert non-authority administrative calls", async function () {
            await expect(registry.connect(breeder).addInspector(inspector.address)).to.be.revertedWith("Only authority can call this function");
            await expect(registry.connect(breeder).beginAuthorityTransfer(other.address)).to.be.revertedWith("Only authority can call this function");
        });

        it("Should revert on invalid authority operations", async function () {
            await expect(registry.addInspector(ethers.ZeroAddress)).to.be.revertedWith("Inspector address cannot be zero");
            await registry.addInspector(inspector.address);
            await expect(registry.addInspector(inspector.address)).to.be.revertedWith("Inspector is already authorized");
            await expect(registry.removeInspector(other.address)).to.be.revertedWith("Inspector not present in the list of authorized inspectors");
        });
    });

    describe("2. Variety Management", function () {
        it("Should register a variety", async function () {
            await expect(registry.registerVariety(VARIETY_NAME, REG_NUM, breeder.address, DOC_HASH, DOC_URI))
                .to.emit(registry, "VarietyRegistered");

            const counts = await registry.getCounters();
            expect(counts.varietiesCounter).to.equal(1);
        });

        it("Should revert on duplicate registration", async function () {
            await registry.registerVariety(VARIETY_NAME, REG_NUM, breeder.address, DOC_HASH, DOC_URI);
            await expect(registry.registerVariety("V2", REG_NUM, other.address, "h", "u"))
                .to.be.revertedWith("Registration number already exists");
        });

        it("Should revoke a variety", async function () {
            await registry.registerVariety(VARIETY_NAME, REG_NUM, breeder.address, DOC_HASH, DOC_URI);
            await registry.revokeVariety(1, "Fraud");
            const v = await registry.getVariety(1);
            expect(v.status).to.equal(1); // REVOKED
        });

        it("Should revert if variety is already revoked", async function () {
            await registry.registerVariety(VARIETY_NAME, REG_NUM, breeder.address, DOC_HASH, DOC_URI);
            await registry.revokeVariety(1, "R");
            await expect(registry.revokeVariety(1, "R2")).to.be.revertedWith("Variety is already revoked");
        });
    });

    describe("3. License System", function () {
        beforeEach(async function () {
            await registry.registerVariety(VARIETY_NAME, REG_NUM, breeder.address, DOC_HASH, DOC_URI);
        });

        it("Should issue temporary and permanent licenses", async function () {
            await registry.connect(breeder).issueLicense(1, licensee.address, (await time.latest()) + 1000);
            await registry.connect(breeder).issueLicense(1, other.address, 0); // Permanent

            const l1 = await registry.getLicense(1);
            const l2 = await registry.getLicense(2);
            expect(l1.expiryDate).to.be.lt(ethers.MaxUint256);
            expect(l2.expiryDate).to.equal(ethers.MaxUint256);
        });

        it("Should update license expiration", async function () {
            await registry.connect(breeder).issueLicense(1, licensee.address, (await time.latest()) + 1000);
            const newExpiry = (await time.latest()) + 5000;
            await registry.connect(breeder).updateLicenseExpiration(1, newExpiry);
            expect((await registry.getLicense(1)).expiryDate).to.equal(newExpiry);

            await registry.connect(breeder).makeLicensePermanent(1);
            expect((await registry.getLicense(1)).expiryDate).to.equal(ethers.MaxUint256);
        });

        it("Should revoke licenses by breeder and authority", async function () {
            await registry.connect(breeder).issueLicense(1, licensee.address, 0);
            await registry.connect(breeder).issueLicense(1, other.address, 0);

            await registry.connect(breeder).revokeLicense(1, "Breach");
            await registry.revokeLicenseByAuthority(2, "Emergency");

            expect((await registry.getLicense(1)).status).to.equal(1);
            expect((await registry.getLicense(2)).status).to.equal(1);
        });

        it("Should get licenses by licensee and variety", async function () {
            await registry.connect(breeder).issueLicense(1, licensee.address, 0);
            const lics = await registry.connect(licensee).getLicensesByLicensee();
            expect(lics.length).to.equal(1);

            const varLics = await registry.connect(breeder).getLicensesByVariety(1);
            expect(varLics.length).to.equal(1);
        });

        it("Should revert on invalid license issuance", async function () {
            await expect(registry.connect(breeder).issueLicense(1, breeder.address, 0)).to.be.revertedWith("Cannot issue license to yourself");
            await expect(registry.connect(breeder).issueLicense(1, ethers.ZeroAddress, 0)).to.be.revertedWith("Licensee address cannot be zero");
        });
    });

    describe("4. Batch Production & Inspection", function () {
        beforeEach(async function () {
            await registry.registerVariety(VARIETY_NAME, REG_NUM, breeder.address, DOC_HASH, DOC_URI);
            await registry.connect(breeder).issueLicense(1, licensee.address, 0);
            await registry.addInspector(inspector.address);
        });

        it("Should create and inspect batches", async function () {
            await registry.connect(licensee).createBatch(1, "10kg", "Metadata");
            const pending = await registry.connect(inspector).getPendingBatches();
            expect(pending.length).to.equal(1);

            await registry.connect(inspector).inspectBatch(1, true);
            const b = await registry.getBatch(1);
            expect(b.inspectionStatus).to.equal(1); // APPROVED
        });

        it("Should handle removal from pending on inspection", async function () {
            await registry.connect(licensee).createBatch(1, "10kg", "B1");
            await registry.connect(licensee).createBatch(1, "20kg", "B2");

            await registry.connect(inspector).inspectBatch(1, true);
            const pending = await registry.connect(inspector).getPendingBatches();
            expect(pending.length).to.equal(1);
            expect(pending[0].batchID).to.equal(2);
        });

        it("Should allow re-inspection", async function () {
            await registry.connect(licensee).createBatch(1, "10kg", "B1");
            await registry.connect(inspector).inspectBatch(1, true);
            await registry.connect(inspector).inspectBatch(1, false); // Change to REJECTED
            const b = await registry.getBatch(1);
            expect(b.inspectionStatus).to.equal(2); // REJECTED
        });
    });

    describe("5. VerifyBatch & Trust Levels", function () {
        beforeEach(async function () {
            await registry.registerVariety(VARIETY_NAME, REG_NUM, breeder.address, DOC_HASH, DOC_URI);
            await registry.connect(breeder).issueLicense(1, licensee.address, 0);
            await registry.addInspector(inspector.address);
        });

        it("HIGH TRUST: Valid and Approved", async function () {
            await registry.connect(licensee).createBatch(1, "10kg", "M");
            await registry.connect(inspector).inspectBatch(1, true);
            const res = await registry.verifyBatch(1);
            expect(res.trustLevel).to.equal(3); // HIGH
            expect(res.isValid).to.be.true;
        });

        it("MEDIUM TRUST: Valid but not inspected", async function () {
            await registry.connect(licensee).createBatch(1, "10kg", "M");
            const res = await registry.verifyBatch(1);
            expect(res.trustLevel).to.equal(2); // MEDIUM
        });

        it("LOW TRUST: Rejected by inspector", async function () {
            await registry.connect(licensee).createBatch(1, "10kg", "M");
            await registry.connect(inspector).inspectBatch(1, false);
            const res = await registry.verifyBatch(1);
            expect(res.trustLevel).to.equal(1); // LOW
            expect(res.isValid).to.be.false;
        });

        it("INVALID: Variety revoked", async function () {
            await registry.connect(licensee).createBatch(1, "10kg", "M");
            await registry.revokeVariety(1, "Reason");
            const res = await registry.verifyBatch(1);
            expect(res.trustLevel).to.equal(0); // INVALID
            expect(res.isValid).to.be.false;
        });

        it("WARNING: License revoked AFTER production", async function () {
            await registry.connect(licensee).createBatch(1, "10kg", "M");
            await registry.connect(breeder).revokeLicense(1, "Reason");
            const res = await registry.verifyBatch(1);
            expect(res.trustLevel).to.equal(2); // MEDIUM (due to warning)
            expect(res.licenseRevokedAfterProduction).to.be.true;
        });

        it("WARNING: License expired AFTER production", async function () {
            const expiry = (await time.latest()) + 1000;
            await registry.connect(breeder).issueLicense(1, other.address, expiry); // License ID 2
            await registry.connect(other).createBatch(2, "1kg", "M"); // Batch ID 1

            await time.increase(2000);
            const res = await registry.verifyBatch(1);
            expect(res.message).to.contain("WARNING: License expired after batch production");
            expect(res.trustLevel).to.equal(2);
        });

        it("INVALID: Consistent mismatch check", async function () {
            await registry.connect(licensee).createBatch(1, "10kg", "M");

            // Manually corrupt storage to simulate inconsistent data: set license[1].varietyID = 2
            // license mapping slot index is 8 (after primitive vars, array and previous mappings)
            const baseSlot = mappingSlot(1n, 8n); // license[1] base slot
            const varietyIdSlot = BigInt(baseSlot) + 1n; // offset +1 dentro la struct License
            await ethers.provider.send("hardhat_setStorageAt", [
                registry.target,
                ethers.zeroPadValue(ethers.toBeHex(varietyIdSlot), 32),
                ethers.zeroPadValue(ethers.toBeHex(2), 32)
            ]);

            const res = await registry.verifyBatch(1);
            expect(res.trustLevel).to.equal(0); // INVALID
            expect(res.isValid).to.be.false;
            expect(res.message).to.contain("license does not match batch variety");
        });
    });

    describe("6. Modifiers & Edge Cases", function () {
        it("Should revert on non-existent IDs", async function () {
            await expect(registry.getVariety(99)).to.be.revertedWith("Invalid variety ID");
            await expect(registry.getBatch(99)).to.be.revertedWith("Invalid batch ID");
            await expect(registry.getLicense(99)).to.be.revertedWith("Invalid license ID");
        });

        it("Should revert if non-breeder/licensee calls restricted functions", async function () {
            await registry.registerVariety(VARIETY_NAME, REG_NUM, breeder.address, DOC_HASH, DOC_URI);
            await registry.connect(breeder).issueLicense(1, licensee.address, 0);

            await expect(registry.connect(other).issueLicense(1, other.address, 0)).to.be.revertedWith("Only breeder of this variety can call this function");
            await expect(registry.connect(other).createBatch(1, "1kg", "M")).to.be.revertedWith("Only licensee of this license can call this function");
        });

        it("Should revert if variety is revoked during license issuance", async function () {
            await registry.registerVariety(VARIETY_NAME, REG_NUM, breeder.address, DOC_HASH, DOC_URI);
            await registry.revokeVariety(1, "R");
            await expect(registry.connect(breeder).issueLicense(1, licensee.address, 0)).to.be.revertedWith("Variety must be active to issue a license");
        });
    });
});
