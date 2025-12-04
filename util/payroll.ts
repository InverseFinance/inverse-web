import { JsonRpcSigner } from '@ethersproject/providers';
import { Contract } from 'ethers';
import { getNetworkConfigConstants } from '@app/util/networks';
import { NetworkIds } from '@app/types';
import { DOLA_PAYROLL_ABI, DOLA_PAYROLL_V2_ABI, VESTER_ABI } from '@app/config/abis';
import { DOLA_PAYROLL_V2 } from '@app/config/constants';

const { DOLA_PAYROLL } = getNetworkConfigConstants(NetworkIds.mainnet);

export const payrollWithdraw = (signer: JsonRpcSigner) => {
    const contract = new Contract(DOLA_PAYROLL, DOLA_PAYROLL_ABI, signer);
    return contract.withdraw();
}

export const payrollV2Withdraw = (signer: JsonRpcSigner, amount: number) => {
    const contract = new Contract(DOLA_PAYROLL_V2, DOLA_PAYROLL_V2_ABI, signer);
    return contract.withdraw(amount);
}

export const payrollV2WithdrawMax = async (signer: JsonRpcSigner) => {
    const contract = new Contract(DOLA_PAYROLL_V2, DOLA_PAYROLL_V2_ABI, signer);
    const amount = await contract.balanceOf(signer.getAddress());
    return contract.withdraw(amount);
}

export const vesterClaim = (signer: JsonRpcSigner, vesterAd: string) => {
    const contract = new Contract(vesterAd, VESTER_ABI, signer);
    return contract.claim();
}

export const vesterChangeDelegate = (signer: JsonRpcSigner, vesterAd: string, newDelegate: string) => {
    const contract = new Contract(vesterAd, VESTER_ABI, signer);
    return contract.delegate(newDelegate);
}

export const vesterChangeRecipient = (signer: JsonRpcSigner, vesterAd: string, newRecipient: string) => {
    const contract = new Contract(vesterAd, VESTER_ABI, signer);
    return contract.setRecipient(newRecipient);
}

export const vesterCancel = (signer: JsonRpcSigner, vesterAd: string) => {
    const contract = new Contract(vesterAd, VESTER_ABI, signer);
    return contract.cancel();
}