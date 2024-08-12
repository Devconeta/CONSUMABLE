# Consumable


Consumables are a new way to interact with Smart Contracts, secure and front-running-resistant secrets that can be consumed/exchanged against Smart Contracts for execution, in a safe and privacy-enhancing manner.


## Motivation

Guarding smart contract functions with cryptographic secrets unlocks many different new use cases, and provides enhanced decentralization for others already operating in the industry.

Consumables truly bright every time you need to authorize a user or group of users to execute without needing to know their address beforehand.


- Generating decentralized claiming secrets for your NFT collection.
- Generating gift-cards that don't need a centralized backend authorizing their consumption/exchange.
- Authorization for one-time payments/withdrawals.
- Anonymous voting, using secrets as voting vouchers.

You can deliver optionally pre-funded secrets or "execution rights" to your users, digitally or physically, and they can consume them in one click on a facilitator interface to execute the underlying authorized function.


&nbsp;


## Technical Introduction

Think of Consumables as one-time granular permissions for executing on-chain actions. 

To achieve privacy and front-running resistance on any public-storage and public-mempool blockchain, instead of sending cryptographic derivates of the secret such as hashes, encryptions, or even zero-knowledge proofs, which are still front-runneable, we are proposing a workaround to implement secrets on the "sender" part of the transaction instead of the "parameters".

For our implementation, we provide:
- An open-source SDK for secure secret generation on your end.
- A standard "Consumable" contract for guarding functions with secrets inspired by OpenZeppelin's Ownable.
- A proposed structure for base64 encoded secrets that strongly facilitates consumption.
- An optional frontend that facilitates execution (and soon generation for non-technicals), but you can implement your consuming interface that better fits your use-case. (Even into your product?)


&nbsp;


## Main Components

### Consumable SDK

https://www.npmjs.com/package/consumable-sdk

The **Consumable SDK** is an open-source toolkit that can be installed via npm. It provides utilities to generate and manage secrets for Consumable-compatible smart contracts.

**Installation:**

```bash
npm install -g consumable-sdk
```

**CLI Commands:**

- **Generate Wallets:**
  ```bash
  generateWallets <amount> [outputDir]
  ```
- **Generate Secrets:**
  ```bash
  generateSecrets <inputDir> <chainId> <contractAddress> <methodSignature>
  ```
- **Fund Wallets:**
  ```bash
  fundWallets <dumpFilename> <funderPrivateKey> <chainId> <rpcUrl> <amount>
  ```


&nbsp;


### Consumable Smart Contract

The **Consumable.sol** contract is an abstract, inheritable contract inspired by OpenZeppelin's Ownable.sol. It provides utilities such as a "onlyConsumer" modifier for guarding your project functions with consumable secrets.

**Key Features:**

- **merkleRoot state**
- **onlyConsumer modifier**
- **isValidConsumer function**
- **consumerHasNotExceededTotalUses function**

**Contract Interface:**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

