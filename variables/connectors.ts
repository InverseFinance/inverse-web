import { initializeConnector } from '@web3-react/core';
import { WalletConnect as WalletConnectV2 } from '@web3-react/walletconnect-v2'
import { CoinbaseWallet } from '@web3-react/coinbase-wallet'
import { MetaMask } from '@web3-react/metamask'
import { GnosisSafe } from '@web3-react/gnosis-safe'

const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID!);

const mainChains = [CHAIN_ID];
const secondaryChains = [
  10,
  137,
  56,
  250,
  42161,
  43114,
];

export const [gnosisSafe, gnosisSafeHooks] = initializeConnector<GnosisSafe>((actions) => new GnosisSafe({ actions }))

export const [metamaskInjector, metamaskHooks] = initializeConnector<MetaMask>(
  (actions) => new MetaMask({ actions })
);

export const [walletConnectV2, walletConnectV2Hooks] = initializeConnector<WalletConnectV2>(
  actions =>
    new WalletConnectV2({
      bridge: 'https://safe-walletconnect.safe.global/',
      actions,
      options: {
        projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PID!,
        chains: mainChains,
        optionalChains: secondaryChains,        
        showQrModal: true,
      }
    })
);

export const [coinbaseWallet, coinbaseWalletHooks] = initializeConnector<CoinbaseWallet>(
  (actions) =>
    new CoinbaseWallet({
      actions,
      options: {
        url: "https://cloudflare-eth.com",
        appName: 'inverse-finance',
      },
    })
);