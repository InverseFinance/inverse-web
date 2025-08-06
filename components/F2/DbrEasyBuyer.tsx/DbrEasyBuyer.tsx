import { Image, useDisclosure, VStack, Text, HStack, Stack } from "@chakra-ui/react"
import { AutoBuyDbrDurationInputs } from "../forms/FirmFormSubcomponents/FirmDbrHelper";
import { useEffect, useState } from "react";
import { useAccount } from "@app/hooks/misc";
import { useAccountDBR, useDBRPrice, useTriCryptoSwap } from "@app/hooks/useDBR";
import EnsoZap from "@app/components/ThirdParties/enso/EnsoZap";
import { useSavingsOpportunities } from "@app/components/sDola/SavingsOpportunities";
import { DBR_ADDRESS } from "@app/config/constants";
import SimpleModal from "@app/components/common/Modal/SimpleModal";
import { preciseCommify } from "@app/util/misc";
import { getBnToNumber, shortenNumber, smartShortNumber } from "@app/util/markets";
import { InfoMessage } from "@app/components/common/Messages";
import { Token } from "@app/types";
import { parseUnits } from "@ethersproject/units";
import { SmallTextLoader } from "@app/components/common/Loaders/SmallTextLoader";
import { getDepletionDate } from "@app/util/f2";
import { fromNow } from "@app/util/time";
import Container from "@app/components/common/Container";
import Link from "@app/components/common/Link";
import { ExternalLinkIcon } from "@chakra-ui/icons";

export const DbrBuyerTrigger = ({
    children,
}: {
    children: React.ReactNode
}) => {
    const { isOpen, onOpen, onClose } = useDisclosure();
    return <>
        <VStack onClick={onOpen} spacing="0">
            {children}
        </VStack>
        {
            isOpen && <DbrEasyBuyerModal onClose={onClose} />
        }
    </>
}

export const DbrFloatingTrigger = () => {
    return <DbrBuyerTrigger>
        <Image
            src="/assets/v2/dbr-calc.webp"
            position="fixed"
            bottom="20px"
            left="20px"
            w="60px"
            h="60px"
            cursor="pointer"
            zIndex="1"
            borderRadius="full"
            shadow="0 0 10px 0 rgba(0, 0, 0, 0.1)"
            border="1px solid white"
            borderColor="mainTextColor"
            _hover={{
                transform: "scale(1.1)",
                filter: "brightness(1.1)",
                transition: "transform 0.2s ease-in-out"
            }}
        />
    </DbrBuyerTrigger>
}

