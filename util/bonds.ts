import { BOND_V2_ABI, BOND_V2_FIXED_TELLER_ABI } from "@app/config/abis";
import { Bond } from "@app/types";
import { JsonRpcSigner } from "@ethersproject/providers";
import { parseUnits } from "@ethersproject/units";
import { Contract } from "ethers";

export const getBondV2Contract = (bondAddress: string, signer: JsonRpcSigner) => {
    return new Contract(bondAddress, BOND_V2_ABI, signer);
}

export const getBondV2FixedTellerContract = (teller: string, signer: JsonRpcSigner) => {
    return new Contract(teller, BOND_V2_FIXED_TELLER_ABI, signer);
}

export const bondV2Deposit = (
    bond: Bond,
    signer: JsonRpcSigner,
    amount: string,
    maxSlippagePerc: number,
    recipient: string,
) => {
    const contract = getBondV2FixedTellerContract(bond.teller, signer);

    const minAmount = parseFloat(amount) - maxSlippagePerc / 100 * parseFloat(amount);

    const amountUint = parseUnits(amount, bond.underlying.decimals);
    const minAmountUint = parseUnits(minAmount.toFixed(bond.underlying.decimals), bond.underlying.decimals);
    console.log(contract)
    console.log(recipient)
    console.log(bond.referrer)
    console.log(bond.id)
    console.log(amountUint.toString())
    console.log(minAmountUint.toString())
    // return contract.purchaseBond(bond.id, amountUint, minAmountUint);
    return contract.purchase(recipient, bond.referrer, bond.id, amountUint, '1');
}