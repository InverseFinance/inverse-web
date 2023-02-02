import { NetworkIds } from "@app/types";

export const FEDS_PARAMS = [
    {
        chainId: NetworkIds.mainnet,
        type: "Isolated",
        protocol: "FiRM",
        address: "0x2b34548b865ad66A2B046cb82e59eE43F75B90fd",
        name: "FiRM Fed",
        projectImage: "/assets/inv-square-dark.jpeg",
        isFirm: true,
        supplyFuncName: "globalSupply",
        strategy: {
            description: 'DOLA is borrowable via the DOLA Borrowing Right (DBR) token, borrowers spend 1 DBR a year for each DOLA borrowed.',
        },
    },
    {
        chainId: NetworkIds.mainnet,
        type: "Cross",
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
        type: "Cross",
        fusePool: "6",
        protocol: "Fuse",
        address: "0xe3277f1102C1ca248aD859407Ca0cBF128DB0664",
        name: "Fuse6 Fed",
        projectImage: "/assets/projects/Fuse.png",
    },
    {
        chainId: NetworkIds.mainnet,
        type: "Cross",
        fusePool: "22",
        protocol: "Fuse",
        address: "0x7765996dAe0Cf3eCb0E74c016fcdFf3F055A5Ad8",
        name: "Badger Fed",
        projectImage: "/assets/projects/Fuse.png",
    },
    {
        chainId: NetworkIds.mainnet,
        type: "Cross",
        fusePool: "127",
        protocol: "Fuse",
        address: "0x5Fa92501106d7E4e8b4eF3c4d08112b6f306194C",
        name: "0xb1 Fed",
        projectImage: "/assets/projects/Fuse.png",
    },
    {
        chainId: NetworkIds.mainnet,
        type: "Cross",
        fusePool: "24",
        protocol: "Fuse",
        hasEnded: true,
        address: "0xCBF33D02f4990BaBcba1974F1A5A8Aea21080E36",
        name: "Fuse24 Fed",
        projectImage: "/assets/projects/Fuse.png",
    },
    {
        chainId: NetworkIds.mainnet,
        type: "LP",
        protocol: "Yearn",
        address: "0xcc180262347F84544c3a4854b87C34117ACADf94",
        name: "Yearn Fed",
        projectImage: "/assets/projects/YFI.svg",
    },
    {
        chainId: NetworkIds.mainnet,
        type: "LP",
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
            targetContract: '0x0404d05F3992347d2f0dC3a97bdd147D77C85c1c',
            rewardPools: [
                { address: '0x0404d05F3992347d2f0dC3a97bdd147D77C85c1c', method: 'earned', underlying: '0xD533a949740bb3306d119CC777fa900bA034cd52' },
                // { address: '0x0404d05F3992347d2f0dC3a97bdd147D77C85c1c', method: 'earned', underlying: '0x4e3fbd56cd56c3e72c1403e103b45db9da5b9d2b' },                
            ]
        },
    },
    {
        chainId: NetworkIds.ftm,
        type: "Cross",
        protocol: "Scream",
        hasEnded: true,
        isXchain: true,
        address: "0x4d7928e993125A9Cefe7ffa9aB637653654222E2",
        name: "Scream Fed",
        projectImage: "/assets/projects/Scream.webp",
    },
    {
        chainId: NetworkIds.mainnet,
        type: "LP",
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
            // cvxDOLAFRAXBP3CRV-f
            stakeToken: '0xf7eCC27CC9DB5d28110AF2d89b176A6623c7E351',
            // crv
            rewardToken: '0xD533a949740bb3306d119CC777fa900bA034cd52',
            rewardContract: '0x0404d05F3992347d2f0dC3a97bdd147D77C85c1c',
        },
    },
    {
        chainId: NetworkIds.mainnet,
        type: "LP",
        protocol: "Aura",
        address: "0xc6279A7Cd38819ebbF6ad3a05a0998f887DF2740",
        oldAddresses: ["0x5D5392505ee69f9FE7a6a1c1AF14f17Db3B3e364"],
        name: "Aura Fed",
        projectImage:
            "https://assets.coingecko.com/coins/images/25942/small/logo.png",
        supplyFuncName: "dolaSupply",
    },
];