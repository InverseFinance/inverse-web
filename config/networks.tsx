import { NetworkConfig, Network, NetworkIds, TokenList, Vaults, VaultTree } from '@inverse/types'
import { OLD_XINV } from './constants';

const mainnetConfig: NetworkConfig = {
  chainId: '1',
  INV: '0x41D5D79431A913C4aE7d69a668ecdfE5fF9DFB68',
  DOLA: '0x865377367054516e17014CcdED1e7d814EDC9ce4',
  DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  USDT: '0xdac17f958d2ee523a2206206994597c13d831ec7',
  WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  YFI: '0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e',
  XSUSHI: '0x8798249c2E607446EfB7Ad49eC89dD1865Ff4272',
  WBTC: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
  STETH: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84',
  INVDOLASLP: '0x5BA61c0a8c4DccCc200cd0ccC40a5725a426d002',
  DOLA3POOLCRV: '0xAA5A67c256e27A5d80712c51971408db3370927D',
  THREECRV: '0x6c3f90f043a72fa612cbac8115ee7e52bde6e490',
  FLOKI: '0x43f11c02439e2736800433b4594994Bd43Cd066D',
  DOLA_PAYROLL: '0x32edDd879B199503c6Fc37DF95b8920Cd415358F',
  // old XINV
  XINV_V1: OLD_XINV,
  // new XINV
  XINV: '0x1637e4e9941D55703a7A5E7807d6aDA3f7DCD61B',
  vaults: {
    vaultUsdcEth: '0x89eC5dF87a5186A0F0fa8Cb84EdD815de6047357',
    vaultDaiWbtc: '0xc8f2E91dC9d198edEd1b2778F6f2a7fd5bBeac34',
    vaultDaiYfi: '0x41D079ce7282d49bf4888C71B5D9E4A02c371F9B',
    vaultDaiEth: '0x2dCdCA085af2E258654e47204e483127E0D8b277',
  },
  anchor: {
    lens: '0xd513d22422a3062Bd342Ae374b4b9c20E0a9a074',
    comptroller: '0x4dCf7407AE5C07f8681e1659f626E114A7667339',
    oracle: '0xE8929AFd47064EfD36A7fB51dA3F8C5eb40c4cb4',
    stabilizer: '0x7eC0D931AFFBa01b77711C2cD07c76B970795CDd',
    treasury: '0x926df14a23be491164dcf93f4c468a50ef659d5b',
    anEthRepayAll: '0xbE0C9650cf8Ce5279b990e7A6634c63323adfEAE',
    markets: {
      dola: '0x7Fcb7DAC61eE35b3D4a51117A7c58D53f0a8a670',
      eth: '0x697b4acAa24430F254224eB794d2a85ba1Fa1FB8',
      wbtc: '0x17786f3813E6bA35343211bd8Fe18EC4de14F28b',
      xsushi: '0xD60B06B457bFf7fc38AC5E7eCE2b5ad16B288326',
      yfi: '0xde2af899040536884e062D3a334F2dD36F34b4a4',
      steth: '0xA978D807614c3BFB0f90bC282019B2898c617880',
      dola3poolcrv: '0xc528b0571D0BE4153AEb8DdB8cCeEE63C3Dd7760',
      invdolaslp: '0x4B228D99B9E5BeD831b8D7D2BCc88882279A16BB',
      floki: '0x0BC08f2433965eA88D977d7bFdED0917f3a0F60B',
    },
  },
  escrow_v1: '0xfD5eB01AedA9dD5449eFdE2CD6D978D15F5c15B6',
  escrow: '0x44814bf90ea659369a28633c3bd46ab52d8f73f7',
  harvester: '0xb677e5c5cbc42c25bff9578dda2959adb7eecc96',
  // governance alpha (old)
  governanceAlpha: '0x35d9f4953748b318f18c30634bA299b237eeDfff',
  // governance mills (old mills)
  // governance: '0xeF3bD8cA3beAC259D898b2C546F804B49D52e2FD',
  // governance mills (new mills)
  governance: '0xBeCCB6bb0aa4ab551966A7E4B97cec74bb359Bf6',
  // multiDelegator
  multiDelegator: '0x1ba87bE4C20Fa2d4cbD8e4Ae9998649226207F76',
  namedAddresses: {
    '0x926dF14a23BE491164dCF93f4c468A50ef659D5B': 'Treasury',
    '0x41D5D79431A913C4aE7d69a668ecdfE5fF9DFB68': 'INV',
    '0x1637e4e9941D55703a7A5E7807d6aDA3f7DCD61B': 'xINV',
    '0x44814bf90ea659369a28633c3bd46ab52d8f73f7': 'Escrow',
    '0x43f11c02439e2736800433b4594994Bd43Cd066D': 'FLOKI',
    '0x0000000000000000000000000000000000000000': 'Burn address',
    '0x3FcB35a1CbFB6007f9BC638D388958Bc4550cB28': 'Deployer',
    '0x7165ac4008c3603AfE432787419eB61B3a2CEe8B': 'BenLavabo',
    '0x4db09171350Be4f317a67223825abeCC65482E32': 'Mr Brown Whale',
    '0x2f80E5163A7A774038753593010173322eA6f9fe': 'Alan',
    '0x724F321C4efeD5e3C7CcA40168610c258c82d02F': 'Somer',
    '0x46B14628fFBC01a87AB2d66e95600b8dC4A49Ce2': 'Keen',
    '0x23E01e05AA1376FA3AC83C954816B967A7302891': 'zombiehobbes',
    '0x575F5b61D3e5a011080A0Df0865b81f2352DB83b': 'adamQ',
    '0x00A5af2D7DA07dF76073A6f478f0fB4942D2659a': 'cs',
    '0x7705E47BD6Eb6Dc5a11aA1839639F3Dc6E1a6EaF': 'DefiChad',
    '0x2492897E6138ae7E56D3d3ceB5AD76B801ec7d3f': 'ees2oo',
    '0xB12bc4A0c497F1C3BaEe7031c5bfD119ECc0c906': 'goldenandy73',
    '0xfe97B38192Cb30aDD0bBe5e01E6a617562CC8318': 'Key',
    '0x99f18ae1543A2B952180AAe9DbFBC3c594D14293': 'Block Dance',
    '0xD72B03B7F2E0b8D92b868E73e12b1f888BEFBeDA': 'Longinverse',
    '0x7eC0D931AFFBa01b77711C2cD07c76B970795CDd': 'Stabilizer',
    '0x5c1245F9dB3f8f7Fe1208cB82325eA88fC11Fe89': 'ETHDOLAStakingPool',
    '0x08D816526BdC9d077DD685Bd9FA49F58A5Ab8e48': 'Kiwi',
    '0xE8929AFd47064EfD36A7fB51dA3F8C5eb40c4cb4': 'Oracle',
    '0x4dCf7407AE5C07f8681e1659f626E114A7667339': 'Comptroller',
    '0xb9F43E250dadf6b61872307396AD1b8bEBa27bCD': 'BasedXeno',
    '0x34A7a276eD77c6FE866c75Bbc8d79127c4E14a09': 'TheAlienTourist',
    '0xE58ED128325A33afD08e90187dB0640619819413': 'PatB',
  },
}

