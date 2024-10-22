import { BigNumber } from "ethers";
import { JsonRpcSigner } from "@ethersproject/providers";
import useSWR from 'swr';
import { CHAIN_TOKENS, getToken } from "@app/variables/tokens";
import { lowercaseObjectKeys } from "./misc";
import { getBnToNumber, getSymbolFromUnderlyingTokens, homogeneizeLpName } from "./markets";
import { PROTOCOLS_BY_IMG, PROTOCOL_DEFILLAMA_MAPPING } from "@app/variables/images";
import { NetworkIds } from "@app/types";
import { useState } from "react";
import { useInterval } from "@chakra-ui/react";
import { formatUnits, parseUnits } from "@ethersproject/units";

const key = 'eb19e745-81bb-4ffc-b40e-04dccf6edb6a'
export const EthXe = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

export type EnsoZapOptions = {
    fromAddress: string,
    amount: BigNumber | string,
    chainId: string,
    tokenIn: string,
    tokenOut: string,
    slippage?: string,
    toEoa?: string,
    targetChainId?: string,
}

export type EnsoPool = {
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
    tokenAddress: string,
    amount: string,
    decimals = 18
) => {
    const { data, error } = useSWR(`enso-${fromAddress}-${chainId}-${tokenAddress}-${amount}`, async () => {
        if (!fromAddress || !chainId) return null;
        if(tokenAddress) {
            return await getEnsoApproveToken(fromAddress, chainId, tokenAddress, formatUnits(parseUnits(amount, decimals), 0));
        }
        return await getEnsoApprove(fromAddress, chainId);
    });

    return {
        address: data?.address || '',
        isDeployed: data?.isDeployed || false,
        isLoading: !data && !error,
        error,
    }
}
// get the route to know where to approve
export const useEnsoRoute = (
    isApproved = false,
    fromAddress: string,
    chainId: string,
    targetChainId: string,
    tokenIn: string,
    tokenOut: string,
    amount: string,
    refreshIndex = 0
) => {
    const [tsMinute, setTsMinute] = useState((new Date()).toISOString().substring(0, 16));

    useInterval(() => {
        setTsMinute((new Date()).toISOString().substring(0, 16));
    }, 60100);

    const { data, error } = useSWR(
        `enso-route-${chainId}-${targetChainId}-${tokenIn}-${tokenOut}-${amount}-${isApproved}-${tsMinute}-${refreshIndex}`,
        async () => {
            if (!isApproved || !fromAddress || chainId?.toString() !== targetChainId?.toString() || !chainId || !tokenOut || !targetChainId || !amount || !parseFloat(amount)) {
                return null;
            }
            return await ensoZap(null, {
                fromAddress,
                amount,
                chainId,
                targetChainId,
                tokenIn,
                tokenOut,
                slippage: '100',
                toEoa: 'true',
            });
        }, {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        errorRetryInterval: 9000,
    });
    return {
        ...data,
        isLoading: !data && !(!chainId || !tokenOut || !targetChainId || !amount) && !error,
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
    const { data, error } = useSWR(`enso-pools-${symbol}-v1`, async () => {
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
        pools: (data || []).filter(p => ![NetworkIds.bsc, NetworkIds.ftm].includes(p.chainId.toString())),
        isLoading: !data && !error,
        error,
    }
}

// the api gives an address per user, the user needs to approve this given address to spend their tokens
export const getEnsoApproveToken = async (fromAddress: string, chainId = 1, tokenAddress: string, amount: string) => {
    const path = `https://api.enso.finance/api/v1/wallet/approve?chainId=${chainId}&fromAddress=${fromAddress}&tokenAddress=${tokenAddress}&amount=${amount}&routingStrategy=router`;
    const res = await fetch(path, {
        headers: {
            'accept': "*/*",
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`,
        },
    });
    const { spender, isDeployed } = await res.json();
    return { address: spender, isDeployed }
}

export const getEnsoApprove = async (fromAddress: string, chainId = 1) => {
    const path = `https://api.enso.finance/api/v1/wallet?chainId=${chainId}&fromAddress=${fromAddress}`;
    const res = await fetch(path, {
        headers: {
            'accept': "*/*",
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`,
        },
    });
    const { address, isDeployed } = await res.json();
    return { address, isDeployed }
}

// the api gives an address per user, the user needs to approve this given address to spend their tokens
export const getEnsoPools = async (params): Promise<EnsoPool[]> => {
    const queryString = new URLSearchParams(params).toString();
    const path = `https://api.enso.finance/api/v1/tokens?type=defi&chainId=1&includeMetadata=true&underlyingTokens=0x865377367054516e17014CcdED1e7d814EDC9ce4,0xef484de8C07B6e2d732A92B5F78e81B38f99f95E,0xfb5137Aa9e079DB4b7C2929229caf503d0f6DA96,0x8272E1A3dBef607C04AA6e5BD3a1A134c8ac063B`;
    // const path = `https://api.enso.finance/api/v1/tokens?type=defi&chainId=1&includeMetadata=true&primaryAddress=0xcC2EFb8bEdB6eD69ADeE0c3762470c38D4730C50`;
    // const path = `https://api.enso.finance/api/v1/positions?${queryString}`;
    const res = await fetch(path, {
        headers: {
            'accept': "*/*",
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`,
        },
    });
    const result = await res.json();
    let list = []
    try {
        // list = result.baseTokens
        //     .map(bt => {
        //         const isAlreadyInDefiTokens = result.defiTokens.find(dt => dt.poolAddress.toLowerCase() === bt.address.toLowerCase());
        //         if (isAlreadyInDefiTokens) return null;
        //         const chainTokens = lowercaseObjectKeys(CHAIN_TOKENS[bt.chainId]);
        //         const foundTokenConfig = chainTokens[bt.address.toLowerCase()];
        //         const underlyingTokens = foundTokenConfig ? foundTokenConfig?.pairs?.filter(pt => pt.toLowerCase() !== bt.address.toLowerCase()) : [];
        //         if (!foundTokenConfig || !foundTokenConfig.isLP) return null;
        //         const symbol = homogeneizeLpName(foundTokenConfig.symbol);
        //         return { isEnsoBaseToken: true, ...bt, poolAddress: foundTokenConfig.address, apy: 0, underlyingTokens, rewardTokens: [], subtitle: symbol, symbol, name: foundTokenConfig.name, project: PROTOCOL_DEFILLAMA_MAPPING[PROTOCOLS_BY_IMG[foundTokenConfig.protocolImage]] };
        //     })
        //     .filter(bt => bt !== null)
        //     .concat(result.defiTokens.map(dt => {
        //         const chainTokens = lowercaseObjectKeys(CHAIN_TOKENS[dt.chainId]);
        //         const foundTokenConfig = chainTokens[dt.poolAddress.toLowerCase()];
        //         const attemptSymbol = foundTokenConfig ? foundTokenConfig.symbol : getSymbolFromUnderlyingTokens(dt.chainId, dt.underlyingTokens);
        //         const symbol = homogeneizeLpName(attemptSymbol);
        //         return { ...dt, symbol }
        //     }));
        list = result.data.map(dt => {
            const chainTokens = lowercaseObjectKeys(CHAIN_TOKENS[dt.chainId]);
            const foundTokenConfig = chainTokens[dt.address.toLowerCase()];
            const attemptSymbol = foundTokenConfig ? foundTokenConfig.symbol : getSymbolFromUnderlyingTokens(dt.chainId, dt.underlyingTokens.map(ut => ut.address));
            const symbol = homogeneizeLpName(attemptSymbol);
            return { ...dt, poolAddress: dt.address, symbol }
        })
    } catch (e) {
        console.error(e);
    }
    return list;
}

export const ensoZap = async (
    signer: JsonRpcSigner | null,
    options: EnsoZapOptions,
) => {
    if (options.targetChainId?.toString() !== options.chainId?.toString()) {
        return ensoCrossChainZap(signer, options);
    }
    return ensoSameChainZap(signer, options);
}

export const ensoSameChainZap = async (
    signer: JsonRpcSigner | null,
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
    const isEth = !tokenIn || tokenIn === EthXe;
    const _tokenIn = !tokenIn ? EthXe : tokenIn;
    let path = `https://api.enso.finance/api/v1/shortcuts/route?chainId=${chainId}&fromAddress=${fromAddress}&amountIn=${amount}&slippage=${slippage}&tokenIn=${_tokenIn}&tokenOut=${tokenOut}&priceImpact=true&routingStrategy=router`;
    if (toEoa) {
        path += `&receiver=${fromAddress}`;
        if (!isEth) {
            path += `&spender=${fromAddress}`            
            // path += `&tokenInAmountToApprove=${amount}`
        } else {            
            // path += `&tokenInAmountToTransfer=${amount}`
        }
    }
    const res = await fetch(path, {
        method: 'GET',
        headers: {
            'accept': "*/*",
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`,
        },
    });

    const data = await res.json();
    if (res.status !== 200 || !data.tx) {
        console.warn(data);
        throw new Error(`The Enso api failed to fetch the route, please try again later`);
    }
    if (!signer) return data;
    const { tx, gas } = data

    return signer.sendTransaction({
        ...tx,
        gasLimit: BigNumber.from(gas).add(50000),
    })
}
// still experimental
export const ensoCrossChainZap = async (
    signer: JsonRpcSigner | null,
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
            "slippage": slippage.toString(),
            "in": {
                "sourceChainId": Number(chainId),
                "token": _tokenIn.toLowerCase()
            },
            "out": {
                "destinationChainId": Number(targetChainId),
                "token": tokenOut.toLowerCase()
            },
            "fromAddress": fromAddress
        })
    });

    const data = await res.json();
    if (!signer) return data;
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

export const getEnsoItemUnderlyingTokens = (ep: any) => {
    if (!ep.underlyingTokens || ep.underlyingTokens?.length <= 1) {
        const foundLpToken = getToken(CHAIN_TOKENS[ep.chainId], ep.poolAddress);
        if (!!foundLpToken) {
            return foundLpToken.pairs?.filter(ad => ad !== ep.poolAddress);
        }
    }
    return ep.underlyingTokens;
}