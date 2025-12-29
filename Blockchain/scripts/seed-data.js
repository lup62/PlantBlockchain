
const hre = require("hardhat");

async function main() {
    const [deployer, breeder, licensee, inspector] = await hre.ethers.getSigners();
    const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const VarietyLicenseRegistry = await hre.ethers.getContractFactory("VarietyLicenseRegistry");
    const contract = await VarietyLicenseRegistry.attach(contractAddress);

    console.log("--- Popolamento Dati di Test ---");

    // 1. Aggiunta Ispettore
    console.log("Aggiunta Ispettore...");
    await contract.addInspector(inspector.address);
    console.log("Ispettore aggiunto:", inspector.address);

    // 2. Registrazione Varietà (Authority)
    console.log("Registrazione Varietà...");
    await contract.registerVariety(
        "Tardivo di Ciaculli",
        "REG-2025-001",
        breeder.address,
        "hash_documento_test_123",
        "https://ipfs.io/ipfs/QmTestURI"
    );
    console.log("Varietà registrata (ID 1)");

    // 3. Emissione Licenza (Breeder)
    console.log("Emissione Licenza...");
    const tomorrow = Math.floor(Date.now() / 1000) + 86400 * 365; // 1 anno
    await contract.connect(breeder).issueLicense(1, licensee.address, tomorrow);
    console.log("Licenza emessa (ID 1) per", licensee.address);

    // 4. Creazione Batch (Licensee)
    console.log("Creazione Batch...");
    await contract.connect(licensee).createBatch(1, "500 Kg", "Raccolto Dicembre 2025");
    console.log("Batch creato (ID 1)");

    console.log("--- Test Data Generato con Successo ---");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
