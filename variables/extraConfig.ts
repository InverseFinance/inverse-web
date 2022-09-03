import { NetworkIds } from '@app/types';

const mainConfig = {
    INVDOLASLP: '0x5BA61c0a8c4DccCc200cd0ccC40a5725a426d002',
    DOLA3POOLCRV: '0xAA5A67c256e27A5d80712c51971408db3370927D',
    DOLA_PAYROLL: '0x32edDd879B199503c6Fc37DF95b8920Cd415358F',
    DEPLOYER: '0x3FcB35a1CbFB6007f9BC638D388958Bc4550cB28',
    stabilizer: '0x7eC0D931AFFBa01b77711C2cD07c76B970795CDd',
    harvester: '0xb677e5c5cbc42c25bff9578dda2959adb7eecc96',
    // governance alpha (old)
    governanceAlpha: '0x35d9f4953748b318f18c30634bA299b237eeDfff',
    // governance mills (old mills)
    // governance: '0xeF3bD8cA3beAC259D898b2C546F804B49D52e2FD',
    // governance mills (new mills)
    governance: '0xBeCCB6bb0aa4ab551966A7E4B97cec74bb359Bf6',
    // multiDelegator
    multiDelegator: '0x1ba87bE4C20Fa2d4cbD8e4Ae9998649226207F76',
    xinvManager: '0x07eB8fD853c847d6E25F29e566d605cFf474909D',
    policyCommittee: '0x4b6c63E6a94ef26E2dF60b89372db2d8e211F1B7',
    opBondManager: '0x9de7b925247c9bd98ecee5abb7ea06a4aa7d13cd',
    xinvVestorFactory: '0xe1C67007D1074bcAcC577DD946661F0CB9053A19',
    swapRouter: '0x66F625B8c4c635af8b74ECe2d7eD0D58b4af3C3d',
    disperseApp: '0xD152f549545093347A162Dce210e7293f1452150',
    debtRepayer: '0x79E8AB29Ff79805025c9462a2f2F12e9A496f81d',
    debtConverter: '0x5e6CB7E728E1C320855587E1D9C6F7972ebdD6D5',
    dbr: '0x50e6a8a893bDa08D31ADCA88E8B99cC3f9b2dE9A',
    f2Oracle: '0x20534D6A84C08e86B7700FE943880f30a6A36189',
    f2markets: [{
        name: 'WETH',
        // collateral: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        collateral: '0xc778417E063141139Fce010982780140Aa0cD5Ab',
        address: '0x8b70f2ED64DcbbeC47bd4b241b4628d7D5d7C30a',
    }],
    feds: [
        { chainId: NetworkIds.mainnet, address: '0x5E075E40D01c82B6Bf0B0ecdb4Eb1D6984357EF7', name: 'Frontier Fed', projectImage: '/assets/inv-square-dark.jpeg' },
        { chainId: NetworkIds.mainnet, address: '0xe3277f1102C1ca248aD859407Ca0cBF128DB0664', name: 'Fuse6 Fed', projectImage: '/assets/projects/Fuse.png' },
        { chainId: NetworkIds.mainnet, address: '0x7765996dAe0Cf3eCb0E74c016fcdFf3F055A5Ad8', name: 'Badger Fed', projectImage: '/assets/projects/Badger.jpg' },
        { chainId: NetworkIds.mainnet, address: '0x5Fa92501106d7E4e8b4eF3c4d08112b6f306194C', name: '0xb1 Fed', projectImage: 'https://unavatar.io/twitter/0x_b1' },
        { chainId: NetworkIds.mainnet, address: '0xCBF33D02f4990BaBcba1974F1A5A8Aea21080E36', name: 'Fuse24 Fed', projectImage: '/assets/projects/Fuse.png' },
        { chainId: NetworkIds.mainnet, address: '0xcc180262347F84544c3a4854b87C34117ACADf94', name: 'Yearn Fed', projectImage: '/assets/projects/YFI.svg' },
        { chainId: NetworkIds.ftm, isXchain: true, address: '0x4d7928e993125A9Cefe7ffa9aB637653654222E2', name: 'Scream Fed', projectImage: '/assets/projects/Scream.webp' },
    ],
    multisigs: [
        {
            address: '0x9D5Df30F475CEA915b1ed4C0CCa59255C897b61B',
            name: 'Treasury Working Group',
            shortName: 'TWG',
            purpose: 'Optimize Inverse Treasury management on Ethereum',
            governanceLink: 'https://www.inverse.finance/governance/proposals/mills/10',
            chainId: NetworkIds.mainnet,
        },
        {
            address: '0x7f063F7B7A1326eE8B64ACFdc81Bf544ecc974bC',
            name: 'Treasury Working Group on Fantom',
            shortName: 'TWG on FTM',
            purpose: 'Optimize Inverse Treasury management on Fantom',
            governanceLink: 'https://www.inverse.finance/governance/proposals/mills/10',
            chainId: NetworkIds.ftm,
        },
        {
            address: '0x4b6c63E6a94ef26E2dF60b89372db2d8e211F1B7',
            name: 'Policy Committee',
            shortName: 'PC',
            purpose: 'Handle Reward Rates and Bonds Policies',
            governanceLink: 'https://www.inverse.finance/governance/proposals/mills/6',
            chainId: NetworkIds.mainnet,
        },
        {
            address: '0x07de0318c24D67141e6758370e9D7B6d863635AA',
            name: 'Growth Working Group',
            shortName: 'GWG',
            purpose: 'Handle Investments & Costs regarding Growth',
            governanceLink: 'https://www.inverse.finance/governance/proposals/mills/5',
            chainId: NetworkIds.mainnet,
        },
        {
            address: '0xa40FBd692350C9Ed22137F97d64E6Baa4f869E8C',
            name: 'Community Working Group',
            shortName: 'CWG',
            purpose: 'Boost Community participation and improve On-Boarding',
            governanceLink: 'https://www.inverse.finance/governance/proposals/mills/14',
            chainId: NetworkIds.mainnet,
        },
        {
            address: '0x943dBdc995add25A1728A482322F9b3c575b16fb',
            name: 'Bug Bounty Program',
            shortName: 'BBP',
            purpose: 'Handle rewards for Bug Bounties',
            governanceLink: 'https://www.inverse.finance/governance/proposals/mills/17',
            chainId: NetworkIds.mainnet,
        },
        {
            address: '0x49BB4559e65fc5f2236780079265d2f8F4f75c03',
            name: 'Analytics Working Group',
            shortName: 'AWG',
            purpose: 'Handle analytics costs (The Graph etc)',
            governanceLink: 'https://www.inverse.finance/governance/proposals/mills/25',
            chainId: NetworkIds.mainnet,
        },
        {
            address: '0xE3eD95e130ad9E15643f5A5f232a3daE980784cd',
            name: 'Risk Working Group',
            shortName: 'RWG',
            purpose: 'Assumes Guardian role',
            governanceLink: 'https://www.inverse.finance/governance/proposals/mills/42',
            chainId: NetworkIds.mainnet,
        },
        {
            address: '0x8F97cCA30Dbe80e7a8B462F1dD1a51C32accDfC8',
            name: 'Fed Chair',
            shortName: 'FedChair',
            purpose: 'Manage Fed Policies',
            chainId: NetworkIds.mainnet,
        },
        // '0x77C64eEF5F4781Dd6e9405a8a77D80567CFD37E0': 'Rewards Committee',
    ],
};

export const EXTRA_CONFIG = {
    "1": mainConfig,
    "31337": mainConfig,
    "4": {
        dbr: '0x50e6a8a893bDa08D31ADCA88E8B99cC3f9b2dE9A',
        f2Oracle: '0x20534D6A84C08e86B7700FE943880f30a6A36189',
        f2markets: [{
            name: 'WETH',
            // collateral: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
            collateral: '0xc778417E063141139Fce010982780140Aa0cD5Ab',
            address: '0x8b70f2ED64DcbbeC47bd4b241b4628d7D5d7C30a',
        }],
    }
}