const { ethers } = require("hardhat");

async function main() {
  console.log("Starting deployment...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Contract constructor parameters
  const FLAPPY_TOKEN_ADDRESS = process.env.FLAPPY_TOKEN_ADDRESS || "0x0000000000000000000000000000000000000000";
  const GAME_SERVER_SIGNER = process.env.GAME_SERVER_SIGNER || deployer.address;

  if (FLAPPY_TOKEN_ADDRESS === "0x0000000000000000000000000000000000000000") {
    console.error("❌ Please set FLAPPY_TOKEN_ADDRESS in your .env file");
    process.exit(1);
  }

  console.log("FLAPPY Token Address:", FLAPPY_TOKEN_ADDRESS);
  console.log("Game Server Signer:", GAME_SERVER_SIGNER);

  // Deploy the contract
  const FlappyArbDistributor = await ethers.getContractFactory("FlappyArbDistributor");
  const distributor = await FlappyArbDistributor.deploy(FLAPPY_TOKEN_ADDRESS, GAME_SERVER_SIGNER);

  await distributor.waitForDeployment();
  const contractAddress = await distributor.getAddress();

  console.log("✅ FlappyArbDistributor deployed to:", contractAddress);

  // Verify deployment
  console.log("\n📋 Deployment Summary:");
  console.log("Contract Address:", contractAddress);
  console.log("SMOL Token:", SMOL_TOKEN_ADDRESS);
  console.log("Game Server Signer:", GAME_SERVER_SIGNER);
  console.log("Deployer:", deployer.address);
  console.log("Network:", (await ethers.provider.getNetwork()).name);

  // Save deployment info
  const deploymentInfo = {
    contractAddress,
    flappyTokenAddress: FLAPPY_TOKEN_ADDRESS,
    gameServerSigner: GAME_SERVER_SIGNER,
    deployer: deployer.address,
    network: (await ethers.provider.getNetwork()).name,
    blockNumber: await ethers.provider.getBlockNumber(),
    timestamp: new Date().toISOString(),
  };

  console.log("\n🔧 Next Steps:");
  console.log("1. Update CONTRACT_ADDRESSES in src/contracts/FlappyArbDistributor.ts");
  console.log("2. Set GAME_SERVER_PRIVATE_KEY in Supabase environment variables");
  console.log("3. Fund the contract with FLAPPY tokens for distribution");
  console.log("4. Verify the contract on Etherscan (optional)");

  // Verification command
  console.log("\n📝 To verify on Etherscan, run:");
  console.log(`npx hardhat verify --network ${process.env.HARDHAT_NETWORK || 'sepolia'} ${contractAddress} "${FLAPPY_TOKEN_ADDRESS}" "${GAME_SERVER_SIGNER}"`);

  return deploymentInfo;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });