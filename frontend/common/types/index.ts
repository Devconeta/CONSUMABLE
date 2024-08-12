export enum RPC {
  'scoll_mainnet' = 'https://rpc.scroll.io/',
  'scroll_sepolia' = 'https://sepolia-rpc.scroll.io/',
  'sepolia_sepolia' = 'https://ethereum-sepolia-rpc.publicnode.com/',
}

export enum CHAIN_NAME {
  'scroll_mainnet' = 'scroll_mainnet',
  'scroll_sepolia' = 'scroll_sepolia',
}

export enum CHAIN_ID {
  'scroll_mainnet' = 534352,
  'scroll_sepolia' = 534351,
  'sepolia_sepolia' = 11155111,
}

export enum TransactionStatus {
  idle = 'idle',
  pending = 'pending',
  sent = 'sent',
  confirmed = 'confirmed',
}
