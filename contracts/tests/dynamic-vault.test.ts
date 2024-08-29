import { expect } from "chai";
import { ethers, getNamedAccounts, deployments } from "hardhat";
// import * from 'consumable-sdk';

/* Objetive: Validate the consumable vault contract correctness */
describe("Consumable DynamicVault", function () {
  let deployer: string;
  let receiver: string;
  let consumer: string;

  before(async () => {
    ({ deployer, receiver, consumer } = await getNamedAccounts());
  });

  async function deployContracts() {
    await deployments.fixture(["all"]);
    const usdt = await deployments.get("USDT");
    const vault = await deployments.get("DynamicVault");
    return { usdt, vault };
  }

  it("Consumer should be able to withdraw", async function () {
    /* 1. Deploy contracts */
    const { vault, usdt } = await deployContracts();
    expect(usdt.address).to.be.properAddress;
    expect(vault.address).to.be.properAddress;

    const vaultContract = await ethers.getContractAt("DynamicVault", vault.address);
    const usdtContract = await ethers.getContractAt("USDT", usdt.address);

    /* 1.5 addConsumer */
    console.log("adding consumer...");
    const txAdd = await vaultContract._addConsumer(consumer);
    await txAdd.wait();

    /* 2. Fund Vault */
    await usdtContract.mint(vaultContract, 1000);
    expect(await usdtContract.balanceOf(vault.address)).to.equal(1000);

    /* 3. Generate vouchers */
    console.log("generating vouchers...");
    const data = {
      privateKey: "0xcef7d065345a3b2c64389c39b22fc0206ac03ffd4097930b7c7c31188290b8f0",
      contractAddress: "0xD7ACd2a9FD159E69Bb102A1ca21C9a3e3A5F771B",
      methodName: "vouch",
      methodArgs: [
        {
          name: "receiver",
          type: "address",
        },
      ],
      chainId: 1,
    };

    /* 4. Prepare Secret Caller */
    const consumerSigner = await ethers.provider.getSigner(consumer);
    const vaultContractAsSecretCaller = vaultContract.connect(consumerSigner);

    /* 5. Consume voucher */
    console.log("consuming voucher...");
    const txConsume = await vaultContractAsSecretCaller.consumeSecret(receiver);
    await txConsume.wait();

    /* 5. Validate */
    expect(await usdtContract.balanceOf(receiver)).to.equal(100);

    /* 6. Consume voucher again and expect to fail */
    console.log("consuming voucher again...");
    await expect(vaultContractAsSecretCaller.consumeSecret(receiver)).to.be.revertedWith("!Uses");
  });
});
