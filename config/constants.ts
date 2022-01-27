import { GovEra } from '@app/types';

export const START_BLOCK = 11498340;
export const ETH_MANTISSA = 1e18;
export const SECONDS_PER_BLOCK = parseFloat(process.env.NEXT_PUBLIC_CHAIN_SECONDS_PER_BLOCK!);
export const SECONDS_PER_DAY = 24 * 60 * 60;
export const BLOCKS_PER_SECOND = 1 / SECONDS_PER_BLOCK;
export const BLOCKS_PER_DAY = BLOCKS_PER_SECOND * SECONDS_PER_DAY;
export const DAYS_PER_YEAR = 365;
export const BLOCKS_PER_YEAR = BLOCKS_PER_DAY * DAYS_PER_YEAR;

export const BLOCK_SCAN = 'https://blockscan.com';

// Governance
export const QUORUM_VOTES = 4000;

// Migration
export const OLD_XINV = process.env.NEXT_PUBLIC_REWARD_STAKED_TOKEN_OLD

export const CURRENT_ERA = GovEra.mills;
export const STABILIZER_FEE = 0.004

export const GRACE_PERIOD_MS = 1209600000; // 14 days in milliseconds
export const PROPOSAL_DURATION = 259200 * 1000 // 3 days in milliseconds
export const DRAFT_SIGN_MSG = `Inverse Finance Draft Signature

✅ This is to verify your rights regarding the publishing and edition of drafts

✅ This action does not cost anything
`