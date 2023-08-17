import { CHAIN_ID } from "./constants";

type Features = {
    firmMinDebt: boolean
}

const defaultFeatures: Features = {
    firmMinDebt: false,
}

export const CHAIN_FEATURE_FLAGS = {
    "1": defaultFeatures,
}

export const FEATURE_FLAGS: Features = CHAIN_FEATURE_FLAGS[CHAIN_ID] || defaultFeatures;