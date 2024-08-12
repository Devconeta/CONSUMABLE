import { HDNodeWallet, JsonRpcProvider, parseEther, Wallet } from "ethers";
import { ConsumableArguments, ConsumableDump, MethodArgument } from "./types";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import path from "path";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";

export const encode = (args: ConsumableArguments) => {
  return Buffer.from(JSON.stringify(args), 'utf-8').toString('base64');
}

export const generateWallets = (amount: number): HDNodeWallet[] => Array(amount).fill(0).map(() => Wallet.createRandom())

export const generateTree = (wallets: HDNodeWallet[]): StandardMerkleTree<string[]> => {
  const leaves = wallets.map(key => [key.address]);
  return StandardMerkleTree.of(leaves, ['address']);
}

export const generateSecrets = (
  tree: StandardMerkleTree<string[]>,
  wallets: Wallet[],
  contractAddress: string,
  methodName: string,
  methodArgs: MethodArgument[],
  chainId: number
): string[] => {

  const secrets = wallets.map((wallet) => encode({
    privateKey: wallet.privateKey,
    contractAddress,
    methodName,
    methodArgs,
    chainId,
    merkleProof: tree.getProof([wallet.address])
  }));

  saveSecrets(secrets)

  return secrets;
}

export const saveConsumableDumpToFile = (
  wallets: HDNodeWallet[],
  tree: StandardMerkleTree<any>,
  fileName?: string
): string => {
  const timestamp = new Date().toISOString().replace(/:/g, '-');

  const content = JSON.stringify({
    tree: { ...tree.dump(), root: tree.root },
    pks: wallets.map((w) => w.privateKey)
  })

  const filePath = saveData('dump', fileName ?? `data_${timestamp}.json`, content);

  return filePath;
}

export const saveSecrets = (secrets: string[], fileName?: string): string => {
  const timestamp = new Date().toISOString().replace(/:/g, '-');

  return saveData('secrets', fileName ?? `data_${timestamp}.json`, JSON.stringify(secrets));
}

const saveData = (fileDir: string, fileName: string, data: any): string => {
  const outputDir = path.join(process.cwd(), fileDir);
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir);
  }

  const filePath = path.join(outputDir, fileName);
  writeFileSync(filePath, data);

  return filePath;
}

export const loadConsumableDumpFromFile = (fileName: string): {
  wallets: Wallet[],
  tree: StandardMerkleTree<any>
} => {
  const { tree: treeDump, pks } = JSON.parse(readFileSync(fileName, "utf8")) as ConsumableDump;
  const wallets = pks.map((pk) => new Wallet(pk));
  const tree = StandardMerkleTree.load(treeDump);
  return {
    wallets,
    tree,
  }
}

export const fundPKsWithEth = async (
  privateKeys: string[],
  funderPrivateKey: string,
  chainId: number,
  rpcUrl: string,
  amount: string // Amount of ETH to send to each wallet (in ETH, not Wei)
): Promise<void> => {
  const provider = new JsonRpcProvider(rpcUrl, chainId);
  const funder = new Wallet(funderPrivateKey, provider);

  const amountWei = parseEther(amount);

  console.log(`Funding ${privateKeys.length} wallets with ${amount} ETH each`);

  let nonce = await provider.getTransactionCount(funder.address);

  for (let index = 0; index < privateKeys.length; index++) {
    const privateKey = privateKeys[index];
    const recipientWallet = new Wallet(privateKey, provider);

    console.log(`Funding wallet ${index + 1}: ${recipientWallet.address}`);

    let success = false;
    let retries = 0;
    const maxRetries = 3;

    while (!success && retries < maxRetries) {
      try {
        const feeData = await provider.getFeeData();
        const maxFeePerGas = feeData.maxFeePerGas ? feeData.maxFeePerGas * BigInt(2) : undefined;
        const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas ? feeData.maxPriorityFeePerGas * BigInt(2) : undefined;

        const tx = await funder.sendTransaction({
          to: recipientWallet.address,
          value: amountWei,
          nonce,
          maxFeePerGas,
          maxPriorityFeePerGas,
          gasLimit: 21000,
        });

        await tx.wait();
        success = true;
        nonce++;

        console.log(`Funded wallet ${index + 1}: ${recipientWallet.address} with ${amount} ETH`);
      } catch (error) {
        console.error(`Error funding wallet ${index + 1}:`, error);
        retries++;
        if (retries >= maxRetries) {
          throw error;
        }
        // Wait for a short time before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  console.log("All wallets funded successfully");
}

export const fundSecretsFromFile = async (
  fileName: string,
  funderPrivateKey: string,
  chainId: number,
  rpcUrl: string,
  amount: string
): Promise<void> => {
  const { pks } = JSON.parse(readFileSync(fileName, "utf8")) as ConsumableDump;
  await fundPKsWithEth(pks, funderPrivateKey, chainId, rpcUrl, amount);
}