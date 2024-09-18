import { GovEra, NetworkIds } from '@app/types';

export const START_BLOCK = 11498340;
export const ETH_MANTISSA = 1e18;
export const SECONDS_PER_BLOCK = parseFloat(process.env.NEXT_PUBLIC_CHAIN_SECONDS_PER_BLOCK!);
export const SECONDS_PER_DAY = 24 * 60 * 60;
export const BLOCKS_PER_SECOND = 1 / SECONDS_PER_BLOCK;
export const BLOCKS_PER_DAY = BLOCKS_PER_SECOND * SECONDS_PER_DAY;
export const DAYS_PER_YEAR = 365;
export const ONE_DAY_SECS = 86400;
export const ONE_DAY_MS = 86400000;
export const WEEKS_PER_YEAR = 365 / 7;
// 2336000
export const BLOCKS_PER_YEAR = BLOCKS_PER_DAY * DAYS_PER_YEAR;

export const BLOCK_SCAN = 'https://blockscan.com';

export const SERVER_BASE_URL = process.env.VERCEL_ENV === 'production' ? 'https://inverse.finance' : !process.env.VERCEL_URL ? 'http://localhost:3000' : `https://${process.env.VERCEL_URL}`;

// Governance
export const QUORUM_VOTES = 7000;
export const OLD_QUORUM_VOTES = 4000;

// Migration
export const OLD_XINV = process.env.NEXT_PUBLIC_REWARD_STAKED_TOKEN_OLD
export const HAS_REWARD_TOKEN = !!process.env.NEXT_PUBLIC_REWARD_TOKEN;

export const CURRENT_ERA = GovEra.mills;

export const GRACE_PERIOD_MS = 1209600000; // 14 days in milliseconds
export const PROPOSAL_DURATION = 259200 * 1000 // 3 days in milliseconds
export const SIGN_MSG = `Inverse Finance Signature

✅ This is to verify your rights

✅ This action does not cost anything
`
export const FED_POLICY_SIGN_MSG = "Inverse Finance Fed Policy Update Signature"

export const BURN_ADDRESS = '0x0000000000000000000000000000000000000000'

export const DRAFT_WHITELIST = ["0x6535020cceb810bdb3f3ca5e93de2460ff7989bb","0xb9f43e250dadf6b61872307396ad1b8beba27bcd","0x3fcb35a1cbfb6007f9bc638d388958bc4550cb28","0xe58ed128325a33afd08e90187db0640619819413","0x724f321c4efed5e3c7cca40168610c258c82d02f","0x7165ac4008c3603afe432787419eb61b3a2cee8b","0xfda9365e2cdf21d72cb0dc4f5ff46f29e4ac59ce","0x962228a90eac69238c7d1f216d80037e61ea9255","0xad4a190d4aea2180b66906537f1fd9700c83842a","0xbb20d477d4f22d7169ad4c5bd67984362be8bad0","0xed9376094ce37635827e0cfddc23bfbb6d788469","0x32c9e3a608464f8d72fc8fd1e58a1bbe4e5a28fc","0x2723723fdd3db8ba2d6f0e1b333e90a7e60a0411","0x9F3614afb3Df9f899caDBFfaA05c6C908059F726","0x1f7e8b2C4289Ff033A1Db980c9FDb40CCF29294f","0x23B43ce86e9Cd75A362E24E3daf788C5A72E900f","0xEC092c15e8D5A48a77Cde36827F8e228CE39471a", "0xC555347d2b369B074be94fE6F7Ae9Ab43966B884", "0x7efe8e14eCfcB3FF349253A9925A8818A8Ce5480", "0x759a159D78342340EbACffB027c05910c093f430"].map(a => a.toLowerCase());
export const CHAIN_ID = process.env.NEXT_PUBLIC_CHAIN_ID!;

export const BUY_LINKS = {
    'INV': 'https://swap.defillama.com/?chain=ethereum&from=0x865377367054516e17014ccded1e7d814edc9ce4&to=0x41d5d79431a913c4ae7d69a668ecdfe5ff9dfb68',
    'DOLA': 'https://swap.defillama.com/?chain=ethereum&from=0x6b175474e89094c44da98b954eedeac495271d0f&to=0x865377367054516e17014ccded1e7d814edc9ce4',
    'DBR': 'https://swap.defillama.com/?chain=ethereum&from=0x865377367054516e17014ccded1e7d814edc9ce4&to=0xAD038Eb671c44b853887A7E32528FaB35dC5D710',
}

export const DOLA_BRIDGED_CHAINS = [NetworkIds.ftm, NetworkIds.optimism, NetworkIds.bsc, NetworkIds.arbitrum, NetworkIds.polygon, NetworkIds.avalanche, NetworkIds.base, NetworkIds.mode, NetworkIds.blast];
export const INV_BRIDGED_CHAINS = [NetworkIds.ftm];

export const DWF_PURCHASER = '0x58dCB47956De1e99B1AF0ceb643727EF66aF4647';
export const DEFAULT_FIRM_HELPER_TYPE = 'curve-v2'

export const DBR_AUCTION_ADDRESS = '0x933cBE81313d9dD523dF6dC9B899A7AF8Ba073e3';
export const DBR_AUCTION_HELPER_ADDRESS = '0xC7D5E6FA4D5B4b4A82b14a256008DAfAF5232ADb';

export const DOLA_SAVINGS_ADDRESS = '0xE5f24791E273Cb96A1f8E5B67Bc2397F0AD9B8B4';
export const SDOLA_ADDRESS = '0xb45ad160634c528Cc3D2926d9807104FA3157305';
export const SDOLA_HELPER_ADDRESS = '0x3B3E4541975B9D754E27A8D68F259089D35fcA61';

export const DBR_DISTRIBUTOR_ADDRESS = '0xdcd2D918511Ba39F2872EB731BB88681AE184244';

// sINV V1 addresses
export const SINV_ADDRESS_V1 = '0x857b87171C99C234AC7DCD6A96859e78B1D1A625';
export const SINV_ESCROW_ADDRESS_V1 = '0x8Ef8b4e428bcA13DB563844F864Df0b7268AdBAC';
export const SINV_HELPER_ADDRESS_V1 = '0xF060959747310D172a0Ef12B019d9128E87ECfBE';

// sINV V2 addresses
export const SINV_ADDRESS = '0x08d23468A467d2bb86FaE0e32F247A26C7E2e994';
export const SINV_ESCROW_ADDRESS = '0x5d2062751a100B384215af7dbaCd49398d120943';
export const SINV_HELPER_ADDRESS = '0x43A766DB039617fDfAdDDc1863cAE2F690cFA7bc';