// TODO: fill in all values
const rinkebyConfig: NetworkConfig = {
  chainId: '4',
  INV: '0xA11f04EFa86C3b32680dC9C2b9D43889E2B8136c',
  DOLA: '0x6aD54830912d2dDe3249C1D709E8822cbA4032Ac',
  DAI: '0x5592ec0cfb4dbc12d3ab100b257153436a1f0fea',
  USDC: '',
  WETH: '0xc778417e063141139fce010982780140aa0cd5ab',
  YFI: '',
  XSUSHI: '',
  WBTC: '0x577D296678535e4903D59A4C929B718e1D575e0A',
  XINV_V1: '',
  XINV: '0xF5aba76aEc7dbBF8B8Ca9a8F7D93aB31EcB157F2',
  STETH: '',
  INVDOLASLP: '',
  DOLA3POOLCRV: '',
  THREECRV: '',
  FLOKI: '',
  escrow_v1: '',
  escrow: '',
  harvester: '0x6dE45B9a80847Ce6Fd53819bA31cf296Ecc346bC',
  governance: '0x7aC5048dcD9a0C31Bb4D539deFdc2af0E0486753',
  vaults: {
    vaultUsdcEth: '',
    vaultDaiWbtc: '',
    vaultDaiYfi: '',
    vaultDaiEth: '0xC5e43BADAb90AB57CDe5D7c201EDdaFCB03Ba8c8',
  },
  anchor: {
    lens: '',
    comptroller: '0xa92C7168D0304d8463CA1805E614E4Cd8c476505',
    oracle: '0x4ff3e3b2d1962fc1386af53216e6ea6f013a420c',
    stabilizer: '',
    treasury: '',
    anEthRepayAll: '',
    markets: {
      dola: '0x7ddAabe73e48FEAE7AE28245609cE26580dF4130',
      eth: '0xd47579Dd1e6a45dF9354912E17AA33A56119508D',
      wbtc: '0x68B63F072FEBc9FF29065Cf06f34FfC79f66199c',
      xsushi: '',
      yfi: '',
      steth: '',
      dola3poolcrv: '',
      invdolaslp: '',
      floki: '',
    },
  },
  namedAddresses: {},
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
}

