import { NetworkConfig, Network } from '@app/types'
import { EXTRA_CONFIG } from '@app/variables/extraConfig';
import { checkEnv } from '@app/util';

checkEnv();

const extraConfig = EXTRA_CONFIG[process.env.NEXT_PUBLIC_CHAIN_ID!] || {};

const envConfig: NetworkConfig = {
  chainId: process.env.NEXT_PUBLIC_CHAIN_ID,
  RTOKEN: process.env.NEXT_PUBLIC_REWARD_TOKEN,
  DOLA: process.env.NEXT_PUBLIC_DOLA,
  // if migrated
  XTOKEN_OLD: process.env.NEXT_PUBLIC_REWARD_STAKED_TOKEN_OLD || '',
  // new XTOKEN
  XTOKEN: process.env.NEXT_PUBLIC_REWARD_STAKED_TOKEN,
  anchor: {
    lens: process.env.NEXT_PUBLIC_ANCHOR_LENS,
    comptroller: process.env.NEXT_PUBLIC_ANCHOR_COMPTROLLER,
    oracle: process.env.NEXT_PUBLIC_ANCHOR_ORACLE,
    treasury: process.env.NEXT_PUBLIC_ANCHOR_TREASURY,
  },
  escrow_old: process.env.NEXT_PUBLIC_ANCHOR_ESCROW_OLD || '',
  escrow: process.env.NEXT_PUBLIC_ANCHOR_ESCROW,
  // outside Anchor Pro
  ...extraConfig,
}

const ftmConfig: NetworkConfig = {
  DOLA: '0x3129662808bEC728a27Ab6a6b9AFd3cBacA8A43c',
  INV: '0xb84527D59b6Ecb96F433029ECc890D4492C5dCe1',
}

export enum NETWORK_CODENAMES {
  ethereum = 'ethereum',
  ropsten = 'ropsten',
  kovan = 'kovan',
  rinkeby = 'rinkeby',
  goerli = 'goerli',
  bsc = 'bsc',
  bscTestnet = 'bscTestnet',
  polygon = 'polygon',
  polygonTestnet = 'polygonTestnet',
  heco = 'heco',
  hecoTestnet = 'hecoTestnet',
  avalanche = 'avalanche',
  optimism = 'optimism',
  arbitrum = 'arbitrum',
  fantom = 'fantom',
  harmony = 'harmony',
  celo = 'celo',
  moonriver = 'moonriver',
  ethftm = 'eth-ftm',
}

