import { FedTypes, NetworkIds } from "@app/types";

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
        projectImage: "/assets/projects/Fuse.png",
    },
    {
        chainId: NetworkIds.mainnet,
        type: FedTypes.CROSS,
        fusePool: "22",
        protocol: "Fuse",
        address: "0x7765996dAe0Cf3eCb0E74c016fcdFf3F055A5Ad8",
        name: "Badger Fed",
        projectImage: "/assets/projects/Fuse.png",
    },
    {
        chainId: NetworkIds.mainnet,
        type: FedTypes.CROSS,
        fusePool: "127",
        protocol: "Fuse",
        address: "0x5Fa92501106d7E4e8b4eF3c4d08112b6f306194C",
        name: "0xb1 Fed",
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
                    link: 'https://curve.fi/#/ethereum/pools/factory-v2-176/deposit',
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
        incomeSrcAd: "0xFED67cC40E9C5934F157221169d772B328cb138E",
        incomeTargetAd: "0xa283139017a2f5BAdE8d8e25412C600055D318F8",
        strategy: {
            description: 'The minted DOLA is bridged to a VeloFarmer contract on Optimism, this contract can swap DOLA for USDC and deposit DOLA+USDC to the Velodrome DOLA-USDC liquidity pool. \n\nThis Fed gets rewards in VELO tokens which can then be locked to increase voting power on Velodrome further increasing efficiency.',
            pools: [
                {
                    address: '0x6C5019D345Ec05004A7E7B0623A91a0D9B8D590d',
                    name: 'Velodrome DOLA-USDC',
                    link: 'https://app.velodrome.finance/liquidity/manage?address=0x6c5019d345ec05004a7e7b0623a91a0d9b8d590d',
                    image: 'https://assets.coingecko.com/coins/images/25783/small/velo.png',
                },
            ],
            type: 'solidly',        
            lpBalanceContract: '0xAFD2c84b9d1cd50E7E18a55e419749A6c9055E1F',
            rewardPools: [
                { address: '0xAFD2c84b9d1cd50E7E18a55e419749A6c9055E1F', method: 'earned', underlying: '0x3c8B650257cFb5f272f799F5e2b4e65093a11a05', type: 'specifyUnderlying' }
            ],
            multisig: {
                address: '0xa283139017a2f5BAdE8d8e25412C600055D318F8',
                relevantAssets: [
                    '0x9c7305eb78a432ced5C4D14Cac27E8Ed569A2e26',
                    '0x3c8B650257cFb5f272f799F5e2b4e65093a11a05',
                ]
            },
        },
    },
    {
        chainId: NetworkIds.mainnet,
        type: FedTypes.LP,
        protocol: "Aura",
        address: "0x1CD24E3FBae88BECbaFED4b8Cda765D1e6e3BC03",
        oldAddresses: ["0x5D5392505ee69f9FE7a6a1c1AF14f17Db3B3e364", "0xc6279A7Cd38819ebbF6ad3a05a0998f887DF2740"],
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
                    address: '0x22915f309EC0182c85cD8331C23bD187fd761360',
                    name: 'Aura Reward Pool',
                    link: 'https://app.aura.finance/',
                    image: 'https://assets.coingecko.com/coins/images/25942/small/logo.png?1654784187',
                },
            ],
            type: 'convex',
            lpBalanceContract: '0x22915f309EC0182c85cD8331C23bD187fd761360',
            rewardPools: [
                { address: '0x22915f309EC0182c85cD8331C23bD187fd761360', method: 'earned', underlying: '0xba100000625a3754423978a60c9317c58a424e3D' },
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
            lpBalanceContract: '0xFdbd847B7593Ef0034C58258aD5a18b34BA6cB29',
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
];