export const NETWORKS: Network[] = [
  {
    id: '1',
    codename: NETWORK_CODENAMES.ethereum,
    name: 'Ethereum',
    coinSymbol: 'eth',
    isTestnet: false,
    isSupported: true,
    scan: 'https://etherscan.io',
    // bgColor: '',
    config: mainnetConfig,
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
    config: rinkebyConfig,
    image: `/assets/networks/${NETWORK_CODENAMES.ethereum}.png`,
  },
  {
    id: '5',
    codename: NETWORK_CODENAMES.goerli,
    name: 'Goerli',
    coinSymbol: 'eth',
    isTestnet: true,
    isSupported: false,
    image: `/assets/networks/${NETWORK_CODENAMES.ethereum}.png`,
  },
  {
    id: '56',
    codename: NETWORK_CODENAMES.bsc,
    name: 'BSC',
    coinSymbol: 'bnb',
    isTestnet: false,
    isSupported: false,
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
  },
  {
    id: '42161',
    codename: NETWORK_CODENAMES.arbitrum,
    name: 'Arbitrum One',
    coinSymbol: 'eth',
    isTestnet: false,
    isSupported: false,
  },
  {
    id: '250',
    codename: NETWORK_CODENAMES.fantom,
    name: 'Fantom',
    coinSymbol: 'ftm',
    isTestnet: false,
    isSupported: false,
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
];

export const getNetworkImage = (chainId: string) => {
  const { image, codename } = getNetwork(chainId);
  return image || `/assets/networks/${codename}.png`;
}

export const isSupportedNetwork = (chainId?: string | number): boolean => {
  return !!chainId && !!getNetwork(chainId)?.isSupported;
}

export const getNetwork = (chainId: string | number): Network => {
  return NETWORKS.find(network => network.id === chainId?.toString())
    || {
    name: 'Unknown',
    id: chainId?.toString(),
    codename: 'unknown',
    coinSymbol: '',
  };
}

export const getNetworkConfig = (chainId: string | number, returnMainIfUnsupported = false): NetworkConfig | undefined => {
  const chainIdToGet = !isSupportedNetwork(chainId) && returnMainIfUnsupported ? NetworkIds.mainnet : chainId;
  const network = getNetwork(chainIdToGet);
  return network?.config;
}

export const getNetworks = (): Network[] => NETWORKS;
export const getSupportedNetworks = (): Network[] => NETWORKS.filter(network => network.isSupported);

export const getNetworkConfigConstants = (
  configOrChainId: NetworkConfig | string | number = NetworkIds.mainnet,
) => {
  const config = typeof configOrChainId === 'string' || typeof configOrChainId === 'number' ?
    getNetworkConfig(configOrChainId, true)! :
    isSupportedNetwork(configOrChainId.chainId) ?
      configOrChainId : getNetworkConfig(NetworkIds.mainnet)!;

  // Vaults
  const VAULT_USDC_ETH = config.vaults.vaultUsdcEth;
  const VAULT_DAI_WBTC = config.vaults.vaultDaiWbtc;
  const VAULT_DAI_YFI = config.vaults.vaultDaiYfi;
  const VAULT_DAI_ETH = config.vaults.vaultDaiEth;
  const VAULT_TOKENS = Object.values(config.vaults);

  // Anchor
  const LENS = config.anchor.lens;
  const COMPTROLLER = config.anchor.comptroller;
  const ORACLE = config.anchor.oracle;
  const STABILIZER = config.anchor.stabilizer;
  const TREASURY = config.anchor.treasury;
  const AN_ETH_REPAY_ALL = config.anchor.anEthRepayAll;

  const ANCHOR_ETH = config.anchor.markets.eth;
  const ANCHOR_DOLA = config.anchor.markets.dola;
  const ANCHOR_XSUSHI = config.anchor.markets.xsushi;
  const ANCHOR_WBTC = config.anchor.markets.wbtc;
  const ANCHOR_YFI = config.anchor.markets.yfi;
  const ANCHOR_STETH = config.anchor.markets.steth;
  const ANCHOR_INVDOLASLP = config.anchor.markets.invdolaslp
  const ANCHOR_DOLA3POOLCRV = config.anchor.markets.dola3poolcrv
  const ANCHOR_FLOKI = config.anchor.markets.floki;
  const ANCHOR_TOKENS = Object.values(config.anchor.markets).filter(v => !!v);

  const GOVERNANCE = config.governance;
  const GOVERNANCE_ALPHA = config.governanceAlpha;
  const MULTI_DELEGATOR = config.multiDelegator;

  // Harvester
  const HARVESTER = config.harvester;

  // Escrow
  const ESCROW_V1 = config.escrow_v1;
  const ESCROW = config.escrow;

  // Tokens
  const INV = config.INV;
  const DOLA = config.DOLA;
  const DAI = config.DAI;
  const USDC = config.USDC;
  const USDT = config.USDT;
  const WETH = config.WETH;
  const YFI = config.YFI;
  const XSUSHI = config.XSUSHI;
  const WBTC = config.WBTC;
  const XINV_V1 = config.XINV_V1;
  const XINV = config.XINV;
  const STETH = config.STETH;
  const INVDOLASLP = config.INVDOLASLP
  const DOLA3POOLCRV = config.DOLA3POOLCRV
  const THREECRV = config.THREECRV;
  const FLOKI = config.FLOKI;
  const DOLA_PAYROLL = config.DOLA_PAYROLL;

  const NAMED_ADDRESSES: { [key: string]: string } = config.namedAddresses

  const TOKENS: TokenList = {
    ETH: {
      address: '',
      name: 'Ether',
      symbol: 'ETH',
      coingeckoId: 'ethereum',
      image: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
      decimals: 18,
    },
    [INV]: {
      address: INV,
      name: 'Inverse',
      symbol: 'INV',
      coingeckoId: 'inverse-finance',
      image: '/assets/favicon.png',
      decimals: 18,
    },
    [DOLA]: {
      address: DOLA,
      name: 'Dola',
      symbol: 'DOLA',
      coingeckoId: 'dola-usd',
      image: 'https://assets.coingecko.com/coins/images/14287/small/anchor-logo-1-200x200.png',
      decimals: 18,
    },
    [DAI]: {
      address: DAI,
      name: 'Dai',
      symbol: 'DAI',
      coingeckoId: 'dai',
      image: 'https://assets.coingecko.com/coins/images/9956/small/dai-multi-collateral-mcd.png',
      decimals: 18,
    },
    [USDT]: {
      address: USDT,
      name: 'Tether',
      symbol: 'USDT',
      coingeckoId: 'tether',
      image: 'https://assets.coingecko.com/coins/images/325/small/Tether-logo.png',
      decimals: 6,
    },
    [USDC]: {
      address: USDC,
      name: 'USD Coin',
      symbol: 'USDC',
      coingeckoId: 'usd-coin',
      image: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png',
      decimals: 6,
    },
    [WETH]: {
      address: WETH,
      name: 'Wrapped Ethereum',
      symbol: 'WETH',
      coingeckoId: 'weth',
      image: 'https://assets.coingecko.com/coins/images/2518/small/weth.png',
      decimals: 18,
    },
    [YFI]: {
      address: YFI,
      name: 'Yearn',
      symbol: 'YFI',
      coingeckoId: 'yearn-finance',
      image: 'https://assets.coingecko.com/coins/images/11849/small/yfi-192x192.png',
      decimals: 18,
    },
    [XSUSHI]: {
      address: XSUSHI,
      name: 'xSUSHI',
      symbol: 'xSUSHI',
      coingeckoId: 'xsushi',
      image: 'https://assets.coingecko.com/coins/images/13725/small/xsushi.png',
      decimals: 18,
    },
    [WBTC]: {
      address: WBTC,
      name: 'Wrapped Bitcoin',
      symbol: 'WBTC',
      coingeckoId: 'wrapped-bitcoin',
      image: 'https://assets.coingecko.com/coins/images/7598/small/wrapped_bitcoin_wbtc.png',
      decimals: 8,
    },
    [STETH]: {
      address: STETH,
      name: 'Lido Staked Ether',
      symbol: 'stETH',
      coingeckoId: 'staked-ether',
      image: 'https://assets.coingecko.com/coins/images/13442/small/steth_logo.png',
      decimals: 18,
    },
    [INVDOLASLP]: {
      address: INVDOLASLP,
      name: 'INV-DOLA SLP',
      symbol: 'INV-DOLA-SLP',
      //coingeckoId: 'staked-ether',
      image: 'https://assets.coingecko.com/coins/images/12271/small/512x512_Logo_no_chop.png',
      decimals: 18,
    },
    [DOLA3POOLCRV]: {
      address: DOLA3POOLCRV,
      name: 'Dola-3pool CRV LP',
      symbol: 'DOLA-3POOL',
      coingeckoId: 'lp-3pool-curve',
      image: 'https://assets.coingecko.com/coins/images/12972/small/3pool_128.png?1603948039',
      decimals: 18,
    },
    [THREECRV]: {
      address: THREECRV,
      name: 'lp-3pool-curve',
      symbol: '3CRV',
      coingeckoId: 'lp-3pool-curve',
      image: 'https://assets.coingecko.com/coins/images/12972/small/3pool_128.png?1603948039',
      decimals: 18,
    },
    [FLOKI]: {
      address: FLOKI,
      name: 'Floki',
      symbol: 'FLOKI',
      coingeckoId: 'floki-inu',
      image: 'https://assets.coingecko.com/coins/images/16746/small/FLOKI.png?1625835665',
      decimals: 9,
    },
  };

  const UNDERLYING: TokenList = {
    [ANCHOR_ETH]: TOKENS.ETH,
    [ANCHOR_DOLA]: TOKENS[DOLA],
    [ANCHOR_XSUSHI]: TOKENS[XSUSHI],
    [ANCHOR_WBTC]: TOKENS[WBTC],
    [ANCHOR_YFI]: TOKENS[YFI],
    [ANCHOR_STETH]: TOKENS[STETH],
    [ANCHOR_INVDOLASLP]: TOKENS[INVDOLASLP],
    [ANCHOR_DOLA3POOLCRV]: TOKENS[DOLA3POOLCRV],
    [ANCHOR_FLOKI]: TOKENS[FLOKI],
    [XINV_V1]: TOKENS[INV],
    [XINV]: TOKENS[INV],
    [VAULT_USDC_ETH]: TOKENS[USDC],
    [VAULT_DAI_ETH]: TOKENS[DAI],
    [VAULT_DAI_WBTC]: TOKENS[DAI],
    [VAULT_DAI_YFI]: TOKENS[DAI],
    [THREECRV]: TOKENS[THREECRV],
  }

  const CONTRACTS: { [key: string]: string } = {
    [ANCHOR_ETH]: 'anETH',
    [ANCHOR_DOLA]: 'anDOLA',
    [ANCHOR_XSUSHI]: 'anXSUSHI',
    [ANCHOR_WBTC]: 'anWBTC',
    [ANCHOR_YFI]: 'anYFI',
    [ANCHOR_STETH]: 'anStETH',
    [ANCHOR_INVDOLASLP]: 'INV-DOLA SLP',
    [ANCHOR_DOLA3POOLCRV]: 'Dola-3pool LP',
    [ANCHOR_FLOKI]: 'anFloki',
    [COMPTROLLER]: 'Comptroller',
    [DAI]: 'Dai',
    [DOLA]: 'DOLA',
    [INV]: 'INV',
    [ORACLE]: 'Oracle',
    [STABILIZER]: 'Stabilizer',
    [FLOKI]: 'Floki',
    [VAULT_USDC_ETH]: 'vaultUsdcEth',
    [VAULT_DAI_ETH]: 'vaultDaiEth',
    [VAULT_DAI_WBTC]: 'vaultDaiWbtc',
    [VAULT_DAI_YFI]: 'vaultDaiYfi',
    [XINV_V1]: 'xINV-v1',
    [XINV]: 'xINV',
    [GOVERNANCE]: 'GovMills',
    [GOVERNANCE_ALPHA]: 'GovAlpha',
    [DOLA_PAYROLL]: 'DolaPayroll',
    '0xFBAB1B85A145Cd648374aCebf84cDD0247268587': 'Vester',
    '0x926dF14a23BE491164dCF93f4c468A50ef659D5B': 'Timelock',
    '0x34A7a276eD77c6FE866c75Bbc8d79127c4E14a09': 'TheAlienTourist',
    '0xE58ED128325A33afD08e90187dB0640619819413': 'PatB',
  }

  const PROPOSAL_AUTOCOMPLETE_ADDRESSES = {
    ...CONTRACTS,
    '0x0000000000000000000000000000000000000000': 'BurnAddress',
  }

  const VAULT_TREE: VaultTree = {
    [DAI]: {
      ETH: VAULT_DAI_ETH,
      [WBTC]: VAULT_DAI_WBTC,
      [YFI]: VAULT_DAI_YFI,
    },
    [USDC]: {
      ETH: VAULT_USDC_ETH,
    },
  }

  const VAULTS: Vaults = {
    [VAULT_DAI_ETH]: {
      from: TOKENS[DAI],
      to: TOKENS.ETH,
    },
    [VAULT_DAI_WBTC]: {
      from: TOKENS[DAI],
      to: TOKENS[WBTC],
    },
    [VAULT_DAI_YFI]: {
      from: TOKENS[DAI],
      to: TOKENS[YFI],
    },
    [VAULT_USDC_ETH]: {
      from: TOKENS[USDC],
      to: TOKENS.ETH,
    },
  }

  return {
    VAULT_USDC_ETH,
    VAULT_DAI_WBTC,
    VAULT_DAI_YFI,
    VAULT_DAI_ETH,
    VAULT_TOKENS,
    LENS,
    AN_ETH_REPAY_ALL,
    COMPTROLLER,
    ORACLE,
    STABILIZER,
    TREASURY,
    ANCHOR_ETH,
    ANCHOR_DOLA,
    ANCHOR_XSUSHI,
    ANCHOR_WBTC,
    ANCHOR_YFI,
    ANCHOR_STETH,
    ANCHOR_INVDOLASLP,
    ANCHOR_DOLA3POOLCRV,
    ANCHOR_FLOKI,
    ANCHOR_TOKENS,
    GOVERNANCE,
    GOVERNANCE_ALPHA,
    MULTI_DELEGATOR,
    HARVESTER,
    ESCROW_V1,
    ESCROW,
    INV,
    DOLA,
    DAI,
    USDC,
    USDT,
    WETH,
    YFI,
    XSUSHI,
    WBTC,
    XINV_V1,
    XINV,
    STETH,
    INVDOLASLP,
    DOLA3POOLCRV,
    FLOKI,
    THREECRV,
    UNDERLYING,
    TOKENS,
    VAULTS,
    VAULT_TREE,
    CONTRACTS,
    NAMED_ADDRESSES,
    PROPOSAL_AUTOCOMPLETE_ADDRESSES,
    DOLA_PAYROLL,
  }
}