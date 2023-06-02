import { InjectedConnector } from '@web3-react/injected-connector';
import { WalletConnectConnector } from '@web3-react/walletconnect-connector';
import { WalletLinkConnector } from '@web3-react/walletlink-connector';

const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID!);

const mainChains = [CHAIN_ID];
const swapChains = [
    1,
    10,
    157,
    56,
    250,
    42161,
    43114,
];

export const injectedConnector = new InjectedConnector({
    supportedChainIds: [
        ...mainChains,
        31337,
    ],
});

export const swapInjectedConnector = new InjectedConnector({
    supportedChainIds: [
        ...swapChains,
        31337,
    ],
})

export const walletConnectConnector = new WalletConnectConnector({
    rpc: {
        [1]: "https://cloudflare-eth.com",
        [250]: "https://rpc.ftm.tools",
        [10]: "https://rpc.ankr.com/optimism",
        [56]: "https://bsc-dataseed3.binance.org",
        [42161]: "https://arb1.arbitrum.io/rpc",
        [137]: "https://polygon.llamarpc.com",
        [43114]: "https://rpc.ankr.com/avalanche",
    }
})

export const swapWalletConnectConnector = new WalletConnectConnector({
    rpc: {
        [1]: "https://cloudflare-eth.com",
    }
})

export const walletLinkConnector = new WalletLinkConnector({
    appName: process.env.NEXT_PUBLIC_TITLE!,
    appLogoUrl: process.env.NEXT_PUBLIC_LOGO_URL,
    url: 'https://cloudflare-eth.com',
    supportedChainIds: mainChains,
    darkMode: true,
})

export const swapWalletLinkConnector = new WalletLinkConnector({
    appName: process.env.NEXT_PUBLIC_TITLE!,
    appLogoUrl: process.env.NEXT_PUBLIC_LOGO_URL,
    url: 'https://cloudflare-eth.com',
    supportedChainIds: swapChains,
    darkMode: true,
})