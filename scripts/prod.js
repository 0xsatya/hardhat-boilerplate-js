const { task } = require("hardhat/config");
const { getAccount } = require("./helpers");

task("check-balance", "Prints out the balance of your account").setAction(
  async function (taskArguments, hre) {
    const account = getAccount();
    console.log(
      `Account balance for ${account.address}: ${await account.getBalance()}`
    );
  }
);

task("prod-deploy", "Deploys the PLINFT.sol contract").setAction(
  async function (taskArguments, hre) {
    const account = getAccount();
    const nftContractFactory = await hre.ethers.getContractFactory(
      "PLINFT",
      account
    );
    const plinft = await nftContractFactory.deploy();
    console.log(`Contract deployed by: ${account.deployer}`);
    console.log(`Contract deployed to address: ${plinft.address}`);
  }
);
