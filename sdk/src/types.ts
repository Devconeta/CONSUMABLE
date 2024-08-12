import { StandardMerkleTreeData } from "@openzeppelin/merkle-tree/dist/standard";

export type MerkleProof = string[];

export enum ArgumentType {
    uint = "uint",
    address = "address",
    bytes = "bytes",
    int = "int"
}

export type MethodArgument = {
    name: string;
    type: ArgumentType;
}

export type ConsumableArguments = {
    privateKey: string;
    contractAddress: string;
    merkleProof: MerkleProof;
    methodName: string;
    methodArgs: MethodArgument[];
    chainId: number;
}

export type ConsumableDump = { tree: StandardMerkleTreeData<string[]>, pks: string[] }