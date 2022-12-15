import { BOND_V2_ABI, BOND_V2_FIXED_TELLER_ABI } from "@app/config/abis";
import { Bond, BondV2, UserBondV2 } from "@app/types";
import { BOND_V2_FIXED_TERM_TELLER, BOND_V2_REFERRER } from "@app/variables/bonds";
import { JsonRpcSigner, Provider } from "@ethersproject/providers";
import { parseUnits } from "@ethersproject/units";
import { BigNumber, Contract } from "ethers";

export const getBondV2Contract = (bondAddress: string, signer:  | Provider) => {
    return new Contract(bondAddress, BOND_V2_ABI, signer);
}

export const getBondV2FixedTellerContract = (teller: string, signer: JsonRpcSigner | Provider) => {
    return new Contract(teller, BOND_V2_FIXED_TELLER_ABI, signer);
}

export const bondV2Deposit = (
    bond: BondV2,
    signer: JsonRpcSigner,
    amount: string,
    maxSlippagePerc: number,
    payout: number | string,
    recipient: string,
) => {
    const contract = getBondV2FixedTellerContract(bond.teller, signer);

    const minAmountOut = parseFloat(payout) - maxSlippagePerc / 100 * parseFloat(payout);

    const amountUint = parseUnits(amount, bond.underlying.decimals);
    const minAmountOutUint = parseUnits(minAmountOut.toFixed(18), 18);
    return contract.purchase(recipient, BOND_V2_REFERRER, bond.id, amountUint, minAmountOutUint);
}

export const bondV2Redeem = async (
    bondId: string | BigNumber,
    signer: JsonRpcSigner,
    amount?: string,
) => {
    const contract = getBondV2FixedTellerContract(BOND_V2_FIXED_TERM_TELLER, signer);
    const account = await signer.getAddress();
    const bal = await contract.balanceOf(account, bondId);
    return contract.redeem(bondId, amount||bal);
}