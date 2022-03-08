import { InjectedConnector } from '@web3-react/injected-connector';
import { WalletConnectConnector } from '@web3-react/walletconnect-connector';
import { WalletLinkConnector } from '@web3-react/walletlink-connector';

const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID!);

export const injectedConnector = new InjectedConnector({
    supportedChainIds: [
        CHAIN_ID,
    ],
})

export const walletConnectConnector = new WalletConnectConnector({
    rpc: {
        [CHAIN_ID]: "https://cloudflare-eth.com"
    }
})

export const walletLinkConnector = new WalletLinkConnector({
    appName: process.env.NEXT_PUBLIC_TITLE!,
    appLogoUrl: process.env.NEXT_PUBLIC_LOGO_URL,
    url: 'https://cloudflare-eth.com',
    supportedChainIds: [CHAIN_ID],
    darkMode: true,
})