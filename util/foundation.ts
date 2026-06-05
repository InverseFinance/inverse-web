import { JsonRpcSigner } from '@ethersproject/providers';
import { Contract } from 'ethers';
import { INVERSE_FOUNDATION_FUNDER_ABI } from '@app/config/abis';
import { INVERSE_FOUNDATION_FUNDER } from '@app/config/constants';
import { parseUnits } from 'ethers/lib/utils';

export const foundationPull = (
    signer: JsonRpcSigner,
    token: string,
    amount: string,
    decimals: number,
    to: string,
    reason: string,
) => {
    const contract = new Contract(INVERSE_FOUNDATION_FUNDER, INVERSE_FOUNDATION_FUNDER_ABI, signer);
    return contract.pull(token, parseUnits(amount, decimals), to, reason);
};

export const foundationSetDelegate = (
    signer: JsonRpcSigner,
    delegate: string,
    token: string,
    limitAmount: string,
    decimals: number,
    interval: number,
) => {
    const contract = new Contract(INVERSE_FOUNDATION_FUNDER, INVERSE_FOUNDATION_FUNDER_ABI, signer);
    return contract.setDelegate(delegate, token, parseUnits(limitAmount, decimals), interval);
};

export const foundationRemoveDelegate = (
    signer: JsonRpcSigner,
    delegate: string,
    token: string,
) => {
    const contract = new Contract(INVERSE_FOUNDATION_FUNDER, INVERSE_FOUNDATION_FUNDER_ABI, signer);
    return contract.setDelegate(delegate, token, 0, 1);
};
