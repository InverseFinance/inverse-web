import { InjectedConnector } from '@web3-react/injected-connector';
import { WalletConnectConnector } from '@web3-react/walletconnect-connector';
import { WalletLinkConnector } from '@web3-react/walletlink-connector';

export const injectedConnector = new InjectedConnector({
    supportedChainIds: [
        1, // Mainnet
        3, // Ropsten
        4, // Rinkeby
        5, // Goerli
        42, // Kovan
    ],
})

export const walletConnectConnector = new WalletConnectConnector({
    rpc: {
        1: "https://cloudflare-eth.com"
    }
})

export const walletLinkConnector = new WalletLinkConnector({
    appName: process.env.NEXT_PUBLIC_TITLE!,
    appLogoUrl: process.env.NEXT_PUBLIC_LOGO_URL,
    url: 'https://cloudflare-eth.com',
    supportedChainIds: [1],
    darkMode: true,
})