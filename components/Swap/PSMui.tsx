import { VStack, Text, Stack, HStack, Divider } from "@chakra-ui/react"
import { useWeb3React } from "@web3-react/core";
import { SimpleAmountForm } from "../common/SimpleAmountForm";
import { useState } from "react";
import { getNetworkConfigConstants } from "@app/util/networks";
import Container from "../common/Container";
import { InfoMessage, WarningMessage } from "@app/components/common/Messages";
import { preciseCommify } from "@app/util/misc";
import { useDebouncedEffect } from "@app/hooks/useDebouncedEffect";
import { getBnToNumber, shortenNumber, } from "@app/util/markets";
import useEtherSWR from "@app/hooks/useEtherSWR";
import { parseUnits } from "@ethersproject/units";
import { SmallTextLoader } from "../common/Loaders/SmallTextLoader";
import { Contract } from "ethers";
import { PSM_ABI } from "@app/config/abis";
import Link from "../common/Link";
import ScannerLink from "../common/ScannerLink";

const { DOLA } = getNetworkConfigConstants();

const PsmInfo = ({
    feePerc,
    liquidity,
    symbol,
}: {
    feePerc: number;
    liquidity: number;
    symbol: string;
}) => {
    return <VStack spacing="1" w='full' alignItems="flex-start">
        <Text>
            Fee: <b>{feePerc}%</b>
        </Text>
        <Text>
            Liquidity: <b>{shortenNumber(liquidity, 2, false, true)} {symbol}</b>
        </Text>
    </VStack>
}

const swap = (
    isBuyDola,
    inAmount,
    inDecimals,
    psm,
    signer,
) => {
    const contract = new Contract(psm, PSM_ABI, signer);
    const inAmountBn = parseUnits(inAmount, inDecimals);
    if (isBuyDola) {
        return contract.buy(inAmountBn);
    } else {
        return contract.sell(inAmountBn);
    }
}

