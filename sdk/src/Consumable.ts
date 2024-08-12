import { ConsumableArguments } from "./types";

export class Consumable {
  private readonly base64Secret: string;

  constructor(base64Secret: string) {
    this.base64Secret = base64Secret;
  }

  public consume(): ConsumableArguments {
    const { privateKey, contractAddress, merkleProof, methodName, methodArgs, chainId } = JSON.parse(Buffer.from(this.base64Secret, 'base64').toString('utf-8')) as ConsumableArguments;

    return {
      contractAddress,
      chainId,
      methodName,
      methodArgs,
      merkleProof,
      privateKey,
    }
  }
}