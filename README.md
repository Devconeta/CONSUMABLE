
# Consumable 

## Introduction

Consumables are a new way to interact with Smart Contracts. They enable the creation of on-chain one-time secrets that are resistant to front-running and can be consumed against any EVM function, in a secure and privacy-enhancing manner.

## Motivation

Protecting smart contract function executions with secure passwords unlocks many different and new use cases, like linking secrets to physical products for claiming originality certificates (NFTS) , giving away vouchers for expending tokens, and even anonymous voting. 

The use of cryptographic secure passwords to protect smart contract function executions unlocks various new use cases, including:
- Linking one-time claiming secrets to physical products via QR's for originality certificates (NFTs).
- Distributing vouchers for one-time payments.
- Enabling anonymous voting mechanisms by delivering one-time voting vouchers.

## Main Components

### Consumable SDK

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

### Consumable Smart Contract Standard

The **Consumable.sol** contract is an abstract, inheritable contract inspired by OpenZeppelin's Ownable.sol. It provides utilities for managing valid cryptographic consumers with consumable secrets.

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

## Secret Structure and Workflow

A typical transaction consists of the sender, parameters, and transaction configuration (e.g., gas settings). However, sending secrets or even their hashes directly as parameters is vulnerable to front-running on a public mempool.

### Solution

To address this, our solution generates secrets as funded and ready-to-use private keys. In addition, to facilitate use, we include "Secrets Metadata", which includes useful data such as the contract address and function to be called, so any frontend can execute and consume in one click.

- **First 20 bytes:** The secret itself.
- **Followed by Secret Metadata:** Chain ID, Contract Address, Function Signature, and Merkle Proof.

### Example

**Encoded:**
```
eyJwcml2YXRlS2V5IjoiMH2YXRlS2V51…
```

**Decoded:**
```json
{
    "privateKey": "0xb29893e4eb890469cbec39e2e5c2c21dd69c1bb1531898f4d6e8647fb9e015d2",
    "chainId": 1,
    "contractAddress": "0x01",
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

The private keys are efficiently compressed into the Consumable contracts via Merkle Trees and verified at the time of consumption using OpenZeppelin's MerkleProof.
In addition, we generate this encoded secrets including the metadata of the secret

## Use-Case Example: Consumable Vault

One example use-case of on-chain secrets is the **Consumable Vault**. This vault can hold ERC20 tokens, and consumables can generate withdrawal secrets or vouchers against it. 

### Example Scenario:

A user could generate withdrawal secrets before going on a travel, allowing limited token withdrawals just in case he faces an emergency and needs some money, but without exposing their private key. If in the worst-case the secret gets compromised, the user would only lose the amount tied to that secret, and it can only be consumed once.

**Vault Contract Example:**
```solidity
// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../Consumable.sol";

/* My Vault holds 1000 tokens, and each one-time secret can withdraw 100 tokens (value set at constructor) */
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


## Additional Use Cases for On-Chain Secrets/Consumables

Here are a few ideas for projects that can be built on top of Consumable:

- **Gift Cards:** Issue digital gift cards that can be redeemed through a one-time use secret. This allows for secure and private gifting of tokens or other assets.
  
- **One-Time Payments:** Create secure one-time payment solutions where the recipient can claim funds using a secret, ensuring that the payment can only be redeemed once and preventing unauthorized access.

- **Delivering NFTs:** Enable the delivery of NFTs to recipients who may not yet have a wallet or whose wallet address is unknown. The secret can be used by the recipient to claim the NFT at a later time.

- **2FA Authenticator:** Implement two-factor authentication (2FA) for sensitive smart contract functions using secrets. The 2FA secret would be consumed during the transaction, adding an additional layer of security.

- **Anonymous Voting:** Facilitate anonymous voting on-chain by issuing unique voting tokens or permissions via secrets, ensuring that each participant can vote only once without revealing their identity.


## Related Repositories

- [Consumable SDK](https://github.com/Devconeta/CONSUMABLE-sdk)
- [Consumable Contracts](https://github.com/Devconeta/CONSUMABLE-contracts)
- [Consumable Frontend](https://github.com/Devconeta/CONSUMABLE-frontend)

## License

This project is licensed under the MIT License.
