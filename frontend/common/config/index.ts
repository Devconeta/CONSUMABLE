import { CHAIN_ID, CHAIN_NAME, RPC } from '../types';

export const CHAIN_NETWORK = {
  [CHAIN_NAME.scroll_mainnet]: {
    chainId: CHAIN_ID.scroll_mainnet,
    rpcUrl: RPC.scoll_mainnet,
  },
  [CHAIN_NAME.scroll_sepolia]: {
    chainId: CHAIN_ID.scroll_sepolia,
    rpcUrl: RPC.scroll_sepolia,
  },
};
