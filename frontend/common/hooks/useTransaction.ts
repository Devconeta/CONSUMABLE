import { useState } from 'react';
import { ethers } from 'ethers';
import { CHAIN_ID, RPC, TransactionStatus } from '../types';

interface SendTransactionArgs {
  chainId: number;
  contractAddress: string;
  receiverAddress: string;
  privateKey: string;
  methodName: string;
  merkleProof: string[];
}

type EstimateGasResult = {
  maxFeePerGas: bigint | undefined;
  maxPriorityFeePerGas: bigint | undefined;
};

type GenerateEncodedDataFunctionResult = {
  receiver: string;
  methodName: string;
  merkleProof: string[];
};

const useTransaction = () => {
  const [transactionHash, setTransactionHash] = useState<string>('');
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>(
    TransactionStatus.idle
  );

  const estimateGas = async (chainId: CHAIN_ID): Promise<EstimateGasResult> => {
    const provider = selectProvider(chainId);

    const feeData = await provider.getFeeData();
    const maxFeePerGas = feeData.maxFeePerGas
      ? feeData.maxFeePerGas * BigInt(2)
      : undefined;
    const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas
      ? feeData.maxPriorityFeePerGas * BigInt(2)
      : undefined;

    return {
      maxFeePerGas,
      maxPriorityFeePerGas,
    };
  };

  const selectProvider = (chainId: CHAIN_ID): ethers.JsonRpcProvider => {
    let provider = undefined;

    switch (chainId) {
      case CHAIN_ID.scroll_mainnet:
        provider = new ethers.JsonRpcProvider(RPC.scoll_mainnet);
        break;
      case CHAIN_ID.scroll_sepolia:
        provider = new ethers.JsonRpcProvider(RPC.scroll_sepolia);
        break;
      case CHAIN_ID.sepolia_sepolia:
        provider = new ethers.JsonRpcProvider(RPC.sepolia_sepolia);
        break;
      default:
        provider = new ethers.JsonRpcProvider(RPC.scoll_mainnet);
    }

    return provider;
  };

  const generateEncodedFunctionData = ({
    receiver,
    methodName,
    merkleProof,
  }: GenerateEncodedDataFunctionResult): string => {
    const functionSelector = ethers
      .id(methodName + '(bytes32[],address)')
      .slice(0, 10);

    const abiCoder = new ethers.AbiCoder();

    const encodedParams = abiCoder.encode(
      ['bytes32[]', 'address'],
      [merkleProof, receiver]
    );

    return functionSelector + encodedParams.slice(2);
  };

  const sendTransaction = async ({
    chainId,
    privateKey,
    contractAddress,
    receiverAddress,
    methodName,
    merkleProof,
  }: SendTransactionArgs): Promise<ethers.TransactionReceipt | null> => {
    try {
      setTransactionStatus(TransactionStatus.pending);

      const provider = selectProvider(chainId);
      const wallet = new ethers.Wallet(privateKey, provider);

      const encodedData = generateEncodedFunctionData({
        receiver: receiverAddress,
        methodName,
        merkleProof,
      });

      const { maxFeePerGas, maxPriorityFeePerGas } = await estimateGas(chainId);

      const tx = {
        to: contractAddress,
        data: encodedData,
        gasLimit: 340000,
        maxFeePerGas,
        maxPriorityFeePerGas,
      };

      const transaction = await wallet.sendTransaction(tx);

      setTransactionHash(transaction.hash);
      setTransactionStatus(TransactionStatus.sent);

      const receipt = await provider.waitForTransaction(transaction.hash);

      const txWasSuccesfull = receipt?.status === 1;

      if (!txWasSuccesfull) {
        throw new Error('Something went wrong while consuming your secret');
      }

      setTransactionStatus(TransactionStatus.confirmed);

      return receipt;
    } catch (error: any) {
      throw error;
    } finally {
      setTransactionHash('');
      setTransactionStatus(TransactionStatus.idle);
    }
  };

  return { sendTransaction, transactionStatus, transactionHash };
};

export default useTransaction;
