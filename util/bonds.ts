import { BOND_V2_ABI, BOND_V2_FIXED_TELLER_ABI } from "@app/config/abis";
import { Bond, BondV2 } from "@app/types";
import { BOND_V2_REFERRER } from "@app/variables/bonds";
import { JsonRpcSigner, Provider } from "@ethersproject/providers";
import { parseUnits } from "@ethersproject/units";
import { Contract } from "ethers";

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
    recipient: string,
) => {
    const contract = getBondV2FixedTellerContract(bond.teller, signer);

    const minAmount = parseFloat(amount) - maxSlippagePerc / 100 * parseFloat(amount);

    const amountUint = parseUnits(amount, bond.underlying.decimals);
    const minAmountUint = parseUnits(minAmount.toFixed(bond.underlying.decimals), bond.underlying.decimals);
    
    return contract.purchase(recipient, BOND_V2_REFERRER, bond.id, amountUint, minAmountUint);
}