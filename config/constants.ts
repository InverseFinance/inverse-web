import { GovEra } from '@app/types';

export const START_BLOCK = 11498340;
export const ETH_MANTISSA = 1e18;
export const SECONDS_PER_BLOCK = parseFloat(process.env.NEXT_PUBLIC_CHAIN_SECONDS_PER_BLOCK!);
export const SECONDS_PER_DAY = 24 * 60 * 60;
export const BLOCKS_PER_SECOND = 1 / SECONDS_PER_BLOCK;
export const BLOCKS_PER_DAY = BLOCKS_PER_SECOND * SECONDS_PER_DAY;
export const DAYS_PER_YEAR = 365;
// 2336000
export const BLOCKS_PER_YEAR = BLOCKS_PER_DAY * DAYS_PER_YEAR;

export const BLOCK_SCAN = 'https://blockscan.com';

// Governance
export const QUORUM_VOTES = 4000;

// Migration
export const OLD_XINV = process.env.NEXT_PUBLIC_REWARD_STAKED_TOKEN_OLD
export const HAS_REWARD_TOKEN = !!process.env.NEXT_PUBLIC_REWARD_TOKEN;

export const CURRENT_ERA = GovEra.mills;

export const GRACE_PERIOD_MS = 1209600000; // 14 days in milliseconds
export const PROPOSAL_DURATION = 259200 * 1000 // 3 days in milliseconds
export const DRAFT_SIGN_MSG = `Inverse Finance Draft Signature

✅ This is to verify your rights regarding the publishing and edition of drafts

✅ This action does not cost anything
`
export const FED_POLICY_SIGN_MSG = "Inverse Finance Fed Policy Update Signature"

export const BURN_ADDRESS = '0x0000000000000000000000000000000000000000'

export const DRAFT_WHITELIST = ["0x6535020cceb810bdb3f3ca5e93de2460ff7989bb","0xb9f43e250dadf6b61872307396ad1b8beba27bcd","0x3fcb35a1cbfb6007f9bc638d388958bc4550cb28","0xe58ed128325a33afd08e90187db0640619819413","0x724f321c4efed5e3c7cca40168610c258c82d02f","0x7165ac4008c3603afe432787419eb61b3a2cee8b","0xfda9365e2cdf21d72cb0dc4f5ff46f29e4ac59ce","0x962228a90eac69238c7d1f216d80037e61ea9255","0xad4a190d4aea2180b66906537f1fd9700c83842a","0xbb20d477d4f22d7169ad4c5bd67984362be8bad0","0xed9376094ce37635827e0cfddc23bfbb6d788469","0x32c9e3a608464f8d72fc8fd1e58a1bbe4e5a28fc","0x2723723fdd3db8ba2d6f0e1b333e90a7e60a0411","0x9F3614afb3Df9f899caDBFfaA05c6C908059F726","0x1f7e8b2C4289Ff033A1Db980c9FDb40CCF29294f"].map(a => a.toLowerCase());

export const REFUND_TX_SIGN_MSG = "Inverse Finance Refund Signature"