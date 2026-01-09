const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

function logStep(message) {
    console.log(`\n==> ${message}`);
}

async function updateFrontendConfig(contractAddress) {
    const frontendConfigPath = path.join(__dirname, "../../frontend/src/utils/config.js");
    if (!fs.existsSync(frontendConfigPath)) {
        console.error("Frontend config not found:", frontendConfigPath);
        return;
    }

    let configContent = fs.readFileSync(frontendConfigPath, "utf8");
    const regex = /export const CONTRACT_ADDRESS\s*=\s*['"`][^'"`]+['"`];?/;
    const newLine = `export const CONTRACT_ADDRESS = '${contractAddress}';`;

    if (regex.test(configContent)) {
        configContent = configContent.replace(regex, newLine);
        fs.writeFileSync(frontendConfigPath, configContent);
        console.log(`Updated frontend config with CONTRACT_ADDRESS: ${contractAddress}`);
    } else {
        console.error("CONTRACT_ADDRESS line not found in frontend config.");
    }
}

async function expectRevert(label, action) {
    try {
        await action();
        console.warn(`UNEXPECTED SUCCESS: ${label}`);
    } catch (err) {
        const message = err?.reason || err?.message || "revert";
        console.log(`Expected revert (${label}): ${message}`);
    }
}

async function main() {
    logStep("Deploying VarietyLicenseRegistry (dense seed)");
    const [authority, breederA, breederB, licenseeA, licenseeB, licenseeC, inspectorA, inspectorB, other] =
        await hre.ethers.getSigners();

    const Registry = await hre.ethers.getContractFactory("VarietyLicenseRegistry");
    const registry = await Registry.deploy();
    await registry.waitForDeployment();
    const contractAddress = await registry.getAddress();

    console.log("Contract address:", contractAddress);
    console.log("Authority:", authority.address);

    await updateFrontendConfig(contractAddress);

    logStep("Register inspectors");
    await (await registry.addInspector(inspectorA.address)).wait();
    await (await registry.addInspector(inspectorB.address)).wait();

    let varietyCounter = 0;
    let licenseCounter = 0;
    let batchCounter = 0;

    const registerVariety = async (data) => {
        const tx = await registry.registerVariety(
            data.name,
            data.regNum,
            data.breeder.address,
            data.docHash,
            data.docUri
        );
        await tx.wait();
        varietyCounter += 1;
        console.log(`Variety #${varietyCounter}: ${data.name} (${data.regNum})`);
        return varietyCounter;
    };

    const issueLicense = async (breederSigner, varietyId, licensee, expiry, label) => {
        const tx = await registry.connect(breederSigner).issueLicense(varietyId, licensee.address, expiry);
        await tx.wait();
        licenseCounter += 1;
        console.log(`License #${licenseCounter}: ${label}`);
        return licenseCounter;
    };

    const createBatch = async (licenseeSigner, licenseId, quantity, metadata, label) => {
        const tx = await registry.connect(licenseeSigner).createBatch(licenseId, quantity, metadata);
        await tx.wait();
        batchCounter += 1;
        console.log(`Batch #${batchCounter}: ${label}`);
        return batchCounter;
    };

    logStep("Register varieties");
    const v1 = await registerVariety({
        name: "Mela Aurora",
        regNum: "REG-001",
        breeder: breederA,
        docHash: "QmAuroraHash1111111111111111111111111111111111",
        docUri: "https://gateway.pinata.cloud/ipfs/QmAuroraHash1111111111111111111111111111111111"
    });

    const v2 = await registerVariety({
        name: "Pera Nera",
        regNum: "REG-002",
        breeder: breederA,
        docHash: "QmPeraHash2222222222222222222222222222222222",
        docUri: ""
    });

    const v3 = await registerVariety({
        name: "Vite Solare",
        regNum: "REG-003",
        breeder: breederB,
        docHash: "QmViteHash3333333333333333333333333333333333",
        docUri: "ipfs://QmViteHash3333333333333333333333333333333333"
    });

    const v4 = await registerVariety({
        name: "Kiwi Nord",
        regNum: "REG-004",
        breeder: breederB,
        docHash: "QmKiwiHash4444444444444444444444444444444444",
        docUri: "https://gateway.pinata.cloud/ipfs/QmKiwiHash4444444444444444444444444444444444"
    });

    const v5 = await registerVariety({
        name: "Citrus X",
        regNum: "REG-005",
        breeder: breederB,
        docHash: "QmCitrusHash5555555555555555555555555555555555",
        docUri: ""
    });

    const v6 = await registerVariety({
        name: "Luppolo Verde",
        regNum: "REG-006",
        breeder: breederA,
        docHash: "QmLuppoloHash66666666666666666666666666666666",
        docUri: ""
    });

    const v7 = await registerVariety({
        name: "Riso Nero",
        regNum: "REG-007",
        breeder: breederB,
        docHash: "QmRisoHash7777777777777777777777777777777777",
        docUri: "https://gateway.pinata.cloud/ipfs/QmRisoHash7777777777777777777777777777777777"
    });

    await expectRevert("duplicate registration number", async () => {
        await registry.registerVariety("Mela Clone", "REG-001", breederB.address, "QmDupHash", "https://example.com");
    });

    await expectRevert("authority as breeder", async () => {
        await registry.registerVariety("Invalid Authority Breeder", "REG-999", authority.address, "QmBadHash", "https://example.com");
    });

    logStep("Revoke one variety immediately");
    await (await registry.revokeVariety(v5, "Seeded revoked variety")).wait();

    await expectRevert("issue license on revoked variety", async () => {
        await registry.connect(breederB).issueLicense(v5, licenseeA.address, 0);
    });

    await expectRevert("issue license by non-breeder", async () => {
        await registry.connect(breederB).issueLicense(v1, licenseeA.address, 0);
    });

    await expectRevert("issue license to breeder", async () => {
        await registry.connect(breederA).issueLicense(v1, breederA.address, 0);
    });

    await expectRevert("issue license to zero address", async () => {
        await registry.connect(breederA).issueLicense(v1, hre.ethers.ZeroAddress, 0);
    });

    logStep("Issue licenses");
    const now = (await hre.ethers.provider.getBlock("latest")).timestamp;
    const oneHour = 60 * 60;
    const oneDay = 24 * 60 * 60;
    const oneMonth = 30 * oneDay;

    const l1 = await issueLicense(breederA, v1, licenseeA, 0, "v1 -> licenseeA (permanent)");
    const l2 = await issueLicense(breederA, v1, licenseeB, now + oneHour, "v1 -> licenseeB (short expiry)");
    const l3 = await issueLicense(breederA, v2, licenseeA, now + oneMonth, "v2 -> licenseeA (will be revoked)");
    const l4 = await issueLicense(breederB, v3, licenseeC, 0, "v3 -> licenseeC (permanent)");
    const l5 = await issueLicense(breederB, v4, licenseeB, 0, "v4 -> licenseeB (variety will be revoked)");
    const l6 = await issueLicense(breederB, v4, licenseeA, 0, "v4 -> licenseeA (pending batch)");
    const l7 = await issueLicense(breederA, v6, licenseeB, now + oneMonth, "v6 -> licenseeB (active)");
    const l8 = await issueLicense(breederB, v7, licenseeC, 0, "v7 -> licenseeC (active)");

    logStep("Create batches");
    const b1 = await createBatch(licenseeA, l1, "10kg", "Baseline batch, should be approved", "l1 by licenseeA");
    const b2 = await createBatch(licenseeB, l2, "5kg", "Short expiry license batch", "l2 by licenseeB");
    const b3 = await createBatch(licenseeA, l3, "12kg", "Will be revoked after production", "l3 by licenseeA");
    const b4 = await createBatch(licenseeC, l4, "8kg", "Will be rejected by inspector", "l4 by licenseeC");
    const b5 = await createBatch(licenseeB, l5, "4kg", "Variety will be revoked after production", "l5 by licenseeB");
    const b6 = await createBatch(licenseeA, l6, "6kg", "Pending inspection", "l6 by licenseeA");
    const b7 = await createBatch(licenseeB, l7, "7kg", "Clean batch, should be approved", "l7 by licenseeB");
    const b8 = await createBatch(licenseeC, l8, "3kg", "Pending inspection", "l8 by licenseeC");
    const b9 = await createBatch(licenseeA, l1, "9kg", "Second batch for license l1", "l1 second batch");

    await expectRevert("create batch with wrong licensee", async () => {
        await registry.connect(licenseeB).createBatch(l1, "1kg", "Wrong licensee");
    });

    logStep("Inspect batches");
    await (await registry.connect(inspectorA).inspectBatch(b1, true)).wait();
    await (await registry.connect(inspectorA).inspectBatch(b4, false)).wait();
    await (await registry.connect(inspectorB).inspectBatch(b5, true)).wait();
    await (await registry.connect(inspectorB).inspectBatch(b7, true)).wait();

    logStep("Revoke license and variety after production");
    await (await registry.connect(breederA).revokeLicense(l3, "Revoked after production")).wait();
    await (await registry.revokeVariety(v4, "Revoked after production")).wait();

    await expectRevert("create batch with revoked license", async () => {
        await registry.connect(licenseeA).createBatch(l3, "1kg", "License revoked");
    });

    await expectRevert("create batch with revoked variety", async () => {
        await registry.connect(licenseeA).createBatch(l6, "1kg", "Variety revoked");
    });

    logStep("Advance time to expire short license");
    await hre.network.provider.send("evm_increaseTime", [2 * 60 * 60]);
    await hre.network.provider.send("evm_mine");

    await expectRevert("create batch with expired license", async () => {
        await registry.connect(licenseeB).createBatch(l2, "1kg", "Expired license");
    });

    const counts = await registry.getCounters();
    console.log("\n==> SEED SUMMARY");
    console.log("Varieties:", counts.varietiesCounter.toString());
    console.log("Licenses:", counts.licensesCounter.toString());
    console.log("Batches:", counts.batchesCounter.toString());
    console.log("Done.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
