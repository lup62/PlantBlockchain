const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("\n==> INIZIO RESET TOTALE DEL SISTEMA...");

    // 1. GET SIGNERS
    const [deployer, breeder, licensee, inspector] = await hre.ethers.getSigners();
    console.log("Deployer:", deployer.address);

    // 2. DEPLOY CONTRACT
    console.log("\n==> Deploying Contract 'VarietyLicenseRegistry'...");
    const VarietyLicenseRegistry = await hre.ethers.getContractFactory("VarietyLicenseRegistry");
    const contract = await VarietyLicenseRegistry.deploy();
    await contract.waitForDeployment();

    const contractAddress = contract.target;
    console.log(`OK. CONTRATTO DEPLOYATO A: ${contractAddress}`);

    // 3. UPDATE FRONTEND CONFIG AUTOMATICALLY
    console.log("\n==> Aggiornamento automatico file config.js...");
    const frontendConfigPath = path.join(__dirname, "../../frontend/src/utils/config.js");

    if (fs.existsSync(frontendConfigPath)) {
        let configContent = fs.readFileSync(frontendConfigPath, "utf8");

        // Regex mirata per la sola riga CONTRACT_ADDRESS
        const regex = /export const CONTRACT_ADDRESS\s*=\s*['"`][^'"`]+['"`];?/;
        const newLine = `export const CONTRACT_ADDRESS = '${contractAddress}';`;

        if (regex.test(configContent)) {
            configContent = configContent.replace(regex, newLine);
            fs.writeFileSync(frontendConfigPath, configContent);
            console.log(`OK. Config aggiornata con indirizzo: ${contractAddress}`);
        } else {
            console.error("ERRORE: non trovo la riga CONTRACT_ADDRESS nel config frontend");
        }
    } else {
        console.error("ERRORE CRITICO: config.js non trovato in:", frontendConfigPath);
    }

    // 4. SEED DATA (POPOLAMENTO)
    console.log("\n==> Inserimento Dati di Test...");

    // Aggiunta Ispettore
    const tx1 = await contract.connect(deployer).addInspector(inspector.address);
    await tx1.wait();
    console.log(`   - Ispettore Aggiunto: ${inspector.address}`);

    // Registrazione Varietà
    const tx2 = await contract.connect(deployer).registerVariety(
        "Mela Test",
        "EU-2025-001",
        breeder.address,
        "QmHashFake123",
        "https://pinata.cloud/ipfs/QmHashFake123"
    );
    await tx2.wait();
    console.log(`   - Varietà 'Mela Test' Registrata (Breeder: ${breeder.address})`);

    // Emissione Licenza
    const tx3 = await contract.connect(breeder).issueLicense(
        1, // varietyID
        licensee.address,
        Math.floor(Date.now() / 1000) + 31536000 // 1 anno
    );
    await tx3.wait();
    console.log(`   - Licenza Emessa a: ${licensee.address}`);

    console.log("\n==> TUTTO PRONTO!");
    console.log("============================================");
    console.log("ORA FAI SOLO QUESTO NEL TUO TERMINALE FRONTEND:");
    console.log("1. Premi CTRL+C per spegnere il sito.");
    console.log("2. Scrivi 'npm run dev' per riavviarlo.");
    console.log("3. Ricarica la pagina.");
    console.log("============================================");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
