import { CHAIN_ID } from "./constants";

type Features = {
    firmMinDebt: boolean
    firmLeverage: boolean
    lpZaps: boolean
}

const defaultFeatures: Features = {
    firmMinDebt: true,
    firmLeverage: false,
    lpZaps: false,
}

export const CHAIN_FEATURE_FLAGS = {
    "1": defaultFeatures,
    "31337": { ...defaultFeatures, firmLeverage: true },
}

export const FEATURE_FLAGS: Features = CHAIN_FEATURE_FLAGS[CHAIN_ID] || defaultFeatures;