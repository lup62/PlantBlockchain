const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log(`
        ccee88oo
     C8O8O8Q8PoOb o8oo
    dOB69QO8PdUOpugoO9bD
   CgggbU8OU qOp qOdoUOdcb
       6OuU  /p u gcoUodpP
         \\\\\\//  /douUP
           \\\\\\////
            |||/\\
            |||\\/
            |||||
      .....//||||\\....
                                                  
    🌱 Plant Blockchain Deployment 🌍
    `);

    console.log("🚀 Starting deployment of VarietyLicenseRegistry...\n");

    // Getter dell account deployer
    const [deployer] = await hre.ethers.getSigners();
    const balance = await hre.ethers.provider.getBalance(deployer.address);

    console.log("📝 Deployment Info:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`Network: ${hre.network.name}`);
    console.log(`Deployer: ${deployer.address}`);
    console.log(`Balance: ${hre.ethers.formatEther(balance)} ETH`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // Controllo del saldo
    const estimatedGas = hre.ethers.parseEther("0.05");
    if (balance < estimatedGas) {
        console.error("❌ Insufficient balance for deployment!");
        console.error(`   Required: ~${hre.ethers.formatEther(estimatedGas)} ETH`);
        console.error(`   Available: ${hre.ethers.formatEther(balance)} ETH`);
        process.exit(1);
    }

    // Deploy del contratto
    console.log("📦 Deploying VarietyLicenseRegistry...");
    const VarietyLicenseRegistry = await hre.ethers.getContractFactory("VarietyLicenseRegistry");

    const registry = await VarietyLicenseRegistry.deploy();
    await registry.waitForDeployment();

    const contractAddress = await registry.getAddress();

    console.log("✅ Contract deployed successfully!");
    console.log(`   Address: ${contractAddress}`);
    console.log(`   Transaction: ${registry.deploymentTransaction().hash}\n`);

    // Verifica del deploy
    console.log("🔍 Verifying deployment...");
    const authority = await registry.getAuthority();
    const counters = await registry.getCounters();

    console.log("   Authority:", authority);
    console.log("   Variety Counter:", counters.varietiesCounter.toString());
    console.log("   Batch Counter:", counters.batchesCounter.toString());
    console.log("   License Counter:", counters.licensesCounter.toString());

    if (authority !== deployer.address) {
        console.error("❌ Mismatch authority!");
        process.exit(1);
    }

    console.log("✅ Deployment verified!\n");

    // Salvataggio delle informazioni del deploy (utile per il frontend)
    const deploymentInfo = {
        network: hre.network.name,
        contractAddress: contractAddress,
        deployerAddress: deployer.address,
        transactionHash: registry.deploymentTransaction().hash,
        blockNumber: registry.deploymentTransaction().blockNumber,
        timestamp: new Date().toISOString(),
        authority: authority
    };

    // Creazione della directory per i deploy (se non esiste)
    const deploymentsDir = path.join(__dirname, "..", "deployments");
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const filename = path.join(deploymentsDir, `${hre.network.name}.json`);
    fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));

    console.log("💾 Deployment info salvato:");
    console.log(`   File: ${filename}\n`);

    return contractAddress;
}

// Esecuzione del deploy
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ Deployment fallito:");
        console.error(error);
        process.exit(1);
    });
