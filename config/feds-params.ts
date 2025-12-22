import { FedTypes, NetworkIds } from "@app/types";
import { TOKEN_IMAGES } from "@app/variables/images";
import { BigNumber, Contract } from "ethers";
import { PSM_ADDRESS } from "./constants";

export const FEDS_PARAMS = [
    {
        chainId: NetworkIds.mainnet,
        type: FedTypes.ISOLATED,
        protocol: "FiRM",
        address: "0x2b34548b865ad66A2B046cb82e59eE43F75B90fd",
        name: "FiRM Fed",
        projectImage: "/assets/inv-square-dark.jpeg",
        isFirm: true,
        supplyFuncName: "globalSupply",
        strategy: {
            description: 'Offer unique features alongside competitive fixed-rate borrowing APR, get borrowing fees via the the DOLA Borrowing Right (DBR) token, in the FiRM protocol the borrowers spend 1 DBR a year for each DOLA they borrow.',
        },
    },
    {
        chainId: NetworkIds.mainnet,
        type: FedTypes.CROSS,
        protocol: "Frontier",
        address: "0x5E075E40D01c82B6Bf0B0ecdb4Eb1D6984357EF7",
        name: "Frontier Fed",
        projectImage: "/assets/inv-square-dark.jpeg",
        // strategy: {
        //     description: 'Get borrowing interests on the DOLA borrowed in a Compound-style cross-lending protocol',
        // }
    },
    {
        chainId: NetworkIds.mainnet,
        type: FedTypes.CROSS,
        fusePool: "6",
        protocol: "Fuse",
        address: "0xe3277f1102C1ca248aD859407Ca0cBF128DB0664",
        name: "Fuse6 Fed",
        hasEnded: true,
        projectImage: "/assets/projects/Fuse.png",
    },
    {
        chainId: NetworkIds.mainnet,
        type: FedTypes.CROSS,
        fusePool: "22",
        protocol: "Fuse",
        address: "0x7765996dAe0Cf3eCb0E74c016fcdFf3F055A5Ad8",
        name: "Badger Fed",
        hasEnded: true,
        projectImage: "/assets/projects/Fuse.png",
    },
    {
        chainId: NetworkIds.mainnet,
        type: FedTypes.CROSS,
        fusePool: "127",
        protocol: "Fuse",
        address: "0x5Fa92501106d7E4e8b4eF3c4d08112b6f306194C",
        name: "0xb1 Fed",
        hasEnded: true,
        projectImage: "/assets/projects/Fuse.png",
    },
    {
        chainId: NetworkIds.mainnet,
        type: FedTypes.CROSS,
        fusePool: "24",
        protocol: "Fuse",
        hasEnded: true,
        address: "0xCBF33D02f4990BaBcba1974F1A5A8Aea21080E36",
        name: "Fuse24 Fed",
        projectImage: "/assets/projects/Fuse.png",
    },
    {
        chainId: NetworkIds.mainnet,
        type: FedTypes.LP,
        protocol: "Yearn",
        address: "0xcc180262347F84544c3a4854b87C34117ACADf94",
        name: "Yearn Fed",
        projectImage: "/assets/projects/YFI.svg",
        hasEnded: true,
    },
    {
        chainId: NetworkIds.mainnet,
        type: FedTypes.LP,
        protocol: "Convex",
        address: "0xF382d062DF29CF5E400c131C1383c9E6Cd174305",
        oldAddresses: [
            "0x57d59a73cdc15fe717d2f1d433290197732659e2",
            "0x9060A61994F700632D16D6d2938CA3C7a1D344Cb",
        ],
        name: "Convex Fed",
        projectImage:
            "https://assets.coingecko.com/coins/images/15585/small/convex.png?1621256328",
        supplyFuncName: "dolaSupply",
        strategy: {
            description: 'The minted DOLA is added to the Curve DOLA/FRAXBP liquidity pool, the resulting Curve LP token is then deposited in the Convex booster. This Fed gets rewards in CRV and CVX tokens.',
            pools: [
                {
                    address: '0xE57180685E3348589E9521aa53Af0BCD497E884d',
                    name: 'Curve DOLA/FRAXBP',
                    link: 'https://curve.finance/#/ethereum/pools/factory-v2-176/deposit',
                    image: 'https://assets.coingecko.com/coins/images/12124/small/Curve.png?1597369484',
                },
                {
                    address: '0x0404d05F3992347d2f0dC3a97bdd147D77C85c1c',
                    name: 'Convex Reward Pool',
                    link: 'https://www.convexfinance.com/stake',
                    image: 'https://assets.coingecko.com/coins/images/15585/small/convex.png?1621256328',
                },
            ],
            type: 'convex',
            lpBalanceContract: '0x0404d05F3992347d2f0dC3a97bdd147D77C85c1c',
            rewardPools: [
                { address: '0x0404d05F3992347d2f0dC3a97bdd147D77C85c1c', method: 'earned', underlying: '0xD533a949740bb3306d119CC777fa900bA034cd52' },
                { isCVXreward: true, underlying: '0x4e3fbd56cd56c3e72c1403e103b45db9da5b9d2b' },
            ],
            multisig: {
                address: '0x9D5Df30F475CEA915b1ed4C0CCa59255C897b61B',
                relevantAssets: [
                    '0xD533a949740bb3306d119CC777fa900bA034cd52',
                    '0x4e3fbd56cd56c3e72c1403e103b45db9da5b9d2b',
                    '0x72a19342e8F1838460eBFCCEf09F6585e32db86E',
                    '0xd1b5651e55d4ceed36251c61c50c889b36f6abb5',
                    '0x7f50786A0b15723D741727882ee99a0BF34e3466',
                ]
            },
        },
    },
    {
        chainId: NetworkIds.ftm,
        type: FedTypes.CROSS,
        protocol: "Scream",
        hasEnded: true,
        isXchain: true,
        address: "0x4d7928e993125A9Cefe7ffa9aB637653654222E2",
        name: "Scream Fed",
        projectImage: "/assets/projects/Scream.webp",
        supplyFuncName: "dstSupply",
    },
    {
        chainId: NetworkIds.mainnet,
        type: FedTypes.LP,
        protocol: "Velodrome",
        address: "0xfEd533e0Ec584D6FF40281a7850c4621D258b43d",
        name: "Velo Fed",
        projectImage:
            "https://assets.coingecko.com/coins/images/25783/small/velo.png",
        supplyFuncName: "dolaSupply",
        incomeChainId: NetworkIds.optimism,
        incomeSrcAd: "0x8Bbd036d018657E454F679E7C4726F7a8ECE2773",
        oldIncomeSrcAds: ["0xFED67cC40E9C5934F157221169d772B328cb138E"],
        incomeTargetAd: "0xa283139017a2f5BAdE8d8e25412C600055D318F8",
        dontUseSupplyForPolCalc: true,
        strategy: {
            description: 'The minted DOLA is bridged to a VeloFarmer contract on Optimism, this contract can swap DOLA for USDC and deposit DOLA+USDC to the Velodrome DOLA-USDC liquidity pool. \n\nThis Fed gets rewards in VELO tokens which can then be locked to increase voting power on Velodrome further increasing efficiency.',
            pools: [
                {
                    address: '0xB720FBC32d60BB6dcc955Be86b98D8fD3c4bA645',
                    name: 'Velodrome DOLA-USDC',
                    link: 'https://velodrome.finance/deposit?token0=0x7f5c764cbc14f9669b88837ca1490cca17c31607&token1=0x8ae125e8653821e851f12a49f7765db9a9ce7384&stable=true',
                    image: 'https://assets.coingecko.com/coins/images/25783/small/velo.png',
                },
            ],
            type: 'solidly',
            lpBalanceContract: '0xa1034Ed2C9eb616d6F7f318614316e64682e7923',
            rewardPools: [
                { address: '0xa1034Ed2C9eb616d6F7f318614316e64682e7923', method: 'earned', underlying: '0x9560e827af36c94d2ac33a39bce1fe78631088db' }
            ],
            multisig: {
                address: '0xa283139017a2f5BAdE8d8e25412C600055D318F8',
                relevantAssets: [
                    '0xFAf8FD17D9840595845582fCB047DF13f006787d',
                    '0x3c8B650257cFb5f272f799F5e2b4e65093a11a05',
                    '0x9560e827af36c94d2ac33a39bce1fe78631088db',
                ]
            },
        },
    },
    {
        chainId: NetworkIds.mainnet,
        type: FedTypes.LP,
        protocol: "Aura",
        address: "0x5C16aE212f8d721FAb74164d1039d4514b11DB54",
        oldAddresses: ["0x5D5392505ee69f9FE7a6a1c1AF14f17Db3B3e364", "0xc6279A7Cd38819ebbF6ad3a05a0998f887DF2740", "0x1CD24E3FBae88BECbaFED4b8Cda765D1e6e3BC03"],
        name: "Aura Fed",
        projectImage:
            "https://assets.coingecko.com/coins/images/25942/small/logo.png",
        supplyFuncName: "dolaSupply",
        strategy: {
            description: 'The minted DOLA is added to the Balancer DOLA/USDC liquidity pool, the resulting Balancer LP token is then deposited in the Aura booster. This Fed gets rewards in BAL and AURA tokens.',
            pools: [
                {
                    address: '0xFf4ce5AAAb5a627bf82f4A571AB1cE94Aa365eA6',
                    name: 'Balancer DOLA/USDC',
                    link: 'https://app.balancer.fi/#/ethereum/pool/0xff4ce5aaab5a627bf82f4a571ab1ce94aa365ea6000200000000000000000426',
                    image: '/assets/projects/balancer.png',
                },
                {
                    address: '0xb139946D2F0E71b38e2c75d03D87C5E16339d2CD',
                    name: 'Aura Reward Pool',
                    link: 'https://app.aura.finance/',
                    image: 'https://assets.coingecko.com/coins/images/25942/small/logo.png?1654784187',
                },
            ],
            type: 'convex',
            lpBalanceContract: '0xb139946D2F0E71b38e2c75d03D87C5E16339d2CD',
            rewardPools: [
                { address: '0xb139946D2F0E71b38e2c75d03D87C5E16339d2CD', method: 'earned', underlying: '0xba100000625a3754423978a60c9317c58a424e3D' },
                { isAURAreward: true, underlying: '0xC0c293ce456fF0ED870ADd98a0828Dd4d2903DBF' },
            ],
            multisig: {
                address: '0x9D5Df30F475CEA915b1ed4C0CCa59255C897b61B',
                relevantAssets: [
                    '0xba100000625a3754423978a60c9317c58a424e3D',
                    '0xC0c293ce456fF0ED870ADd98a0828Dd4d2903DBF',
                    '0x3Fa73f1E5d8A792C80F426fc8F84FBF7Ce9bBCAC',
                ]
            },
        },
    },
    {
        chainId: NetworkIds.mainnet,
        type: FedTypes.LP,
        protocol: "Aura",
        address: "0xab4AE477899fD61B27744B4DEbe8990C66c81C22",
        name: "AuraEuler Fed",
        projectImage:
            "https://assets.coingecko.com/coins/images/25942/small/logo.png",
        supplyFuncName: "dolaSupply",
        hasEnded: true,
        strategy: {
            isComposableMetapool: true,
            description: 'The minted DOLA is added to the Balancer DOLA/bb-e-USD liquidity pool, the resulting Balancer LP token is then deposited in the Aura booster. This Fed gets rewards in BAL and AURA tokens.',
            pools: [
                {
                    address: '0x133d241F225750D2c92948E464A5a80111920331',
                    name: 'Balancer DOLA/bb-e-USD',
                    link: 'https://app.balancer.fi/#/ethereum/pool/0x133d241f225750d2c92948e464a5a80111920331000000000000000000000476',
                    image: '/assets/projects/balancer.png',
                },
                {
                    address: '0xFdbd847B7593Ef0034C58258aD5a18b34BA6cB29',
                    name: 'Aura Reward Pool',
                    link: 'https://app.aura.finance/',
                    image: 'https://assets.coingecko.com/coins/images/25942/small/logo.png?1654784187',
                },
            ],
            type: 'convex',
            rewardPools: [
                { address: '0xFdbd847B7593Ef0034C58258aD5a18b34BA6cB29', method: 'earned', underlying: '0xba100000625a3754423978a60c9317c58a424e3D' },
                { isAURAreward: true, underlying: '0xC0c293ce456fF0ED870ADd98a0828Dd4d2903DBF' },
            ],
            multisig: {
                address: '0x9D5Df30F475CEA915b1ed4C0CCa59255C897b61B',
                relevantAssets: [
                    '0xba100000625a3754423978a60c9317c58a424e3D',
                    '0xC0c293ce456fF0ED870ADd98a0828Dd4d2903DBF',
                    '0x3Fa73f1E5d8A792C80F426fc8F84FBF7Ce9bBCAC',
                ]
            },
        },
    },
    {
        chainId: NetworkIds.mainnet,
        type: FedTypes.LP,
        protocol: "Aura",
        address: "0x0B5ec95257afd9534C953428AC833D19579843CB",        
        name: "ArbiFed",
        projectImage:
            "https://assets.coingecko.com/coins/images/25942/small/logo.png",
        supplyFuncName: "underlyingSupply",
        incomeChainId: NetworkIds.arbitrum,
        incomeSrcAd: "0x1992AF61FBf8ee38741bcc57d636CAA22A1a7702",
        incomeTargetAd: "0x23dEDab98D7828AFBD2B7Ab8C71089f2C517774a",
        dontUseSupplyForPolCalc: true,
        strategy: {
            description: 'The minted DOLA is added to the Balancer DOLA/USDC liquidity pool, the resulting Balancer LP token is then deposited in the Aura booster. This Fed gets rewards in BAL and AURA tokens.',
            pools: [
                {
                    address: '0x8bc65Eed474D1A00555825c91FeAb6A8255C2107',
                    name: 'Balancer DOLA/USDC',
                    link: 'https://app.balancer.fi/#/ethereum/pool/0x8bc65eed474d1a00555825c91feab6a8255c2107000200000000000000000426',
                    image: '/assets/projects/balancer.png',
                },
                {
                    address: '0xAc7025Dec5E216025C76414f6ac1976227c20Ff0',
                    name: 'Aura Reward Pool',
                    link: 'https://app.aura.finance/',
                    image: 'https://assets.coingecko.com/coins/images/25942/small/logo.png?1654784187',
                },
            ],
            type: 'convex',
            lpBalanceContract: '0xAc7025Dec5E216025C76414f6ac1976227c20Ff0',
            rewardPools: [
                { address: '0xAc7025Dec5E216025C76414f6ac1976227c20Ff0', method: 'earned', underlying: '0x040d1EdC9569d4Bab2D15287Dc5A4F10F56a56B8' },
                { isAURAreward: true, underlying: '0x1509706a6c66CA549ff0cB464de88231DDBe213B' },
            ],
            multisig: {
                address: '0x23dEDab98D7828AFBD2B7Ab8C71089f2C517774a',
                relevantAssets: [
                    '0x040d1EdC9569d4Bab2D15287Dc5A4F10F56a56B8',
                    '0x1509706a6c66CA549ff0cB464de88231DDBe213B',
                ]
            },
        },
    },
    {
        chainId: NetworkIds.mainnet,
        type: FedTypes.LP,
        protocol: "Aerodrome",
        address: "0x24a3C49e5Cd8786498e9051F5Be7D6e86B263c8B",
        name: "Aero Fed",
        projectImage:
            "https://assets.coingecko.com/coins/images/31745/small/token.png?1694749704",
        supplyFuncName: "dolaSupply",
        incomeChainId: NetworkIds.base,
        incomeSrcAd: "0x2457937668a345305FE08736F407Fba3F39cbF2f",
        incomeTargetAd: "0x586CF50c2874f3e3997660c0FD0996B090FB9764",
        dontUseSupplyForPolCalc: true,
        strategy: {
            description: 'The minted DOLA is bridged to a AeroFarmer contract on Base, this contract can swap DOLA for USDbC and deposit DOLA+USDbC to the Velodrome DOLA-USDbC liquidity pool. \n\nThis Fed gets rewards in AERO tokens which can then be locked to increase voting power on Aerodrome further increasing efficiency.',
            pools: [
                {
                    address: '0x0B25c51637c43decd6CC1C1e3da4518D54ddb528',
                    name: 'Aerodrome DOLA-USDbC',
                    link: 'https://aerodrome.finance/deposit?token0=0x4621b7a9c75199271f773ebd9a499dbd165c3191&token1=0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca&stable=true',
                    image: 'https://assets.coingecko.com/coins/images/31745/small/token.png?1694749704',
                },
            ],
            type: 'solidly',
            lpBalanceContract: '0xeAE066C25106006fB386A3a8b1698A0cB6931c1a',
            rewardPools: [
                { address: '0xeAE066C25106006fB386A3a8b1698A0cB6931c1a', method: 'earned', underlying: '0x940181a94A35A4569E4529A3CDfB74e38FD98631' }
            ],
            multisig: {
                address: '0x586CF50c2874f3e3997660c0FD0996B090FB9764',
                relevantAssets: [
                    '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA',
                    '0x4621b7A9c75199271F773Ebd9A499dbd165c3191',
                    '0x940181a94A35A4569E4529A3CDfB74e38FD98631',
                ]
            },
        },
    },
    {
        chainId: NetworkIds.mainnet,
        type: FedTypes.LP,
        protocol: "Convex",
        address: "0x83FB6f6524eb8c85bDAB818981E918dB17e723CD",        
        name: "FraxPyusd Fed",
        projectImage:
            "https://assets.coingecko.com/coins/images/15585/small/convex.png?1621256328",
        supplyFuncName: "dolaSupply",
        strategy: {
            description: 'The minted DOLA is added to the Curve DOLA/FRAXPYUSD liquidity pool, the resulting Curve LP token is then deposited in the Convex booster. This Fed gets rewards in CRV and CVX tokens.',
            pools: [
                {
                    address: '0xef484de8C07B6e2d732A92B5F78e81B38f99f95E',
                    name: 'Curve DOLA/FRAXPYUSD',
                    link: 'https://curve.finance/#/ethereum/pools/factory-v2-176/deposit',
                    image: 'https://assets.coingecko.com/coins/images/12124/small/Curve.png?1597369484',
                },
                {
                    address: '0xE8cBdBFD4A1D776AB1146B63ABD1718b2F92a823',
                    name: 'Convex Reward Pool',
                    link: 'https://www.convexfinance.com/stake',
                    image: 'https://assets.coingecko.com/coins/images/15585/small/convex.png?1621256328',
                },
            ],
            type: 'convex',
            lpBalanceContract: '0xE8cBdBFD4A1D776AB1146B63ABD1718b2F92a823',
            rewardPools: [
                { address: '0xE8cBdBFD4A1D776AB1146B63ABD1718b2F92a823', method: 'earned', underlying: '0xD533a949740bb3306d119CC777fa900bA034cd52' },
                { isCVXreward: true, underlying: '0x4e3fbd56cd56c3e72c1403e103b45db9da5b9d2b' },
            ],
            multisig: {
                address: '0x9D5Df30F475CEA915b1ed4C0CCa59255C897b61B',
                relevantAssets: [
                    '0xD533a949740bb3306d119CC777fa900bA034cd52',
                    '0x4e3fbd56cd56c3e72c1403e103b45db9da5b9d2b',
                    '0x72a19342e8F1838460eBFCCEf09F6585e32db86E',
                    '0xd1b5651e55d4ceed36251c61c50c889b36f6abb5',
                    '0x7f50786A0b15723D741727882ee99a0BF34e3466',
                ]
            },
        },
    },
    {
        chainId: NetworkIds.mainnet,
        type: FedTypes.LP,
        protocol: "Aerodrome",
        address: "0x783719dDf09D2ee0960BB365f7Ef652bfE35F54d",
        name: "BaseCCTP Fed",
        projectImage:
            "https://assets.coingecko.com/coins/images/31745/small/token.png?1694749704",
        supplyFuncName: "dolaSupply",
        incomeChainId: NetworkIds.base,
        incomeSrcAd: "0xe96e99a5A3512468A4aaFC317D77C6Fa0289F5f3",
        incomeTargetAd: "0x586CF50c2874f3e3997660c0FD0996B090FB9764",
        dontUseSupplyForPolCalc: true,
        strategy: {
            description: 'The minted DOLA is bridged to a AeroFarmer contract on Base, this contract can swap DOLA for native USDC and deposit DOLA+USDC to the Velodrome DOLA-USDC liquidity pool. \n\nThis Fed gets rewards in AERO tokens which can then be locked to increase voting power on Aerodrome further increasing efficiency.',
            pools: [
                {
                    address: '0xf213F2D02837012dC0236cC105061e121bB03e37',
                    name: 'Aerodrome DOLA-USDC',
                    link: 'https://aerodrome.finance/deposit?token0=0x4621b7a9c75199271f773ebd9a499dbd165c3191&token1=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913&stable=true',
                    image: 'https://assets.coingecko.com/coins/images/31745/small/token.png?1694749704',
                },
            ],
            type: 'solidly',
            lpBalanceContract: '0xCCff5627cd544b4cBb7d048139C1A6b6Bde67885',
            rewardPools: [
                { address: '0xCCff5627cd544b4cBb7d048139C1A6b6Bde67885', method: 'earned', underlying: '0x940181a94A35A4569E4529A3CDfB74e38FD98631' }
            ],
            multisig: {
                address: '0x586CF50c2874f3e3997660c0FD0996B090FB9764',
                relevantAssets: [
                    '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA',
                    '0x4621b7A9c75199271F773Ebd9A499dbd165c3191',
                    '0x940181a94A35A4569E4529A3CDfB74e38FD98631',
                ]
            },
        },
    },
    {
        chainId: NetworkIds.mainnet,
        type: FedTypes.LP,
        protocol: "Velodrome",
        address: "0x52FFD313cc11882b75879C41d837b20F974ea88f",
        name: "OptiCCTP Fed",
        projectImage:
            "https://assets.coingecko.com/coins/images/25783/small/velo.png",
        supplyFuncName: "dolaSupply",
        incomeChainId: NetworkIds.optimism,
        incomeSrcAd: "0x9060A61994F700632D16D6d2938CA3C7a1D344Cb",
        incomeTargetAd: "0xa283139017a2f5BAdE8d8e25412C600055D318F8",
        dontUseSupplyForPolCalc: true,
        strategy: {
            description: 'The minted DOLA is bridged to a VeloFarmer contract on Optimism, this contract can swap DOLA for native USDC and deposit DOLA+USDC to the Velodrome DOLA-USDC liquidity pool. \n\nThis Fed gets rewards in VELO tokens which can then be locked to increase voting power on Velodrome further increasing efficiency.',
            pools: [
                {
                    address: '0xA56a25Dee5B3199A9198Bbd48715EE3D0ed98378',
                    name: 'Velodrome DOLA-USDC',
                    link: 'https://velodrome.finance/deposit?token0=0x7f5c764cbc14f9669b88837ca1490cca17c31607&token1=0x8ae125e8653821e851f12a49f7765db9a9ce7384&stable=true',
                    image: 'https://assets.coingecko.com/coins/images/25783/small/velo.png',
                },
            ],
            type: 'solidly',
            lpBalanceContract: '0x853CAcEc83e4183eF78d6b64ccca3de365861CaF',
            rewardPools: [
                { address: '0x853CAcEc83e4183eF78d6b64ccca3de365861CaF', method: 'earned', underlying: '0x9560e827af36c94d2ac33a39bce1fe78631088db' }
            ],
            multisig: {
                address: '0xa283139017a2f5BAdE8d8e25412C600055D318F8',
                relevantAssets: [
                    '0xFAf8FD17D9840595845582fCB047DF13f006787d',
                    '0x3c8B650257cFb5f272f799F5e2b4e65093a11a05',
                    '0x9560e827af36c94d2ac33a39bce1fe78631088db',
                ]
            },
        },
    },
    {
        chainId: NetworkIds.mainnet,
        type: FedTypes.CROSS,
        protocol: "Gearbox",
        address: "0xe082EB109fAd53eA8DB9827ce6b8ef74882734fc",
        name: "Gearbox Fed",
        projectImage: TOKEN_IMAGES["GEAR"],
        supplyFuncName: "supply",
        borrowConfig: {
            contractAddress: '0x31426271449F60d37Cc5C9AEf7bD12aF3BdC7A94',
            abi: ["function totalBorrowed() view returns (uint)", "function totalAssets() view returns (uint)"],
            functionName: 'totalBorrowed',
            customFunction: async (contract: Contract, fedContract: Contract) => {
                try {
                    const [totalBorrowed, totalAssets, lentByFed] = await Promise.all([
                        contract.totalBorrowed(),
                        contract.totalAssets(),
                        fedContract.supply(),
                    ]);
                    return totalBorrowed.mul(lentByFed).div(totalAssets);
                } catch (e) {
                    console.error(e);
                    return BigNumber.from(0);
                }
            }
        },
    },
    {
        chainId: NetworkIds.mainnet,
        type: FedTypes.PSM,
        protocol: "PSM",
        address: '0x67FC21332D24FC5250a3B7fc988191ad7F38f9cC',
        name: "PSM Fed",
        projectImage: TOKEN_IMAGES["USDS"],
        isFirm: false,
        supplyFuncName: "supply",
        borrowConfig: {
            contractAddress: '0x865377367054516e17014CcdED1e7d814EDC9ce4',
            abi: ["function balanceOf(address) view returns (uint)"],
            functionName: 'balanceOf',
            customFunction: async (contract: Contract, fedContract: Contract) => {
                try {
                    const [dolaBalInPSM, supplied] = await Promise.all([
                        contract.balanceOf(PSM_ADDRESS),
                        fedContract.supply(),
                    ]);
                    return supplied.sub(dolaBalInPSM);
                } catch (e) {
                    console.error(e);
                    return BigNumber.from(0);
                }
            }
        },
    },
];