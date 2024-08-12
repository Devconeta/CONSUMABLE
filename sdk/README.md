# Consumable

## Introduction

Consumables are a new way to interact with Smart Contracts. They enable the creation of on-chain one-time secrets that are resistant to front-running and can be consumed against any EVM function, in a secure and privacy-enhancing manner.

## Motivation

Protecting smart contract function executions with secure passwords unlocks many different and new use cases, like linking secrets to physical products for claiming originality certificates (NFTS) , giving away vouchers for expending tokens, and even anonymous voting.

The use of cryptographic secure passwords to protect smart contract function executions unlocks various new use cases, including:

- Linking one-time claiming secrets to physical products via QR's for originality certificates (NFTs).
- Distributing vouchers for one-time payments.
- Enabling anonymous voting mechanisms by delivering one-time voting vouchers.

## Consumable SDK

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

## Proof of Concept

- [Website URL](https://consumable-poc-etharg.vercel.app/consume)

## Related Repositories

- [Consumable Contracts](https://github.com/Devconeta/CONSUMABLE-contracts)
- [Consumable Frontend](https://github.com/Devconeta/CONSUMABLE-frontend)

## License

This project is licensed under the MIT License.
