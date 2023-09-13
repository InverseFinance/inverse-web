import { BigNumber } from "ethers";
import { fetcher } from "./web3";
import { JsonRpcSigner } from "@ethersproject/providers";

const key = '033137b3-73c1-4308-8e77-d7e14d3664ca'

// the api gives an address per user, the user needs to approve this given address to spend their tokens
export const ensoApprove = async (fromAddress: string, chainId = 1) => {
    const path = `https://api.enso.finance/api/v1/wallet?chainId=${chainId}&fromAddress=${fromAddress}`;
    const res = await fetch(path, {
        headers: {
            'Content-Type': 'application/json',
        },
    });
    const { address, isDeployed } = await res.json();    
    return { address, isDeployed }
}

export const ensoZapArbBalancer = async (signer: JsonRpcSigner, fromAddress: string, amount: BigNumber | string) => {
    const path = `https://api.enso.finance/api/v1/shortcuts/route?chainId=42161&fromAddress=${fromAddress}&tokenInAmountToApprove=${amount}&tokenInAmountToTransfer=${amount}&amountIn=${amount}&minAmountOut=${amount}&slippage=300&tokenIn=0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee&tokenOut=0x8bc65Eed474D1A00555825c91FeAb6A8255C2107`;
    const res = await fetch(path, {
        method: 'GET',
        headers: {
            'accept': "*/*",
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`,
        },
    });
    const data = await res.json();
    const { tx } = data
    return signer.sendTransaction({
        from: tx.from,
        to: tx.to,
        data: tx.data,
        value: tx.value,
    })
}