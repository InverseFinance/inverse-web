import { Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import { useEffect, useMemo, useState } from "react";

import { EthXe, ensoZap, useEnso, useEnsoRoute } from "@app/util/enso";
import { formatUnits, parseUnits } from "@ethersproject/units";
import { VStack, Text, HStack, Divider, Stack, Input } from "@chakra-ui/react";
import { AssetInput } from "../../common/Assets/AssetInput";
import { ZAP_TOKENS_ARRAY } from "../tokenlist";
import { useBalances } from "@app/hooks/useBalances";
import Container from "../../common/Container";
import { CHAIN_TOKENS, getToken } from "@app/variables/tokens";
import { getNetwork } from "@app/util/networks";
import { SimpleAssetDropdown } from "../../common/SimpleDropdown";
import { NETWORKS } from "@app/config/networks";
import { Token } from "@app/types";
import { SimpleAmountForm } from "../../common/SimpleAmountForm";
import { WarningMessage } from "../../common/Messages";
import { SkeletonBlob } from "../../common/Skeleton";
import { switchWalletNetwork } from "@app/util/web3";
import { useDebouncedEffect } from "@app/hooks/useDebouncedEffect";
import { EnsoRouting } from "./EnsoRouting";
import { useIsApproved } from "@app/hooks/useApprovals";

const zapOptions = [...new Set(ZAP_TOKENS_ARRAY.map(t => t.address))];

function EnsoZap({
    defaultTokenOut = '',
    defaultTargetChainId = '',
    ensoPools,
    title = null,
}: {
    defaultTokenOut: string
    defaultTargetChainId?: string
    ensoPools: any[]
    title?: string | null
}) {
    const { provider, account, chainId } = useWeb3React<Web3Provider>();
    const { address: ensoSmartWalletAddress } = useEnso(account, chainId);
    const [slippage, setSlippage] = useState('1');
    const [lastChainId, setLastChainId] = useState(chainId);

    const [tokenIn, setTokenIn] = useState('');
    const [tokenOut, setTokenOut] = useState(defaultTokenOut);

    const tokenInObj = tokenIn ? getToken(CHAIN_TOKENS[chainId || '1'], tokenIn) : CHAIN_TOKENS[chainId || '1'].CHAIN_COIN;
    const [targetChainId, setTargetChainId] = useState(defaultTargetChainId || chainId || '1');
    const tokenOutObj = tokenOut ? getToken(CHAIN_TOKENS[targetChainId || '1'], tokenOut) : CHAIN_TOKENS[targetChainId || '1'].CHAIN_COIN;
    const availableChainIds = [...new Set(ensoPools.map(ep => ep.chainId.toString()))];

    const implementedNetworks = useMemo(() => {
        return NETWORKS
            .filter(n => availableChainIds.includes(n.id.toString()))
            .map(n => ({ ...n, label: n.name, value: n.id }))
    }, [NETWORKS, availableChainIds, ensoPools]);

    const targetNetwork = implementedNetworks.find(n => n.id === targetChainId);
    const [amountIn, setAmountIn] = useState<string>('');
    const [zapRequestData, setZapRequestData] = useState<any>({});

    const approveDestinationAddress = ensoSmartWalletAddress;
    const { isApproved } = useIsApproved(tokenIn, approveDestinationAddress, account, amountIn);

    const zapResponseData = useEnsoRoute(isApproved, zapRequestData.account, zapRequestData.chainId, zapRequestData.targetChainId, zapRequestData.tokenIn, zapRequestData.tokenOut, zapRequestData.amountIn);

    const fromOptions = ZAP_TOKENS_ARRAY
        .filter(t => t.chainId === chainId)
        .reduce((prev, curr) => {
            const ad = curr.address;
            return { ...prev, [ad]: { ...curr, address: ad.replace(EthXe, '') } }
        }, {});

    const ads = Object.keys(fromOptions).map(ad => ad.replace(EthXe, ''));
    const { balances } = useBalances(ads);

    const toOptions = useMemo(() => {
        return ensoPools?.filter(t => t.chainId.toString() === targetChainId.toString())
            .map(t => ({ ...t, label: t.name, value: t.poolAddress, subtitle: t.project }))
    }, [targetChainId]);

    const fromAssetInputProps = { tokens: fromOptions, balances, showBalance: true }

    const changeTokenIn = (newToken: Token) => {
        setTokenIn(newToken.address);
    }
    const changeTokenOut = (newToken: string) => {
        setTokenOut(newToken);
    }
    const changeAmount = (v) => {
        setAmountIn(v);
    }

    useEffect(() => {
        if (!chainId) return;
        // changing chain => native coin by default as tokenIn
        if(chainId !== lastChainId){
            setTokenIn('');
            setLastChainId(chainId);
        }
    }, [chainId, lastChainId]);

    useEffect(() => {
        if (!targetChainId) return;
        const foundToken = toOptions.find(t => t.value.toLowerCase() === defaultTokenOut.toLowerCase());
        changeTokenOut(!!foundToken ? foundToken.value : toOptions[0]?.value);
    }, [targetChainId, toOptions, defaultTokenOut]);

    useDebouncedEffect(() => {
        if (!chainId || !targetChainId || !tokenOut || !amountIn) {
            setZapRequestData({});
            return
        }
        const amountInValue = amountIn && tokenInObj?.decimals ? formatUnits(parseUnits(amountIn, tokenInObj?.decimals), 0) : '';
        setZapRequestData({ account, chainId, targetChainId, tokenIn, tokenOut, amountIn: amountInValue });
    }, [account, chainId, targetChainId, tokenIn, tokenOut, amountIn, tokenInObj]);
   
    const isLoading = !ads.length || !balances;

    const resetForm = () => {
        setAmountIn('');
    }

    const handleSuccess = () => {
        resetForm();
    }

    return <Container w='full' noPadding p='0' label={title} contentProps={{ mt: 0 }}>
        {
            !account ? <WarningMessage
                alertProps={{ w: 'full' }}
                title="Wallet not connected"
                description="Please connect your wallet to use the Zap feature"
            /> : isLoading ? <SkeletonBlob />
                :
                <VStack alignItems='flex-start' w="full" direction="column" spacing="5">
                    <Text>
                        From <b>{getNetwork(chainId)?.name}</b>:
                    </Text>
                    <AssetInput
                        amount={amountIn}
                        token={tokenInObj}
                        assetOptions={zapOptions}
                        onAssetChange={(newToken) => changeTokenIn(newToken)}
                        onAmountChange={(newAmount) => changeAmount(newAmount, true)}
                        {...fromAssetInputProps}
                    />

                    <Divider />

                    <Stack alignItems="center" spacing="2" direction={{ base: 'columns', md: 'row' }} justify="space-between" w='full'>
                        <HStack>
                            <Text>To</Text>
                            <SimpleAssetDropdown
                                list={implementedNetworks}
                                selectedValue={targetChainId}
                                handleChange={(v) => setTargetChainId(v.value)}
                            />
                        </HStack>
                        {
                            toOptions?.length ? <SimpleAssetDropdown
                                list={toOptions}
                                selectedValue={tokenOut}
                                handleChange={(v) => setTokenOut(v.value)}
                            /> : <Text>No options for this chain</Text>
                        }
                    </Stack>

                    <HStack w='full' justify="space-between">
                        <Text>
                            Max. slippage %:
                        </Text>
                        <Input py="0" maxH="30px" w='90px' value={slippage} onChange={(e) => setSlippage(e.target.value.replace(/[^0-9.]/, '').replace(/(\..*)\./g, '$1'))} />
                    </HStack>

                    {
                        chainId?.toString() !== targetChainId?.toString() ? <WarningMessage
                            alertProps={{ w: 'full' }}
                            title="Wrong Network"
                            description={
                                <Text textDecoration="underline" cursor="pointer"
                                    onClick={() => switchWalletNetwork(targetChainId)}
                                >
                                    Switch to {targetNetwork?.name}
                                </Text>
                            }
                        />
                            :
                            <SimpleAmountForm
                                defaultAmount={amountIn}
                                address={tokenIn === EthXe ? '' : tokenIn}
                                decimals={tokenInObj?.decimals}
                                destination={approveDestinationAddress}
                                hideInput={true}
                                showMaxBtn={false}
                                actionLabel="Zap-in"
                                isDisabled={!zapResponseData?.route || !amountIn || ((!!tokenIn && tokenIn !== EthXe) && !approveDestinationAddress) || !slippage || !parseFloat(slippage)}
                                alsoDisableApprove={!amountIn || ((!!tokenIn && tokenIn !== EthXe) && !approveDestinationAddress) || !slippage || !parseFloat(slippage)}
                                btnProps={{ needPoaFirst: true }}
                                signer={provider?.getSigner()}                                
                                approveForceRefresh={true}
                                onSuccess={() => handleSuccess()}
                                onAction={
                                    () => {
                                        if (!provider) return;
                                        return ensoZap(provider?.getSigner(), {
                                            fromAddress: account,
                                            tokenIn,
                                            tokenOut,
                                            chainId: chainId?.toString(),
                                            targetChainId,
                                            amount: parseUnits(amountIn, tokenInObj.decimals).toString(),
                                            toEoa: true,
                                            slippage: parseFloat(slippage) * 100,
                                        })
                                    }
                                }
                            />
                    }
                    {
                        isApproved && zapResponseData?.isLoading && <Text>
                            Loading route and price impact...
                        </Text>
                    }
                    {
                        isApproved && !!zapResponseData?.error && <Text color="warning" fontSize="14px">
                            {zapResponseData?.error?.toString()}
                        </Text>
                    }
                    {
                        !zapResponseData?.error && zapResponseData?.route && <EnsoRouting
                            chainId={chainId?.toString()}
                            targetChainId={targetChainId?.toString()}
                            targetAsset={tokenOutObj}
                            amountOut={zapResponseData.amountOut}
                            routes={zapResponseData.route}
                            priceImpactBps={zapResponseData.priceImpact}
                            isLoading={zapResponseData.isLoading}
                        />
                    }
                </VStack>
        }
    </Container>
}

export default EnsoZap