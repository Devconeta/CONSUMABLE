#!/usr/bin/env node

import { StandardMerkleTree } from '@openzeppelin/merkle-tree';
import { MethodArgument } from '../src/types';
import { generateTree, generateWallets, saveConsumableDumpToFile, loadConsumableDumpFromFile, generateSecrets, saveSecrets, fundSecretsFromFile } from '../src/utils.node';
import { Command } from 'commander';
import { HDNodeWallet, Interface } from 'ethers';

// Primero: crear las wallets y crear el merkle tree con las addresses, el cual se lo damos al 
// dev para que deployee el contrato. Al mismo tiempo, guardamos las private keys en un 
// file para su uso como secrets en el stage 2
// Creamos una funcion para esta stage1 la cual no recibe ningun parametro

export const generateWalletsCommand = (amount: number, dumpFilename?: string): {
  wallets: HDNodeWallet[],
  tree: StandardMerkleTree<string[]>,
  fileName: string
} => {
  const wallets = generateWallets(amount);
  const tree = generateTree(wallets);
  const fileName = saveConsumableDumpToFile(wallets, tree, dumpFilename);

  return {
    wallets,
    tree,
    fileName
  }
}

export const generateSecretsCommand = (
  dumpFilename: string,
  contractAddress: string,
  methodName: string,
  methodArgs: MethodArgument[],
  chainId: number
): { secrets: string[], fileName: string } => {
  const {
    wallets,
    tree,
  } = loadConsumableDumpFromFile(dumpFilename);

  const secrets = generateSecrets(tree, wallets, contractAddress, methodName, methodArgs, chainId);
  const fileName = saveSecrets(secrets);

  return {
    secrets,
    fileName
  };
}

const program = new Command()

program
  .version("1.0.0")
  .description("CLI for generating the tree, wallets and secrets for Consumable contracts")
  .parse(process.argv);

program.command("generateWallets")
  .description("Generate wallets and save them to a file")
  .argument("<amount>", "Amount of wallets to create")
  .argument('[filename]', "Name of the file to save the private keys", undefined)
  .action((amount: string, filename: string) => {
    const numWallets = parseInt(amount, 10);
    if (isNaN(numWallets)) {
      console.error("Amount must be a valid number");
      return;
    }

    try {
      const generatedInfo = generateWalletsCommand(numWallets, filename || `wallets_${Date.now()}.json`);
      
      console.log(`Your tree's root: ${generatedInfo.tree.root}`);
      console.log(`Deploy data generated and saved to: ${generatedInfo.fileName}`);
    } catch (error) {
      console.error("Error generating wallets:", error);
    }
  });


program.command("generateSecrets")
  .description("Generate secrets based on the wallets and tree input file")
  .argument("<dumpFilename>", "Private keys dump file")
  .argument("<chainId>", "Contract chain id")
  .argument("<contractAddress>", "Consumable contract address")
  .argument("<methodSignature>", "onlyConsumer method signature")
  .action((
    dumpFilename: string,
    chainId: number,
    contractAddress: string,
    methodSignature: string,
  ) => {
    const parsedSignature = new Interface([`function ${methodSignature}`]);
    const functionFragment = parsedSignature.getFunction(methodSignature.split('(')[0]);

    const methodName = functionFragment?.name || '';
    const methodArguments = functionFragment?.inputs.map((input) => ({
      name: input.name,
      type: input.type,
    })) as MethodArgument[] || [];

    const secrets = generateSecretsCommand(dumpFilename, contractAddress, methodName, methodArguments, chainId);
    console.log(secrets.secrets);
    console.log(`Secrets generated and saved to: ${secrets.fileName}`);
  });

program.command("fundWallets")
  .description("Fund wallets from a dump file with ETH")
  .argument("<dumpFilename>", "Private keys dump file")
  .argument("<funderPrivateKey>", "Private key of the funding wallet")
  .argument("<chainId>", "Chain ID of the network")
  .argument("<rpcUrl>", "RPC URL of the network")
  .argument("<amount>", "Amount of ETH to send to each wallet")
  .action(async (
    dumpFilename: string,
    funderPrivateKey: string,
    chainId: string,
    rpcUrl: string,
    amount: string
  ) => {
    const chainIdNum = parseInt(chainId, 10);
    if (isNaN(chainIdNum)) {
      console.error("Chain ID must be a valid number");
      return;
    }

    try {
      await fundSecretsFromFile(dumpFilename, funderPrivateKey, chainIdNum, rpcUrl, amount);
      console.log(`Successfully funded wallets from ${dumpFilename} with ${amount} ETH each`);
    } catch (error) {
      console.error("Error funding wallets:", error);
    }
  });


program.parse();