import { expect } from "chai";
import { ethers, getNamedAccounts, deployments } from "hardhat";
// import * from 'consumable-sdk';

/* Objetive: Validate the consumable vault contract correctness */
describe("Consumable Vault", function () {
  let deployer: string;
  let receiver: string;

  before(async () => {
    ({ deployer, receiver } = await getNamedAccounts());
  });

  async function deployContracts() {
    await deployments.fixture(["all"]);
    const usdt = await deployments.get("USDT");
    const vault = await deployments.get("Vault");
    return { usdt, vault };
  }

  it("Consumer should be able to withdraw", async function () {
    /* 1. Deploy contracts */
    const { vault, usdt } = await deployContracts();
    expect(usdt.address).to.be.properAddress;
    expect(vault.address).to.be.properAddress;

    const vaultContract = await ethers.getContractAt("Vault", vault.address);
    const usdtContract = await ethers.getContractAt("USDT", usdt.address);

    /* 2. Fund Vault */
    await usdtContract.mint(vaultContract, 1000);
    expect(await usdtContract.balanceOf(vault.address)).to.equal(1000);

    /* 3. Generate vouchers */
    console.log("generating vouchers...");
    const data = {
      privateKey: "0xcef7d065345a3b2c64389c39b22fc0206ac03ffd4097930b7c7c31188290b8f0",
      contractAddress: "0xD7ACd2a9FD159E69Bb102A1ca21C9a3e3A5F771B",
      methodName: "voucherWithdraw",
      methodArgs: [{ name: "_merkleProof", type: "bytes32[]" }],
      chainId: 1,
      merkleProof: ["0x37f8769f683a9e76361688801675599a21240c348a9026c25c69328b0a38b9d3", "0x946832e908d1a0cb8ab277b292c31839c6f92ab2920db6187c8342827ef17e01"],
      root: "0x7c051167362941338293b69a56e14425db2dd23de7cee321c504981379214fe0",
    };

    /* 4. Prepare Secret Caller */
    const secretCaller = new ethers.Wallet(data.privateKey, ethers.provider);
    const vaultContractAsSecretCaller = vaultContract.connect(secretCaller);

    /* 4.5 fund the secretCaller */
    const deployerSigner = await ethers.provider.getSigner(deployer);
    const fundTx = await deployerSigner.sendTransaction({
      to: secretCaller.address,
      value: ethers.parseEther("1"), // Sending 1 Ether to secretCaller
    });
    await fundTx.wait();
    const balanceOfSecretCaller = await ethers.provider.getBalance(secretCaller.address);
    expect(balanceOfSecretCaller).to.equal(ethers.parseEther("1"));

    /* 5. Consume voucher */
    console.log("consuming voucher...");
    const tx = await vaultContractAsSecretCaller.consumeSecret(data.merkleProof, receiver);
    await tx.wait();

    /* 5. Validate */
    expect(await usdtContract.balanceOf(receiver)).to.equal(100);

    /* 6. Consume voucher again and expect to fail */
    console.log("consuming voucher again...");
    await expect(vaultContractAsSecretCaller.consumeSecret(data.merkleProof, receiver)).to.be.revertedWith("Consumer has exceeded total uses");
  });
});
