# Consumable

## Introduction

Consumables are a new way to interact with Smart Contracts. They enable the creation of on-chain one-time secrets that are resistant to front-running and can be consumed against any EVM function, in a secure and privacy-enhancing manner.

## Motivation

Protecting smart contract function executions with secure passwords unlocks many different and new use cases, like linking secrets to physical products for claiming originality certificates (NFTS) , giving away vouchers for expending tokens, and even anonymous voting.

The use of cryptographic secure passwords to protect smart contract function executions unlocks various new use cases, including:

- Linking one-time claiming secrets to physical products via QR's for originality certificates (NFTs).
- Distributing vouchers for one-time payments.
- Enabling anonymous voting mechanisms by delivering one-time voting vouchers.

## Consumable Smart Contract Standard

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
    require(
      consumerHasNotExceededTotalUses(),
      "Consumer has exceeded total uses"
    );
    _incrementConsumerComsumptions();
  }

  function isValidConsumer(
    bytes32[] calldata _merkleProof
  ) public view returns (bool) {
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

## Secret Structure and Workflow

A typical transaction consists of the sender, parameters, and transaction configuration (e.g., gas settings). However, sending secrets or even their hashes directly as parameters is vulnerable to front-running on a public mempool.

### Solution

To address this, our solution generates secrets as funded and ready-to-use private keys. In addition, to facilitate use, we include "Secrets Metadata", which includes useful data such as the contract address and function to be called, so any frontend can execute and consume in one click.

- **First 20 bytes:** The secret itself.
- **Followed by Secret Metadata:** Chain ID, Contract Address, Function Signature, and Merkle Proof.

## Proof of Concept

- [Website URL](https://consumable-poc-etharg.vercel.app/consume)

## Related Repositories

- [Consumable SDK](https://github.com/Devconeta/CONSUMABLE-sdk)
- [Consumable Frontend](https://github.com/Devconeta/CONSUMABLE-frontend)

## License

This project is licensed under the MIT License.
