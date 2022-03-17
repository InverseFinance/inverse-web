import { JsonRpcSigner } from '@ethersproject/providers';
import { Contract } from 'ethers';
import { getNetworkConfigConstants } from '@app/util/networks';
import { NetworkIds } from '@app/types';
import { DOLA_PAYROLL_ABI, VESTER_ABI } from '@app/config/abis';

const { DOLA_PAYROLL } = getNetworkConfigConstants(NetworkIds.mainnet);

export const payrollWithdraw = (signer: JsonRpcSigner) => {
    const contract = new Contract(DOLA_PAYROLL, DOLA_PAYROLL_ABI, signer);
    return contract.withdraw();
}

export const vesterClaim = (signer: JsonRpcSigner, vesterAd: string) => {
    const contract = new Contract(vesterAd, VESTER_ABI, signer);
    return contract.claim();
}

export const vesterChangeDelegate = (signer: JsonRpcSigner, vesterAd: string, newDelegate: string) => {
    const contract = new Contract(vesterAd, VESTER_ABI, signer);
    return contract.delegate(newDelegate);
}