const networks: Network[] = [
  {
    id: '1',
    codename: NETWORK_CODENAMES.ethereum,
    name: 'Ethereum',
    coinSymbol: 'eth',
    isTestnet: false,
    isSupported: true,
    scan: 'https://etherscan.io',
    image: `/assets/networks/${NETWORK_CODENAMES.ethereum}.png`,
  },
  {
    id: '31337',
    codename: NETWORK_CODENAMES.ethereum,
    name: 'Localhost',
    coinSymbol: 'eth',
    isTestnet: false,
    isSupported: true,
    scan: 'https://etherscan.io',
    image: `/assets/networks/${NETWORK_CODENAMES.ethereum}.png`,
  },
  {
    id: '3',
    codename: NETWORK_CODENAMES.ropsten,
    name: 'Ropsten',
    coinSymbol: 'eth',
    isTestnet: true,
    isSupported: false,
    image: `/assets/networks/${NETWORK_CODENAMES.ethereum}.png`,
  },
  {
    id: '42',
    codename: NETWORK_CODENAMES.kovan,
    name: 'Kovan',
    coinSymbol: 'eth',
    isTestnet: true,
    isSupported: false,
    image: `/assets/networks/${NETWORK_CODENAMES.ethereum}.png`,
  },
  {
    id: '4',
    codename: NETWORK_CODENAMES.rinkeby,
    name: 'Rinkeby',
    coinSymbol: 'eth',
    isTestnet: true,
    isSupported: true,
    image: `/assets/networks/${NETWORK_CODENAMES.ethereum}.png`,
  },
  {
    id: '5',
    codename: NETWORK_CODENAMES.goerli,
    name: 'Goerli',
    coinSymbol: 'eth',
    isTestnet: true,
    isSupported: true,
    scan: 'https://goerli.etherscan.io',
    image: `/assets/networks/${NETWORK_CODENAMES.ethereum}.png`,
  },
  {
    id: '56',
    codename: NETWORK_CODENAMES.bsc,
    name: 'BSC',
    coinSymbol: 'bnb',
    isTestnet: false,
    isSupported: false,
    image: `/assets/networks/${NETWORK_CODENAMES.bsc}.png`,
  },
  {
    id: '97',
    codename: NETWORK_CODENAMES.bscTestnet,
    name: 'BSC testnet',
    coinSymbol: 'bnb',
    isTestnet: true,
    isSupported: false,
  },
  {
    id: '137',
    codename: NETWORK_CODENAMES.polygon,
    name: 'Polygon',
    coinSymbol: 'matic',
    isTestnet: false,
    isSupported: false,
  },
  {
    id: '80001',
    codename: NETWORK_CODENAMES.polygonTestnet,
    name: 'Polygon Testnet',
    coinSymbol: 'matic',
    isTestnet: true,
    isSupported: false,
  },
  {
    id: '128',
    codename: NETWORK_CODENAMES.heco,
    name: 'HECO',
    coinSymbol: 'ht',
    isTestnet: false,
    isSupported: false,
  },
  {
    id: '256',
    codename: NETWORK_CODENAMES.hecoTestnet,
    name: 'HECO',
    coinSymbol: 'ht',
    isTestnet: true,
    isSupported: false,
  },
  {
    id: '43114',
    codename: NETWORK_CODENAMES.avalanche,
    name: 'Avalanche',
    coinSymbol: 'avax',
    isTestnet: false,
    isSupported: false,
  },
  {
    id: '10',
    codename: NETWORK_CODENAMES.optimism,
    name: 'Optimism',
    coinSymbol: 'eth',
    isTestnet: false,
    isSupported: false,
    image: `/assets/networks/${NETWORK_CODENAMES.optimism}.svg`,
    scan: 'https://optimistic.etherscan.io',
  },
  {
    id: '42161',
    codename: NETWORK_CODENAMES.arbitrum,
    name: 'Arbitrum One',
    coinSymbol: 'eth',
    isTestnet: false,
    isSupported: false,
    image: `/assets/networks/${NETWORK_CODENAMES.arbitrum}.png`,
  },
  {
    id: '250',
    codename: NETWORK_CODENAMES.fantom,
    config: ftmConfig,
    name: 'Fantom',
    coinSymbol: 'ftm',
    isTestnet: false,
    isSupported: false,
    scan: 'https://ftmscan.com',
    image: `/assets/networks/${NETWORK_CODENAMES.fantom}.webp`,
  },
  {
    id: '1666600000',
    codename: NETWORK_CODENAMES.harmony,
    name: 'Harmony',
    coinSymbol: 'one',
    isTestnet: false,
    isSupported: false,
  },
  {
    id: '42220',
    codename: NETWORK_CODENAMES.celo,
    name: 'Celo',
    coinSymbol: 'celo',
    isTestnet: false,
    isSupported: false,
  },
  {
    id: '1285',
    codename: NETWORK_CODENAMES.moonriver,
    name: 'Moonriver',
    coinSymbol: 'movr',
    isTestnet: false,
    isSupported: false,
  },
  // "x-chains"
  {
    id: '1-250',
    codename: NETWORK_CODENAMES.ethftm,
    name: 'Eth-Ftm',
    coinSymbol: 'Eth-Ftm',
    isTestnet: false,
    isSupported: false,
    image: `/assets/networks/${NETWORK_CODENAMES.ethftm}.webp`,
  },
];

networks[networks.findIndex(net => net.id === envConfig.chainId)].config = envConfig;
if(envConfig.chainId === '31337'){
  networks[networks.findIndex(net => net.id === '1')].config = { ...envConfig, chainId: '1' };
}

export const NETWORKS = networks;
export const NETWORKS_BY_CHAIN_ID = networks.reduce((prev, curr) => ({ ...prev, [curr.id]: curr }), {});
