const { ethers } = require("hardhat");
const { use, expect } = require("chai");
const { solidity } = require("ethereum-waffle");
const { parseEther } = require("ethers/lib/utils");
const fs = require("fs");

const paidWhitelistAddresses = JSON.parse(
  fs.readFileSync("test/paid_whitelist_test.json").toString()
);
const freeWhitelistAddresses = JSON.parse(
  fs.readFileSync("test/free_whitelist_test.json").toString()
);
use(solidity);

async function deploy() {
  const Contract = await ethers.getContractFactory("PLINFT");
  return Contract.deploy().then((f) => f.deployed());
}

describe("PLINFT", function () {
  beforeEach(async function () {
    this.accounts = await ethers.getSigners();
    this.provider = await ethers.getDefaultProvider();
  });

  describe("Minting", function () {
    const paidWhitelistAddress = paidWhitelistAddresses[0];
    const freeWhitelistAddress = freeWhitelistAddresses[1];
    const nonWhitelistedAddress = "0x3583CD16dbcA00dC62ed201Db2C3073aaAA679Ae";
    const operatorAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

    beforeEach(async function () {
      this.registry = await deploy();
      this.ownerAccount = this.accounts[0];
      this.plinftAccount = this.accounts[2];

      await this.registry
        .connect(this.ownerAccount)
        .setPaidWhitelist(paidWhitelistAddresses);
      await this.registry
        .connect(this.ownerAccount)
        .setFreeWhitelist(freeWhitelistAddresses);
    });

    it("paid whitelisted address succeeds", async function () {
      const ownerAccount = this.accounts[0];
      const nonOwnerAccount = this.accounts[1];
      await this.registry.connect(ownerAccount).setIsActiveSale(true);

      await expect(
        this.registry
          .connect(nonOwnerAccount)
          .mintItem(paidWhitelistAddress, 0, {
            value: parseEther("0.08"),
          })
      )
        .to.emit(this.registry, "TransferSingle")
        .withArgs(
          operatorAddress,
          ethers.constants.AddressZero,
          paidWhitelistAddress,
          0,
          1
        );
    });

    it("free whitelisted address succeeds", async function () {
      const ownerAccount = this.accounts[0];
      const nonOwnerAccount = this.accounts[1];
      await this.registry.connect(ownerAccount).setIsActiveSale(true);

      await expect(
        this.registry
          .connect(nonOwnerAccount)
          .mintItem(freeWhitelistAddress, 0, {
            value: parseEther("0.00"),
          })
      )
        .to.emit(this.registry, "TransferSingle")
        .withArgs(
          operatorAddress,
          ethers.constants.AddressZero,
          freeWhitelistAddress,
          0,
          1
        );
    });

    it("paid whitelisted address without enough ether fails", async function () {
      const ownerAccount = this.accounts[0];
      const nonOwnerAccount = this.accounts[1];
      await this.registry.connect(ownerAccount).setIsActiveSale(true);
      await expect(
        this.registry
          .connect(nonOwnerAccount)
          .mintItem(paidWhitelistAddress, 0, {
            value: parseEther("0.01"),
          })
      ).to.be.revertedWith("Transaction value did not equal the mint price.");
    });

    it("non-whitelisted address fails during whitelisted mint", async function () {
      const ownerAccount = this.accounts[0];
      const nonOwnerAccount = this.accounts[1];
      await this.registry.connect(ownerAccount).setIsActiveSale(true);

      await expect(
        this.registry
          .connect(nonOwnerAccount)
          .mintItem(nonWhitelistedAddress, 0, {
            value: parseEther("0.08"),
          })
      ).to.be.revertedWith("Not on the whitelist.");
    });

    it("non-whitelisted address succeeds during public mint", async function () {
      const ownerAccount = this.accounts[0];
      const nonOwnerAccount = this.accounts[1];
      await this.registry.connect(ownerAccount).setIsActiveSale(true);
      await this.registry.connect(ownerAccount).setIsPublicSale(true);

      await expect(
        this.registry
          .connect(nonOwnerAccount)
          .publicMint(nonWhitelistedAddress, 0, {
            value: parseEther("0.08"),
          })
      )
        .to.emit(this.registry, "TransferSingle")
        .withArgs(
          operatorAddress,
          ethers.constants.AddressZero,
          nonWhitelistedAddress,
          0,
          1
        );
    });

    it("non-whitelisted address fails during public mint with not enough ether", async function () {
      const ownerAccount = this.accounts[0];
      const nonOwnerAccount = this.accounts[1];
      await this.registry.connect(ownerAccount).setIsActiveSale(true);
      await this.registry.connect(ownerAccount).setIsPublicSale(true);

      await expect(
        this.registry
          .connect(nonOwnerAccount)
          .publicMint(nonWhitelistedAddress, 0, {
            value: parseEther("0.04"),
          })
      ).to.be.revertedWith("Transaction value did not equal the mint price.");
    });

    it("fails when the sale is not active", async function () {
      const nonOwnerAccount = this.accounts[1];
      await expect(
        this.registry
          .connect(nonOwnerAccount)
          .mintItem(paidWhitelistAddress, 0, {
            value: parseEther("0.08"),
          })
      ).to.be.revertedWith("Sale is not active.");
    });

    it("can't mint twice", async function () {
      const ownerAccount = this.accounts[0];
      await this.registry.connect(ownerAccount).setIsActiveSale(true);
      await expect(
        this.registry
          .connect(this.accounts[1])
          .mintItem(paidWhitelistAddress, 0, {
            value: parseEther("0.08"),
          })
      )
        .to.emit(this.registry, "TransferSingle")
        .withArgs(
          operatorAddress,
          ethers.constants.AddressZero,
          paidWhitelistAddress,
          0,
          1
        );
      await expect(
        this.registry
          .connect(this.accounts[1])
          .mintItem(paidWhitelistAddress, 0, {
            value: parseEther("0.08"),
          })
      ).to.be.revertedWith("Exceeded maximum number of tokens.");
    });

    it("Set plinft wallet address", async function () {
      const ownerAccount = this.accounts[0];
      await this.registry
        .connect(ownerAccount)
        .setPlinftWallet(this.plinftAccount.address);
    });

    it("Withdraws funds to plinft wallet", async function () {
      await this.registry
        .connect(this.ownerAccount)
        .setPlinftWallet(this.plinftAccount.address);

      const ownerAccount = this.accounts[0];
      const nonOwnerAccount = this.accounts[1];
      await this.registry.connect(ownerAccount).setIsActiveSale(true);

      let tx = await this.registry
        .connect(nonOwnerAccount)
        .mintItem(paidWhitelistAddress, 0, {
          value: parseEther("0.08"),
        });
      await tx.wait();

      await this.registry.connect(this.accounts[0]).withdrawAll();
    });
  });
});
