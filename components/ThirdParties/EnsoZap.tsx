import { Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import { useEffect, useState } from "react";

import { EthXe, ensoZap, useEnso, useEnsoRoute } from "@app/util/enso";
import { parseUnits } from "@ethersproject/units";
import { VStack, Text, HStack, Divider, Stack, Input } from "@chakra-ui/react";
import { AssetInput } from "../common/Assets/AssetInput";
import { ZAP_TOKENS_ARRAY } from "./tokenlist";
import { useBalances } from "@app/hooks/useBalances";
import Container from "../common/Container";
import { CHAIN_TOKENS, getToken } from "@app/variables/tokens";
import { getNetwork } from "@app/util/networks";
import { SimpleAssetDropdown } from "../common/SimpleDropdown";
import { NETWORKS } from "@app/config/networks";
import { Token } from "@app/types";
import { SimpleAmountForm } from "../common/SimpleAmountForm";
import { DOLA_BRIDGED_CHAINS } from "@app/config/constants";
import { WarningMessage } from "../common/Messages";
import { SkeletonBlob } from "../common/Skeleton";
import { switchWalletNetwork } from "@app/util/web3";

const zapOptions = [...new Set(ZAP_TOKENS_ARRAY.map(t => t.address))];
const implementedNetworks = NETWORKS
    .filter(n => ['1', ...DOLA_BRIDGED_CHAINS].includes(n.id.toString()))
    .map(n => ({ ...n, label: n.name, value: n.id }));

// const zapTokenOptions = [
//     { label: 'Tokens & LPs', value: 'all' },
//     { label: 'Tokens only', value: 'tokens' },
//     { label: 'LPs only', value: 'lps' },
// ];

function EnsoZap({
    defaultTokenOut = '0xE57180685E3348589E9521aa53Af0BCD497E884d',
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
    const [inited, setInited] = useState(false);
    const [slippage, setSlippage] = useState('1');
    // const [tokenInOption, setTokenInOption] = useState('all');
    // const [tokenOutOption, setTokenOutOption] = useState('lps');
    const [tokenIn, setTokenIn] = useState(''); // dola    
    const [tokenOut, setTokenOut] = useState(defaultTokenOut); // fraxbp

    const tokenInObj = tokenIn ? getToken(CHAIN_TOKENS[chainId || '1'], tokenIn) : CHAIN_TOKENS[chainId || '1'].CHAIN_COIN;
    // const [chainId, setChainId] = useState('1');
    const [targetChainId, setTargetChainId] = useState(defaultTargetChainId || chainId || '1');
    // const { tx: routeTx } = useEnsoRoute(account, chainId, targetChainId, tokenIn, tokenOut);

    const targetNetwork = implementedNetworks.find(n => n.id === targetChainId);
    const [amountIn, setAmountIn] = useState<string>('');
    const [amountOut, setAmountOut] = useState<string>('');

    const fromOptions = ZAP_TOKENS_ARRAY
        .filter(t => t.chainId === chainId)
        .reduce((prev, curr) => {
            const ad = curr.address;
            return { ...prev, [ad]: { ...curr, address: ad.replace(EthXe, '') } }
        }, {});

    const ads = Object.keys(fromOptions).map(ad => ad.replace(EthXe, ''));
    const { balances } = useBalances(ads);

    const toOptions = ensoPools?.filter(t => t.chainId.toString() === targetChainId.toString())
        // .filter(t => tokenOutOption === 'lps' && t.isLP || tokenOutOption === 'tokens' && !t.isLP || tokenOutOption === 'all')
        .map(t => ({ ...t, label: t.name, value: t.poolAddress, subtitle: t.project }))

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
        if (inited || !chainId) return;
        setTargetChainId(chainId.toString());
        setTokenIn('');
        changeTokenOut(defaultTokenOut || toOptions[0]?.value);
        setInited(true);
    }, [inited, chainId, targetChainId, toOptions, defaultTokenOut]);

    useEffect(() => {
        setTargetChainId(defaultTargetChainId);
    }, [defaultTargetChainId])

    const approveDestinationAddress = ensoSmartWalletAddress;
    const isLoading = !ads.length || !balances;

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

                    <Stack spacing="2" direction={{ base: 'columns', md: 'row' }} justify="space-between" w='full'>
                        <HStack>
                            <Text>To</Text>
                            <SimpleAssetDropdown
                                list={implementedNetworks}
                                selectedValue={targetChainId}
                                handleChange={(v) => setTargetChainId(v.value)}
                            />
                        </HStack>
                        <SimpleAssetDropdown
                            list={toOptions}
                            selectedValue={tokenOut}
                            handleChange={(v) => setTokenOut(v.value)}
                        />
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
                                address={tokenIn === EthXe ? '' : tokenIn}
                                // destination={routeTx?.to}
                                destination={approveDestinationAddress}
                                hideInput={true}
                                showMaxBtn={false}
                                actionLabel="Zap-in"
                                isDisabled={!amountIn || ((!!tokenIn && tokenIn !== EthXe) && !approveDestinationAddress) || !slippage || !parseFloat(slippage)}
                                alsoDisableApprove={true}
                                btnProps={{ needPoaFirst: true }}
                                signer={provider?.getSigner()}
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
                </VStack>
        }
    </Container>
}

export default EnsoZap