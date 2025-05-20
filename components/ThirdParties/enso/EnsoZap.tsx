import { Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import { useEffect, useMemo, useState } from "react";

import { EthXe, ensoZap, useEnso, useEnsoRoute } from "@app/util/enso";
import { formatUnits, parseEther, parseUnits } from "@ethersproject/units";
import { VStack, Text, HStack, Divider, Stack, Input, Box } from "@chakra-ui/react";
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
import { InfoMessage, WarningMessage } from "../../common/Messages";
import { SkeletonBlob } from "../../common/Skeleton";
import { switchWalletNetwork } from "@app/util/web3";
import { useDebouncedEffect } from "@app/hooks/useDebouncedEffect";
import { EnsoRouting } from "./EnsoRouting";
import { useIsApproved } from "@app/hooks/useApprovals";
import { useAccount } from "@app/hooks/misc";
import Link from "@app/components/common/Link";
import { usePricesDefillama, usePricesV2 } from "@app/hooks/usePrices";
import { ETH_SAVINGS_STABLECOINS } from "@app/components/sDola/SavingsOpportunities";
import { SDOLA_ADDRESS } from "@app/config/constants";
import { stakeDola } from "@app/util/dola-staking";
const zapOptions = [...new Set(ZAP_TOKENS_ARRAY.map(t => t.address))];

const removeUndefined = obj => Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined)
);

const defaultFromTextProps = {
    fontWeight: 'bold',
}

const CHAIN_TOKENS_EXTENDED = { ...CHAIN_TOKENS, '1': { ...ETH_SAVINGS_STABLECOINS, ...CHAIN_TOKENS["1"] } }