export const PSMui = ({
    collateral,
    collateralSymbol,
    collateralDecimals,
    psm,
}: {
    collateral: string;
    collateralSymbol: string;
    collateralDecimals: number;
    psm: string;
}) => {
    const { provider, account: connectedAccount } = useWeb3React();

    const [inAmount, setInAmount] = useState('');
    const [isConnected, setIsConnected] = useState(true);
    const [isBuyDola, setIsBuyDola] = useState(true);

    const { data: psmData } = useEtherSWR(
        [
            // dola balance in PSM
            [DOLA, 'balanceOf', psm],
            // collateral balance in PSM
            [psm, 'getTotalReserves'],
            [psm, 'buyFeeBps'],
            [psm, 'sellFeeBps'],
            [psm, 'getProfit'],
            [psm, 'supply'],
            [psm, 'minTotalSupply'],
        ]
    );

    const inToken = isBuyDola ? collateral : DOLA;
    const inDecimals = isBuyDola ? collateralDecimals : 18;
    const outDecimals = isBuyDola ? 18 : collateralDecimals;
    const inSymbol = isBuyDola ? collateralSymbol : 'DOLA';
    const outSymbol = isBuyDola ? 'DOLA' : collateralSymbol;

    const { data: outAmountBn, error: outAmountError } = useEtherSWR(
        [
            psm,
            isBuyDola ? 'getDolaOut' : 'getCollateralOut',
            !!inAmount && parseFloat(inAmount) > 0 ? parseUnits(inAmount, inDecimals).toString() : '0',
        ],
    );

    const isLoadingOutAmount = !outAmountBn && !outAmountError;

    const dolaLiquidity = psmData ? getBnToNumber(psmData[0]) : 0;
    const collateralLiquidity = psmData ? getBnToNumber(psmData[1], collateralDecimals) : 0;
    const buyFeePerc = psmData ? getBnToNumber(psmData[2], 2) : 0;
    const sellFeePerc = psmData ? getBnToNumber(psmData[3], 2) : 0;

    const outAmount = outAmountBn ? getBnToNumber(outAmountBn, outDecimals) : 0;
    const outAmountFormatted = outAmount ? preciseCommify(outAmount, 2, false) : '0';

    const profit = psmData ? getBnToNumber(psmData[4], 18) : 0;
    const profitFormatted = profit ? preciseCommify(profit, 2, false) : '0';

    const supply = psmData ? getBnToNumber(psmData[5], 18) : 0;
    const minTotalSupply = psmData ? getBnToNumber(psmData[6], 18) : 0;

    useDebouncedEffect(() => {
        setIsConnected(!!connectedAccount);
    }, [connectedAccount], 500);

    const noLiquidity = parseFloat(inAmount) > dolaLiquidity;

    const handleAction = async () => {
        if (!provider?.getSigner()) { return }
        return swap(isBuyDola, inAmount, inDecimals, psm, provider?.getSigner());
    }

    return <Stack direction={'column'} alignItems={'center'} justify="space-around" w='full' spacing="12" >
        <Container
            label={`Peg Stability Module`}
            description={`Between ${collateralSymbol} and DOLA`}
            href={`https://etherscan.io/address/${psm}`}
            noPadding
            m="0"
            p="0"
            maxW='600px'
        >
            <VStack spacing="4" alignItems="flex-start" w='full'>
                {
                    !isConnected ? <InfoMessage alertProps={{ w: 'full' }} description="Please connect your wallet" />
                        :
                        <VStack w='full' alignItems="flex-start">
                            <HStack w='full' justify="space-between">
                                <Text fontSize="22px">
                                    Sell <b>{inSymbol}</b> for <b>{outSymbol}</b>:
                                </Text>
                                <VStack cursor="pointer" spacing="0" onClick={() => setIsBuyDola(!isBuyDola)}>
                                    <Text color="accentTextColor" fontSize="40px">⇄</Text>
                                </VStack>
                            </HStack>
                            <SimpleAmountForm
                                btnProps={{ needPoaFirst: true }}
                                defaultAmount={inAmount}
                                address={inToken}
                                destination={psm}
                                signer={provider?.getSigner()}
                                decimals={inDecimals}
                                onAction={() => handleAction()}
                                actionLabel={`Sell ${inSymbol} for ${outSymbol}`}
                                maxActionLabel={`Sell all`}
                                onAmountChange={(v) => setInAmount(v)}
                                showMaxBtn={false}
                                showMax={true}
                                isDisabled={!inAmount || noLiquidity}
                                hideInputIfNoAllowance={false}
                                showBalance={true}
                                enableCustomApprove={true}
                            />
                            <Divider />
                            <Text fontSize="16px">
                                You will receive: {isLoadingOutAmount ? <SmallTextLoader width={'90px'} h="12px" /> : <b>{outAmountFormatted} {outSymbol}</b>}
                            </Text>
                            {
                                noLiquidity &&
                                <WarningMessage
                                    alertProps={{ w: 'full' }}
                                    description={`Not enough liquidity for this swap`}
                                />
                            }
                            <InfoMessage
                                alertProps={{ w: 'full' }}
                                // title="PSM Info"
                                description={
                                    <PsmInfo
                                        feePerc={isBuyDola ? buyFeePerc : sellFeePerc}
                                        liquidity={isBuyDola ? dolaLiquidity : collateralLiquidity}
                                        symbol={isBuyDola ? 'DOLA' : collateralSymbol}
                                    />
                                }
                            />
                        </VStack>
                }
            </VStack>
        </Container>

        <Container
            label={`PSM parameters`}
            noPadding
            m="0"
            p="0"
            maxW='600px'
        >
            <VStack spacing="2" alignItems="flex-start" w='full'>
                <HStack w='full' justify="space-between">
                    <Text>
                        DOLA Buy Fee: <b>{buyFeePerc}%</b>
                    </Text>
                    <Text>
                        DOLA Sell Fee: <b>{sellFeePerc}%</b>
                    </Text>
                </HStack>
                <HStack w='full' justify="space-between">
                    <Text>
                        DOLA Liquidity: <b>{shortenNumber(dolaLiquidity, 2)} {outSymbol}</b>
                    </Text>
                    <Text>
                        {collateralSymbol} Liquidity: <b>{shortenNumber(collateralLiquidity, 2)} {collateralSymbol}</b>
                    </Text>
                </HStack>
                <HStack w='full' justify="space-between">
                    <Text>
                        PSM Supply: <b>{shortenNumber(supply, 2)} {collateralSymbol}</b>
                    </Text>
                    <Text>
                        Min. Vault Supply: <b>{shortenNumber(minTotalSupply, 2)} s{collateralSymbol}</b>
                    </Text>
                </HStack>
                <Text>
                    PSM unclaimed profit: <b>{profitFormatted} {collateralSymbol}</b>
                </Text>
                <HStack w='full' justify="space-between">
                    <ScannerLink value={psm} label="PSM Contract" />
                    <Link textDecoration="underline" href="https://www.inverse.finance/governance/proposals/mills/311" isExternal target="_blank">
                        PSM Governance Proposal
                    </Link>
                </HStack>
            </VStack>
        </Container>
    </Stack>
}