abstract contract Consumable {
   bytes32 public merkleRoot;
   uint256 public totalUsesPerConsumer;
   mapping(address => uint256) public userConsumptions;

   constructor(bytes32 _merkleRoot, uint256 _totalUsesPerConsumer) {
       merkleRoot = _merkleRoot;
       totalUsesPerConsumer = _totalUsesPerConsumer;
   }

   modifier onlyConsumer(bytes32[] calldata _merkleProof) {
       _checkConsumer(_merkleProof);
       _;
   }

   function _checkConsumer(bytes32[] calldata _merkleProof) internal virtual {
       require(isValidConsumer(_merkleProof), "Not a valid consumer");
       require(consumerHasNotExceededTotalUses(), "Consumer has exceeded total uses");
       _incrementConsumerComsumptions();
   }

   function isValidConsumer(bytes32[] calldata _merkleProof) public view returns (bool) {
       bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(msg.sender))));
       return MerkleProof.verify(_merkleProof, merkleRoot, leaf);
   }

   function consumerHasNotExceededTotalUses() public view returns (bool) {
       return userConsumptions[msg.sender] < totalUsesPerConsumer;
   }

   function _incrementConsumerComsumptions() internal {
       userConsumptions[msg.sender]++;
   }
}
```


&nbsp;


## Consumable Structure Proposal and Workflow

To facilitate consumption and onboarding for web2 users, we propose a standard structure of {secret + domainInfo + merkleProof} which is then encoded into base64 and delivered in the form of links, QR codes, or NFC tags.

This way, any frontend interface or electronic device with internet access can decode the consumables and execute the transaction, knowing exactly where, how, and which parameters to input. To facilitate execution even more, we are also encoding the Merkle Proof into the base64 consumable structure.


### Proposed structure

- **First bytes:** The secret itself.
- **Secret Metadata/Domain Info:** Chain ID, Contract Address, Function Signature, and Merkle Proof.
- **Merkle Proof:** The Merkle proof of your secret to be verified on the Smart Contract.

### Example

**Encoded:**

```
eyJwcml2YXRlS2V5IjoiMH2YoiMH2XRlS2V51…
```

**Decoded:**

```json
{
  "privateKey": "0xb29893e4eb890469cbec39e2e5c2c21dd69c1bb1531898f4d6e8647fb9e015d2",
  "chainId": 1,
  "contractAddress": "0xdac17f958d2ee523a2206206994597c13d831ec7",
  "methodName": "exchangeVoucher",
  "methodArgs": [
    {
      "name": "merkleProof",
      "type": "bytes32[]"
    },
    {
      "name": "receiver",
      "type": "address"
    }
  ],
  "merkleProof": [
    "0xdd4c045b7c151349b25761a8c9e1fe9afba612f1f3e2378c3a8aae14cb7cb999",
    "0x26e9aa225cf060397da6327643370fd03919b3069fe3823394b0bcc7bc077f25"
  ]
}
```

The public part of the secrets is super-efficiently compressed into the Consumable contracts via Merkle Trees and verified at the consumption execution using OpenZeppelin's MerkleProof library.\


&nbsp;


## Simple Use-Case Example: Consumable Vault

A simple example use-case of on-chain secrets is the **Consumable Vault**. This vault can hold ERC20 tokens, and consumables can generate withdrawal secrets or vouchers against it.

**Vault Contract Example:**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../Consumable.sol";

contract Vault is Ownable, Consumable {
   address public tokenAddress;
   uint256 public voucherValue;

   constructor(
       bytes32 _merkleRoot,
       uint256 _totalUsesPerConsumer,
       address _tokenAddress,
       uint256 _voucherValue
   ) Consumable(_merkleRoot, _totalUsesPerConsumer) Ownable(msg.sender) {
       tokenAddress = _tokenAddress;
       voucherValue = _voucherValue;
   }

   function ownerWithdraw(address _token, uint256 _amount) external onlyOwner {
       IERC20(_token).transfer(msg.sender, _amount);
   }

   function consumeSecret(
       bytes32[] calldata _merkleProof,
       address receiver
   ) external onlyConsumer(_merkleProof) {
       IERC20(tokenAddress).transfer(receiver, voucherValue);
   }
}
```


&nbsp;


## Additional Use Cases for On-Chain Secrets/Consumables

Here are a few ideas for projects that can be built on top of Consumable:

- **Gift Cards:** Issue digital gift cards that can be redeemed through a one-time use secret. This allows for secure and private gifting of tokens or other assets.
- **One-Time Payments:** Create secure one-time payment solutions where the recipient can claim funds/expend using a secret, ensuring that the payment can only be redeemed once and preventing unauthorized access.

- **Delivering NFTs:** Enable the delivery of NFTs to recipients who may not yet have a wallet or whose wallet address is unknown. The secret can be used by the recipient to claim the NFT at a later time.

- **2FA Authenticator:** Implement two-factor authentication (2FA) for sensitive smart contract functions using secrets. The 2FA secret would be consumed during the transaction, adding an additional layer of security.

- **Anonymous Voting:** Facilitate anonymous voting on-chain by issuing unique voting tokens or permissions via secrets, ensuring that each participant can vote only once without revealing their identity.


&nbsp;



## Roadmap

- Enhance frontend to enable non-technicals to generate secrets directly on the browser client, getting links/QR's to distribute digitally or physically.
- Develop Contract extensions for the main Consumable contract to support more use cases.
- Create complete examples of implementations and full documentation.
- If the project gets enough traction, formalize an EIP for the standardization and adoption of consumables.



&nbsp;


## POC frontend for consumption

- [Website URL](https://consumable-poc-etharg.vercel.app/consume)

## Related Repositories

- [Consumable SDK](https://github.com/Devconeta/CONSUMABLE-sdk)
- [Consumable Contracts](https://github.com/Devconeta/CONSUMABLE-contracts)
- [Consumable Frontend](https://github.com/Devconeta/CONSUMABLE-frontend)

## License

This project is licensed under the MIT License.
