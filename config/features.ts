import { CHAIN_ID } from "./constants";

type Features = {
    firmMinDebt: boolean
    firmLeverage: boolean
    lpZaps: boolean
    firmDbrRewardsHelper: boolean
}

const envFlags = process.env.NEXT_PUBLIC_FF?.length
    ? process.env.NEXT_PUBLIC_FF.split(',') : ['true', 'false', 'false', 'false'];

const defaultFeatures: Features = {
    firmMinDebt: envFlags[0] === 'true',
    firmLeverage: envFlags[1] === 'true',
    lpZaps: envFlags[2] === 'true',
    firmDbrRewardsHelper: envFlags[3] === 'true',
}

export const CHAIN_FEATURE_FLAGS = {
    "1": defaultFeatures,
    "31337": { ...defaultFeatures, firmLeverage: true },
}

export const FEATURE_FLAGS: Features = CHAIN_FEATURE_FLAGS[CHAIN_ID] || defaultFeatures;
export const INV_STAKED_MIN_FOR_EXTRA_FEATURES = 10;
// Unlock some features to INV stakers first as an exclusive benefit
export const INV_STAKERS_ONLY = {
    firmLeverage: false,
    lpZaps: false,
}
export const isInvPrimeMember = (invStaked = 0) => {
    return invStaked >= INV_STAKED_MIN_FOR_EXTRA_FEATURES;
}