export const DbrEasyBuyerModal = ({
    onClose,
}: {
    onClose: () => void
}) => {
    const account = useAccount();
    const { topStable } = useSavingsOpportunities(account);

    const { debt, dbrExpiryDate } = useAccountDBR(account);
    const { priceUsd: dbrPriceUsd } = useDBRPrice();
    const [duration, setDuration] = useState(365);
    const [durationType, setDurationType] = useState('months');
    const [durationTypedValue, setDurationTypedValue] = useState(3);
    const [dbrBuySlippage, setDbrBuySlippage] = useState('0.3');
    const [debtToCover, setDebtToCover] = useState('');
    const [isInited, setIsInited] = useState(false);
    const [now, setNow] = useState(Date.now());

    const _debtToCover = parseFloat(debtToCover || '0') || 0;

    const dbrNeeded = _debtToCover / 365 * duration;
    const dbrUsdCost = dbrNeeded * dbrPriceUsd;
    const { price: dbrRate } = useTriCryptoSwap(dbrUsdCost, 0, 1);
    const effectiveSwapPrice = dbrRate ? 1 / dbrRate : 0;
    const dbrUsdCostWithSlippage = dbrNeeded * effectiveSwapPrice;

    useEffect(() => {
        if (isInited || !debt) return;
        setIsInited(true);
        setDebtToCover(debt.toFixed(0));
    }, [isInited, debt]);

    const debtToCalcDepletion = debt > 0 ? debt : _debtToCover;

    const handleDurationChange = (duration: number, typedValue: number, type: string) => {
        setDurationTypedValue(typedValue);
        setDurationType(type);
        setDuration(duration);
    }

    const handleDebtChange = (value: string) => {
        setDebtToCover(value.replace(/[^0-9.]/, '').replace(/(\..*)\./g, '$1'));
    }

    const dbrDurationInputs = <AutoBuyDbrDurationInputs
        duration={duration}
        durationType={durationType}
        durationTypedValue={durationTypedValue}
        handleDurationChange={handleDurationChange}
        dbrBuySlippage={dbrBuySlippage}
        setDbrBuySlippage={setDbrBuySlippage}
        dbrPriceUsd={dbrPriceUsd}
        userDebt={debt}
        debtToCover={debtToCover}
        handleDebtChange={handleDebtChange}
        isDexMode={true}
    />

    return <SimpleModal
        title={
            <VStack w='full' justify="center" spacing="1" alignItems="center">
                <HStack spacing="4" alignItems="center" w='full' maxW="1200px" justify="center">
                    <Text>DBR calculator & buyer</Text>
                    <Image
                        src="/assets/v2/dbr-calc.webp"
                        w="40px"
                        h="40px"
                        borderRadius="full"
                        border="1px solid white"
                        borderColor="mainTextColor"
                    />
                </HStack>
            </VStack>
        }
        isOpen={true}
        onClose={onClose}
        modalProps={{
            scrollBehavior: 'inside',
            minW: { base: '100%' },
            minH: '100%',
            borderRadius: '0px',
        }}
    >
        <VStack p="4" alignItems="center" justify="center" w='full'>
            <VStack w='full' maxW="1200px" justify="flex-start" spacing="1" alignItems="flex-start">
                <InfoMessage alertProps={{ w: 'full', fontSize: '14px' }} description={
                    <VStack spacing="0" w='full' alignItems="flex-start">
                        <Text>
                            This interface calculates the amount of DBR needed to cover a certain debt and duration and pre-fills an estimated amount to sell to buy the calculated DBR.
                        </Text>
                        <Text>
                            Reminder: one DBR allows to borrow one DOLA for one year, or two DOLA for 6 months etc.
                        </Text>
                    </VStack>
                } />
                <Stack direction={{ base: 'column', lg: 'row' }} w='full' justify="space-between" spacing="4">
                    <Container w='full' label="" noPadding m="0" p="0">
                        <VStack h={{ base: 'auto', lg: '318px' }} w='full' justify="flex-start" spacing="1" alignItems="flex-start">
                            {dbrDurationInputs}
                            <InfoMessage
                                alertProps={{ w: 'full', fontSize: '14px' }}
                                description={
                                    <VStack spacing="0" w='full' alignItems="flex-start">
                                        <Text>
                                            Amount needed to cover the debt and duration: {dbrNeeded > 0 ? <b>{preciseCommify(dbrNeeded, 0)} DBR (~{shortenNumber(dbrUsdCost, 2, true)})</b> : '-'}
                                        </Text>
                                        <Text>
                                            Note: You might need to adjust the estimated sell amount to account for price slippage
                                        </Text>
                                    </VStack>
                                }
                            />
                        </VStack>
                    </Container>
                    <EnsoZap
                        containerProps={{ h: { base: 'auto', lg: '350px' } }}
                        defaultTokenIn={topStable?.token?.address}
                        defaultTokenOut={DBR_ADDRESS}
                        defaultAmountIn={dbrUsdCostWithSlippage?.toFixed(0) || ''}
                        defaultTargetChainId={'1'}
                        ensoPools={[{ poolAddress: DBR_ADDRESS, chainId: 1 }]}
                        introMessage={''}
                        isSingleChoice={true}
                        targetAssetPrice={dbrPriceUsd}
                        isInModal={true}
                        onlyFromStables={true}
                        resultFormatter={
                            (targetAsset: Token, zapResponseData: { amountOut: number }, price: number) => {
                                if ((!duration || !_debtToCover) && !zapResponseData?.amountOut) return <></>;
                                if (dbrUsdCost < 1 && !zapResponseData?.amountOut) return <InfoMessage alertProps={{ w: 'full', fontSize: '14px' }} description="Trade size too small, at least $1 worth of DBR should be bought" />
                                const amountOut = zapResponseData?.amountOut ? getBnToNumber(parseUnits(zapResponseData?.amountOut, 0), targetAsset.decimals) : 0;
                                const refDbrAnchorDate = dbrExpiryDate ? dbrExpiryDate : now;
                                const newExpiryTimestamp = debtToCalcDepletion ? refDbrAnchorDate + amountOut / debtToCalcDepletion * 31536000000 : refDbrAnchorDate;
                                const newExpiryDate = getDepletionDate(newExpiryTimestamp, now);
                                return <VStack w='full' justify="space-between" spacing="1" alignItems="flex-start">
                                    <HStack spacing="1" w='full' justify="space-between">
                                        <Text color="mainTextColorLight">Estimated amount to receive:</Text>
                                        {
                                            zapResponseData?.isLoading ? <SmallTextLoader pt="10px" width={'90px'} /> : <Text fontWeight="bold">
                                                {`~${preciseCommify(amountOut, 0)} ${targetAsset.symbol}`}
                                                {price ? ` (${smartShortNumber(amountOut * price, 2, true)})` : ''}
                                            </Text>
                                        }
                                    </HStack>
                                    {
                                        debt > 0 ? <VStack w='full' justify="flex-start" spacing="1" alignItems="flex-start" direction={{ base: 'column', sm: 'row' }}>
                                            <HStack justify="space-between" w='full' spacing="1">
                                                <Text color="mainTextColorLight">Current depletion date:</Text>
                                                {
                                                    <Text fontWeight="bold">
                                                        {newExpiryDate ? `${getDepletionDate(newExpiryDate, now)} (${fromNow(newExpiryDate)})` : '-'}
                                                    </Text>
                                                }
                                            </HStack>
                                            <HStack spacing="1" justify="space-between" w='full'>
                                                <Text color="mainTextColorLight">New DBR estimated depletion date:</Text>
                                                {
                                                    zapResponseData?.isLoading ? <SmallTextLoader pt="10px" width={'90px'} /> : <Text fontWeight="bold">
                                                        {newExpiryDate} ({fromNow(newExpiryTimestamp)})
                                                    </Text>
                                                }
                                            </HStack>
                                        </VStack> :
                                            !!_debtToCover ? <HStack spacing="1" justify="space-between" w='full'>
                                                <Text color="mainTextColorLight">DBR estimated depletion date:</Text>
                                                {
                                                    zapResponseData?.isLoading ? <SmallTextLoader pt="10px" width={'90px'} /> : <Text fontWeight="bold">
                                                        {newExpiryDate} ({fromNow(newExpiryTimestamp)})
                                                    </Text>
                                                }
                                            </HStack> : null
                                    }
                                </VStack>
                            }
                        }
                        fromText={"Asset to sell to Buy DBR with"}
                        fromTextProps={{
                            fontSize: '18px',
                            fontWeight: 'bold',
                        }}
                    />
                </Stack>
                <InfoMessage alertProps={{ w: 'full', fontSize: '14px', mt: 4 }} title="Buying in size?" description={
                    <VStack spacing="0" w='full' alignItems="flex-start">
                        <Text>
                            For large DBR purchases we recommend to use <Link textDecoration="underline" href="https://swap.cow.fi/#/1/advanced/0x865377367054516e17014CcdED1e7d814EDC9ce4/0xAD038Eb671c44b853887A7E32528FaB35dC5D710?tab=all&page=1" isExternal target="_blank">
                                CoW Swap TWAP buys <ExternalLinkIcon />
                            </Link>
                        </Text>
                    </VStack>
                } />
            </VStack>
        </VStack>
    </SimpleModal>
}