function EnsoZap({
    defaultTokenIn = '',
    defaultTokenOut = '',
    defaultTargetChainId = '',
    ensoPools,
    title = null,
    introMessage = null,
    isSingleChoice = false,
    targetAssetPrice = 0,
    isInModal = true,
    fromText = "From",
    fromTextProps = defaultFromTextProps,
}: {
    defaultTokenIn?: string
    defaultTokenOut: string
    defaultTargetChainId?: string
    ensoPools: any[]
    title?: string | null
    introMessage?: string | null
    isSingleChoice?: boolean
    targetAssetPrice?: number
    isInModal?: boolean
    fromText?: string | null
    fromTextProps?: any
}) {
    const account = useAccount();
    const { provider, chainId } = useWeb3React<Web3Provider>();

    const [isConnected, setIsConnected] = useState(true);
    const [isInited, setIsInited] = useState(false);
    const [slippage, setSlippage] = useState('0.1');
    const [refreshIndex, setRefreshIndex] = useState(0);
    const [lastChainId, setLastChainId] = useState(chainId);

    const [tokenIn, setTokenIn] = useState(defaultTokenIn);
    const [tokenOut, setTokenOut] = useState(defaultTokenOut);

    const tokenInObj = tokenIn ? getToken(CHAIN_TOKENS_EXTENDED[chainId || '1'], tokenIn) : CHAIN_TOKENS_EXTENDED[chainId || '1'].CHAIN_COIN;

    const [targetChainId, setTargetChainId] = useState(defaultTargetChainId || chainId || '1');
    const tokenOutObj = tokenOut ? getToken(CHAIN_TOKENS_EXTENDED[targetChainId || '1'], tokenOut) : CHAIN_TOKENS_EXTENDED[targetChainId || '1'].CHAIN_COIN;

    const isDolaStakingFromDola = tokenInObj?.symbol === 'DOLA' && tokenOutObj?.symbol === 'sDOLA';

    const availableChainIds = [...new Set(ensoPools.map(ep => ep.chainId.toString()))];

    const implementedNetworks = useMemo(() => {
        return NETWORKS
            .filter(n => availableChainIds.includes(n.id.toString()))
            .map(n => ({ ...n, label: n.name, value: n.id }))
    }, [NETWORKS, availableChainIds, ensoPools]);

    const targetNetwork = implementedNetworks.find(n => n.id === targetChainId);
    const [amountIn, setAmountIn] = useState<string>('');
    const [zapRequestData, setZapRequestData] = useState<any>({});

    const { address: spender } = useEnso(account, chainId, tokenIn, amountIn, tokenInObj?.decimals);

    // 0x80EbA3855878739F4710233A8a19d89Bdd2ffB8E universal router
    const approveDestinationAddress = isDolaStakingFromDola ? SDOLA_ADDRESS : spender;
    const { isApproved } = useIsApproved(tokenIn, approveDestinationAddress, account, amountIn);

    const zapResponseData = useEnsoRoute(true, zapRequestData.account, zapRequestData.chainId, zapRequestData.targetChainId, zapRequestData.tokenIn, zapRequestData.tokenOut, zapRequestData.amountIn, refreshIndex);

    const zapTokens = useMemo(() => {
        return ZAP_TOKENS_ARRAY.filter(t => t.chainId === chainId && t.address !== tokenOut);
    }, [ZAP_TOKENS_ARRAY, chainId, tokenOut]);

    const fromOptions = useMemo(() => {
        return zapTokens
            .reduce((prev, curr) => {
                const ad = curr.address;
                return { ...prev, [ad]: { ...curr, address: ad.replace(EthXe, '') } }
            }, {});
    }, [zapTokens]);

    const { prices: pricesV2 } = usePricesV2();
    const { simplifiedPrices: defillamaPrices } = usePricesDefillama(zapTokens.map(t => ({ chain: getNetwork(chainId)?.name, token: t.address })));
    const combinedPrices = useMemo(() => {
        const simplifiedV2Prices = Object.entries(zapTokens).reduce((prev, curr) => ({ ...prev, [curr[1].address]: pricesV2[curr[1].coingeckoId || curr[1].symbol]?.usd }), {});
        return { ...simplifiedV2Prices, ...removeUndefined(defillamaPrices) }
    }, [pricesV2, defillamaPrices]);

    const ads = Object.keys(fromOptions).map(ad => ad.replace(EthXe, ''));
    const { balances } = useBalances(ads);

    const toOptions = useMemo(() => {
        return ensoPools?.filter(t => t.chainId.toString() === targetChainId.toString())
            .map(t => ({ ...t, label: t.name, value: t.poolAddress, subtitle: t.project }))
    }, [targetChainId, ensoPools]);

    const fromOptionsWithBalance = useMemo(() => {
        return ZAP_TOKENS_ARRAY
            .filter(t => t.chainId === chainId && ((!!balances && !!balances[t.address]
                //  && getBnToNumber(balances[t.address], t.decimals) >= 0.01
            ) || t.symbol === 'ETH')

            )
            .reduce((prev, curr) => {
                const ad = curr.address;
                return { ...prev, [ad]: { ...curr, address: ad.replace(EthXe, '') } }
            }, {});
    }, [ZAP_TOKENS_ARRAY, chainId, balances])

    const fromAssetInputProps = { tokens: fromOptionsWithBalance, balances, prices: combinedPrices, showBalance: true, dropdownSelectedProps: { whiteSpace: 'nowrap', w: 'fit-content' }, inputProps: { minW: '200px' } }

    useEffect(() => {
        if (!isInited && tokenIn !== defaultTokenIn && !tokenIn) {
            setTokenIn(defaultTokenIn);
            setIsInited(true);
        }
    }, [defaultTokenIn, tokenIn, isInited]);

    const changeTokenIn = (newToken: Token) => {
        setIsInited(true);
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
        if (chainId !== lastChainId) {
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
        const amountInValue = amountIn && tokenInObj?.decimals ? formatUnits(parseUnits(parseFloat(amountIn).toFixed(tokenInObj?.decimals), tokenInObj?.decimals), 0) : '';
        setZapRequestData({ account, chainId, targetChainId, tokenIn, tokenOut, amountIn: amountInValue });
    }, [account, chainId, targetChainId, tokenIn, tokenOut, amountIn, tokenInObj]);

    useDebouncedEffect(() => {
        setIsConnected(!!account)
    }, [account], 500);

    const isValidAmountIn = useMemo(() => {
        return !!amountIn && parseFloat(amountIn) > 0;
    }, [amountIn]);

    const isLoading = (!ads.length || !balances);

    const resetForm = () => {
        setAmountIn('');
    }

    const handleSuccess = () => {
        resetForm();
    }

    const featureInfo = introMessage ? <InfoMessage
        alertProps={{ w: 'full', fontSize: '14px' }}
        description={introMessage}
    /> : null;

    const thirdPartyInfo = <InfoMessage
        alertProps={{ w: 'full', fontSize: '14px' }}
        description={
            <VStack spacing="0" w='full' alignItems="flex-start">
                <Box display="inline">
                    <Text display="inline">Powered by the third-party&nbsp;</Text>
                    {/* <Text display="inline"><b>Please do your own research</b> before using with the Zap-In feature, which is provided by a <b>third party</b>,&nbsp;</Text> */}
                    <Link display="inline" textDecoration="underline" target="_blank" isExternal={true} href="https://www.enso.finance/">
                        Enso Finance
                    </Link>
                    {/* <Text display="inline">,&nbsp;and has not been audited or endorsed by Inverse Finance</Text>                     */}
                </Box>
                {/* <Text><b>Recommended</b>: use a wallet with transaction simulation like Rabby, helps preview the transaction result and reduce the chances of having failed transactions.</Text> */}
                {/* <Text textDecoration="underline">
                    Inverse Finance does not endorse or audit Enso and the protocols related to this asset.
                </Text> */}
            </VStack>
        }
    />;

    const extraContentProps = useMemo(() => {
        return isInModal ? {} : { mt: 0, border: 'none', p: 0, shadow: 'none' }
    }, [isInModal]);

    return <Container w='full' noPadding p='0' label={title} contentProps={{ ...extraContentProps }}>
        {
            !isConnected ? <WarningMessage
                alertProps={{ w: 'full' }}
                title="Wallet not connected"
                description="Please connect your wallet to use the Zap feature"
            /> : isLoading ? <SkeletonBlob />
                :
                <VStack alignItems='flex-start' w="full" direction="column" spacing={isSingleChoice ? '2' : '5'}>
                    {featureInfo}

                    <Text {...fromTextProps}>
                        {fromText}{!isSingleChoice && <b>&nbsp;{getNetwork(chainId)?.name}</b>}:
                    </Text>

                    <AssetInput
                        amount={amountIn}
                        token={tokenInObj}
                        assetOptions={zapOptions}
                        onAssetChange={(newToken) => {
                            changeAmount('');
                            changeTokenIn(newToken);
                        }}
                        onAmountChange={(newAmount) => changeAmount(newAmount)}
                        allowMobileMode={true}
                        orderByWorth={true}
                        orderByBalance={false}
                        {...fromAssetInputProps}
                    />

                    {
                        !isSingleChoice && <Divider />
                    }

                    <Stack alignItems="center" spacing="2" direction={{ base: 'columns', md: 'row' }} justify="space-between" w='full'>
                        {
                            !isSingleChoice && <HStack>
                                <Text>To</Text>
                                <SimpleAssetDropdown
                                    list={implementedNetworks}
                                    selectedValue={targetChainId}
                                    handleChange={(v) => setTargetChainId(v.value)}
                                />
                            </HStack>
                        }
                        {
                            toOptions?.length > 1 ? <SimpleAssetDropdown
                                list={toOptions}
                                selectedValue={tokenOut}
                                handleChange={(v) => setTokenOut(v.value)}
                            /> : toOptions?.length === 1 ? null : <Text>No options for this chain</Text>
                        }
                    </Stack>

                    {
                        !isDolaStakingFromDola && <HStack w='full' justify="space-between">
                            <Text color="mainTextColorLight">
                                Max. slippage %:
                            </Text>
                            <Input color="mainTextColorLight" borderColor="mainTextColorLight" py="0" maxH="30px" w='90px' value={slippage} onChange={(e) => setSlippage(e.target.value.replace(/[^0-9.]/, '').replace(/(\..*)\./g, '$1'))} />
                        </HStack>
                    }

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
                                enableCustomApprove={true}
                                address={tokenIn === EthXe ? '' : tokenIn}
                                decimals={tokenInObj?.decimals}
                                // destination={routeTx?.to}
                                destination={approveDestinationAddress}
                                checkBalanceOnTopOfIsDisabled={true}
                                hideInput={true}
                                showMaxBtn={false}
                                actionLabel={isDolaStakingFromDola ? `Stake DOLA` : `Zap-In to ${tokenOutObj?.symbol.replace(/ lp$/, ' LP')}`}
                                isDisabled={!zapResponseData?.route || !amountIn || ((!!tokenIn && tokenIn !== EthXe) && !approveDestinationAddress) || !slippage || !parseFloat(slippage)}
                                alsoDisableApprove={!amountIn || ((!!tokenIn && tokenIn !== EthXe) && !approveDestinationAddress) || !slippage || !parseFloat(slippage)}
                                btnProps={{ needPoaFirst: true }}
                                signer={provider?.getSigner()}
                                approveForceRefresh={true}
                                onSuccess={() => handleSuccess()}
                                onAction={
                                    () => {
                                        if (!provider) return;
                                        if (isDolaStakingFromDola) {
                                            return stakeDola(provider?.getSigner(), parseEther(amountIn));
                                        }
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
                        !isDolaStakingFromDola && <>
                            {
                                isValidAmountIn && zapResponseData?.isLoading ? <Text fontWeight="bold">
                                    Loading routes and conversion data...
                                </Text> :
                                    !!amountIn && parseFloat(amountIn) > 0 && <Text textDecoration="underline" cursor="pointer" onClick={() => setRefreshIndex(refreshIndex + 1)}>
                                        Refresh conversion data
                                    </Text>
                            }
                            {
                                (isApproved || !!amountIn) && !!zapResponseData?.error && <Text color="warning" fontWeight="bold" fontSize="14px">
                                    {zapResponseData?.error?.toString()}
                                </Text>
                            }
                        </>
                    }

                    {
                        !zapResponseData?.error && zapResponseData?.route && <EnsoRouting
                            onlyShowResult={isDolaStakingFromDola}
                            chainId={chainId?.toString()}
                            targetChainId={targetChainId?.toString()}
                            targetAsset={tokenOutObj}
                            targetAssetPrice={targetAssetPrice}
                            amountOut={zapResponseData.amountOut}
                            routes={zapResponseData.route}
                            priceImpactBps={zapResponseData.priceImpact}
                            isLoading={zapResponseData.isLoading}
                        />
                    }

                    {!isDolaStakingFromDola && thirdPartyInfo}
                </VStack>
        }
    </Container>
}

export default EnsoZap