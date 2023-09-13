import { Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import { useState } from "react";

import { WidgetProps } from "@socket.tech/plugin";

import { ensoApprove, ensoZapArbBalancer, ensoZapArbBalancerExit } from "@app/util/enso";
import { RSubmitButton } from "../common/Button/RSubmitButton";
import { parseEther } from "@ethersproject/units";
import { VStack, Text, HStack, Divider } from "@chakra-ui/react";
import { AssetInput } from "../common/Assets/AssetInput";
import { ENSO_INTEGRATIONS, ZAP_TOKENS_ARRAY } from "./tokenlist";
import { useBalances } from "@app/hooks/useBalances";
import Container from "../common/Container";
import { CHAIN_TOKENS, getToken } from "@app/variables/tokens";
import { getNetwork } from "@app/util/networks";
import { SimpleAssetDropdown } from "../common/SimpleDropdown";
import { NETWORKS } from "@app/config/networks";
import { Network } from "@app/types";

const zapOptions = [...new Set(ZAP_TOKENS_ARRAY.map(t => t.address))];
const chainIdsWithZaps = [...new Set(Object.keys(ENSO_INTEGRATIONS).map(v => v.split('-')[0]))];
const implementedNetworks = NETWORKS.filter(n => chainIdsWithZaps.includes(n.id)).map(n => ({ ...n, label: n.name, value: n.id }));

const zapTokenOptions = [
    { label: 'Tokens & LPs', value: 'all' },
    { label: 'Tokens only', value: 'tokens' },
    { label: 'LPs only', value: 'lps' },
]

function EnsoZap({
    defaultSourceNetwork = 1,
    defaultDestNetwork = 1,
    enableSameChainSwaps = true,
    defaultSourceToken = 'USDC',
    defaultDestToken = 'DOLA',
}: Partial<WidgetProps>) {
    const { provider, account, chainId } = useWeb3React<Web3Provider>();
    const [enable, setEnable] = useState(false);
    const [tokenInOption, setTokenInOption] = useState('all');
    const [tokenOutOption, setTokenOutOption] = useState('lps');
    const [tokenIn, setTokenIn] = useState(getToken(CHAIN_TOKENS[chainId || '1'], 'DOLA')); // dola
    const [tokenOut, setTokenOut] = useState('0xE57180685E3348589E9521aa53Af0BCD497E884d'); // fraxbp
    // const [chainId, setChainId] = useState('1');
    const [targetChainId, setTargetChainId] = useState('1');
    const targetNetwork = implementedNetworks.find(n => n.id === targetChainId);
    const [amountIn, setAmountIn] = useState<string>('');
    const [amountOut, setAmountOut] = useState<string>('');

    const fromOptions = ZAP_TOKENS_ARRAY
        .filter(t => t.chainId === chainId)
        .reduce((prev, curr) => {
            return { ...prev, [curr.address]: curr }
        }, {});

    const ads = Object.keys(fromOptions).map(ad => ad.replace('0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', ''));
    const { balances } = useBalances(ads);

    const toOptions = ZAP_TOKENS_ARRAY
        .filter(t => t.chainId.toString() === targetChainId)
        .filter(t => tokenOutOption === 'lps' && t.isLP || tokenOutOption === 'tokens' && !t.isLP || tokenOutOption === 'all')
        .map(t => ({ ...t, label: t.name, value: t.address }))
    // .reduce((prev, curr) => {
    //     return { ...prev, [curr.address]: { ...curr, value: curr.address  } }
    // }, {});

    const fromAssetInputProps = { tokens: fromOptions, balances, showBalance: true }
    const toAssetInputProps = { tokens: toOptions, balances, showBalance: true }

    const changeTokenIn = (newToken: string) => {
        setTokenIn(newToken);
    }
    const changeTokenOut = (newToken: string) => {
        setTokenOut(newToken);
    }
    const changeAmount = (v) => {
        setAmountIn(v);
    }

    return <Container w='full' noPadding p='0' label="Zap-In / Zap-out">
        <VStack alignItems='flex-start' w="full" direction="column" spacing="5">
            <Text>
                From <b>{getNetwork(chainId)?.name}</b>:
            </Text>
            <AssetInput
                amount={amountIn}
                token={tokenIn}
                assetOptions={zapOptions}
                onAssetChange={(newToken) => changeTokenIn(newToken)}
                onAmountChange={(newAmount) => changeAmount(newAmount, true)}
                {...fromAssetInputProps}
            />

            <Divider />

            <HStack spacing="2" justify="space-between" w='full'>
                <HStack>
                    <Text>To</Text>
                    <SimpleAssetDropdown
                        list={implementedNetworks}
                        selectedValue={targetChainId}
                        handleChange={(v) => setTargetChainId(v.value)}
                    />
                </HStack>
            </HStack>

            <HStack w='full' justify="space-between">
                <SimpleAssetDropdown
                    list={zapTokenOptions}
                    selectedValue={tokenOutOption}
                    handleChange={(v) => setTokenOutOption(v.value)}
                />
                <SimpleAssetDropdown
                    list={toOptions}
                    selectedValue={tokenOut}
                    handleChange={(v) => setTokenOut(v.value)}
                />
            </HStack>
        </VStack>
    </Container>
}

export default EnsoZap