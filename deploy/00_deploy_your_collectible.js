// deploy/00_deploy_your_contract.js

const { ethers } = require("hardhat");
const fs = require("fs");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  console.log("deployer: " + deployer);

  await deploy("PLINFT", {
    from: deployer,
    args: [],
    log: true,
  });
};
module.exports.tags = ["PLINFT"];
