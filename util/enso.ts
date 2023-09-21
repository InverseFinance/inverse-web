import { BigNumber } from "ethers";
import { JsonRpcSigner } from "@ethersproject/providers";
import useSWR from 'swr';

const key = '033137b3-73c1-4308-8e77-d7e14d3664ca'
export const EthXe = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

type EnsoZapOptions = {
    fromAddress: string,
    amount: BigNumber | string,
    chainId: string,    
    tokenIn: string,
    tokenOut: string,
    slippage?: string,
    toEoa?: string,
    targetChainId?: string,
}

type EnsoPool = {
    apy: number
    chainId: number
    id: string
    name: string
    subtitle: string
    primaryAddress: string
    poolAddress: string
    token: any
    tokenAddress: string
    tvl: number
    underlyingTokens: string[]
    rewardTokens: string[]
    project: string
    protocol: any
}

export const useEnso = (
    fromAddress: string,
    chainId: string,
) => {
    const { data, error } = useSWR(`enso-${fromAddress}-${chainId}`, async () => {
        if (!fromAddress || !chainId) return null;
        return await getEnsoApprove(fromAddress, chainId);
    });
    return {
        address: data?.address||'',
        isDeployed: data?.isDeployed||false,
        isLoading: !data && !error,
        error,
    }
}

export const useEnsoPools = ({
    symbol = 'DOLA',
    chainId = '',
    underlyingAddress = '',
    tokenAddress = '',
    protocol = '',
    project = '',
}) => {
    const { data, error } = useSWR(`enso-pools-${symbol}`, async () => {
        if (!symbol && !chainId && !underlyingAddress && !tokenAddress && !protocol && !project) return null;
        return await getEnsoPools({
            symbol,
            chainId,
            underlyingAddress,
            tokenAddress,
            protocol,
            project
        });
    });
    return {
        pools: data||[],
        isLoading: !data && !error,
        error,
    }
}

// the api gives an address per user, the user needs to approve this given address to spend their tokens
export const getEnsoApprove = async (fromAddress: string, chainId = 1) => {
    const path = `https://api.enso.finance/api/v1/wallet?chainId=${chainId}&fromAddress=${fromAddress}`;
    const res = await fetch(path, {
        headers: {
            'Content-Type': 'application/json',
        },
    });
    const { address, isDeployed } = await res.json();
    return { address, isDeployed }
}

// the api gives an address per user, the user needs to approve this given address to spend their tokens
export const getEnsoPools = async (params): Promise<EnsoPool[]> => {
    const queryString = new URLSearchParams(params).toString();
    const path = `https://api.enso.finance/api/v1/defiTokens?${queryString}`;
    const res = await fetch(path, {
        headers: {
            'Content-Type': 'application/json',
        },
    });
    return await res.json();
}

export const ensoZap = async (
    signer: JsonRpcSigner,
    options: EnsoZapOptions,
) => {
    if(options.targetChainId !== options.chainId) {
        return ensoCrossChainZap(signer, options);
    }
    return ensoSameChainZap(signer, options);
}

export const ensoSameChainZap = async (
    signer: JsonRpcSigner,
    options: EnsoZapOptions,
) => {
    const {
        fromAddress,
        amount,
        chainId,
        tokenIn,
        tokenOut,
        slippage = '300',
        toEoa = 'true',
    } = options;
    const _tokenIn = !tokenIn ? EthXe : tokenIn;
    const path = `https://api.enso.finance/api/v1/shortcuts/route?chainId=${chainId}&fromAddress=${fromAddress}&tokenInAmountToApprove=${amount}&tokenInAmountToTransfer=${amount}&amountIn=${amount}&minAmountOut=${amount}&slippage=${slippage}&tokenIn=${_tokenIn}&tokenOut=${tokenOut}&toEoa=${toEoa}`;
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

export const ensoCrossChainZap = async (
    signer: JsonRpcSigner,
    options: EnsoZapOptions,
) => {
    const {
        fromAddress,
        amount,
        chainId,
        targetChainId,
        tokenIn,
        tokenOut,
        slippage = '100',// 1%
        toEoa = 'true',
    } = options;
    const _tokenIn = !tokenIn ? EthXe : tokenIn;
    const path = `https://api.enso.finance/api/experimental/multichain/shortcut/route`;
    const res = await fetch(path, {
        method: 'POST',
        headers: {
            'accept': "*/*",
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            toEoa,
            "amountIn": amount,
            "slippage": slippage,
            "in": {
                "sourceChainId": Number(chainId),
                "token": _tokenIn
            },
            "out": {
                "destinationChainId": Number(targetChainId),
                "token": tokenOut
            },
            "fromAddress": fromAddress
        })
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

export const ensoBuilderExample = async (signer: JsonRpcSigner) => {
    const path = `https://api.enso.finance/api/v1/shortcuts/builder?chainId=42161&fromAddress=0x6535020cCeB810Bdb3F3cA5e93dE2460FF7989BB`;
    const res = await fetch(path, {
        method: 'POST',
        headers: {
            'accept': "*/*",
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`,
        },
        body: JSON.stringify({
            "calls": [
                {
                    "address": "0x8bc65Eed474D1A00555825c91FeAb6A8255C2107",
                    "method": "balanceOf",
                    "args": [
                        "0x99ace069a54a94980910133b1142d82b4fc6890d"
                    ]
                },
                {
                    "address": "0x8bc65Eed474D1A00555825c91FeAb6A8255C2107",
                    "method": "transfer",
                    "args": [
                        "0x6535020cCeB810Bdb3F3cA5e93dE2460FF7989BB",
                        {
                            "useOutputOfCallAt": 0
                        }
                    ]
                }
            ]
        })
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