import { Image, useDisclosure, VStack, Text, HStack, Stack } from "@chakra-ui/react"
import { AutoBuyDbrDurationInputs } from "../forms/FirmFormSubcomponents/FirmDbrHelper";
import { useEffect, useState } from "react";
import { useAccount } from "@app/hooks/misc";
import { useAccountDBR, useDBRPrice, useTriCryptoSwap } from "@app/hooks/useDBR";
import EnsoZap from "@app/components/ThirdParties/enso/EnsoZap";
import { useSavingsOpportunities } from "@app/components/sDola/SavingsOpportunities";
import { BUY_LINKS, DBR_ADDRESS } from "@app/config/constants";
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
import { SkeletonBlob } from "@app/components/common/Skeleton";

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
    const { topStable, isLoading: isLoadingStables } = useSavingsOpportunities(account);

    const { debt, dbrExpiryDate, isLoading: isLoadingAccountDBR } = useAccountDBR(account);
    const { priceUsd: dbrPriceUsd } = useDBRPrice();
    const [duration, setDuration] = useState(365);
    const [durationType, setDurationType] = useState('months');
    const [durationTypedValue, setDurationTypedValue] = useState(3);
    const [dbrBuySlippage, setDbrBuySlippage] = useState('0.3');
    const [debtToCover, setDebtToCover] = useState('');
    const [isInited, setIsInited] = useState(false);
    const [now, setNow] = useState(Date.now());
    const [refreshIndex, setRefreshIndex] = useState(0);

    const _debtToCover = parseFloat(debtToCover || '0') || 0;

    const dbrNeeded = _debtToCover / 365 * duration;
    const dbrUsdCost = dbrNeeded * dbrPriceUsd;
    const { price: dbrRate } = useTriCryptoSwap(dbrUsdCost, 0, 1);
    const effectiveSwapPrice = dbrRate ? 1 / dbrRate : 0;
    const dbrUsdCostWithSlippage = dbrNeeded * effectiveSwapPrice;

    useEffect(() => {
        if (isInited || isLoadingAccountDBR || isLoadingStables || !dbrPriceUsd) return;
        setIsInited(true);
        setDebtToCover(debt.toFixed(0));
    }, [isInited, debt, isLoadingAccountDBR, isLoadingStables, dbrPriceUsd]);

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
                        <VStack h={{ base: 'auto', lg: '338px' }} w='full' justify="space-between" spacing="1" alignItems="flex-start">
                            {dbrDurationInputs}
                            <InfoMessage
                                alertProps={{ w: 'full', fontSize: '14px' }}
                                description={
                                    <VStack spacing="0" w='full' alignItems="flex-start">
                                        <Text>
                                            Amount needed to cover the debt and duration: {dbrNeeded > 0 ? <b style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setRefreshIndex(refreshIndex + 1)}>{preciseCommify(dbrNeeded, 0)} DBR (~{shortenNumber(dbrUsdCostWithSlippage, 2, true)})</b> : '-'}
                                        </Text>
                                        <Text>
                                            Note: You might need to adjust the estimated sell amount to account for price slippage
                                        </Text>
                                    </VStack>
                                }
                            />
                        </VStack>
                    </Container>
                    {
                        !isInited && !!account ? <Container w='full' label="" noPadding m="0" p="0">
                            <SkeletonBlob mt="0" w='full' h={{ base: 'auto', lg: '338px' }} />
                        </Container> : <EnsoZap
                            containerProps={{ h: { base: 'auto', lg: '370px' } }}
                            retriggerUsdConversionKey={`dbr-${duration}-${debtToCover}-${refreshIndex}`}
                            defaultTokenIn={topStable?.token?.address}
                            defaultTokenOut={DBR_ADDRESS}
                            defaultAmountInUSD={dbrUsdCostWithSlippage ? Math.ceil(dbrUsdCostWithSlippage) : undefined}
                            defaultTargetChainId={'1'}
                            ensoPools={[{ poolAddress: DBR_ADDRESS, chainId: 1 }]}
                            introMessage={''}
                            isSingleChoice={true}
                            targetAssetPrice={dbrPriceUsd}
                            isInModal={true}
                            autoConvertAmountWhenTokenChanges={true}
                            resultFormatter={
                                (targetAsset: Token, inputAsset: Token, zapResponseData: { amountOut: number }, targetAssetPrice: number, inputAssetPrice: number, amountIn: string) => {
                                    if ((!duration || !_debtToCover) && !zapResponseData?.amountOut) return <></>;
                                    if (dbrUsdCost < 1 && !zapResponseData?.amountOut) return <InfoMessage alertProps={{ w: 'full', fontSize: '14px' }} description="Trade size too small, at least $1 worth of DBR should be bought" />
                                    const amountOut = zapResponseData?.amountOut ? getBnToNumber(parseUnits(zapResponseData?.amountOut, 0), targetAsset.decimals) : 0;
                                    const refDbrAnchorDate = dbrExpiryDate ? dbrExpiryDate : now;
                                    const newExpiryTimestamp = debtToCalcDepletion ? refDbrAnchorDate + amountOut / debtToCalcDepletion * 31536000000 : refDbrAnchorDate;
                                    const newExpiryDate = getDepletionDate(newExpiryTimestamp, now);
                                    const effectiveZapPrice = amountOut ? inputAssetPrice * parseFloat(amountIn||'0') / amountOut : 0;
                                    return <VStack w='full' justify="space-between" spacing="0" alignItems="flex-start">
                                        <Stack direction={{ base: 'column', sm: 'row' }} spacing="1" w='full' justify="space-between">
                                            <Text color="mainTextColorLight">Estimated amount to receive:</Text>
                                            {
                                                zapResponseData?.isLoading ? <SmallTextLoader pt="10px" width={'90px'} /> : <Text fontWeight="bold">
                                                    {`~${preciseCommify(amountOut, 0)} ${targetAsset.symbol}`}
                                                    {targetAssetPrice ? ` (${smartShortNumber(amountOut * targetAssetPrice, 2, true)})` : ''}
                                                </Text>
                                            }
                                        </Stack>
                                        <Stack direction={{ base: 'column', sm: 'row' }} spacing="1" w='full' justify="space-between">
                                            <Text color="mainTextColorLight">Effective DBR swap price:</Text>
                                            {
                                                zapResponseData?.isLoading ? <SmallTextLoader pt="10px" width={'90px'} /> : <Text fontWeight="bold">
                                                    {effectiveZapPrice ? `~${smartShortNumber(effectiveZapPrice, 6, true)}` : amountOut ? 'unknown' : '-'}
                                                </Text>
                                            }
                                        </Stack>
                                        {
                                            debt > 0 ? <VStack w='full' justify="flex-start" spacing="0" alignItems="flex-start" direction={{ base: 'column', sm: 'row' }}>
                                                <Stack direction={{ base: 'column', sm: 'row' }} justify="space-between" w='full' spacing="1">
                                                    <Text color="mainTextColorLight">Current depletion date:</Text>
                                                    {
                                                        <Text fontWeight="bold">
                                                            {refDbrAnchorDate ? `${getDepletionDate(refDbrAnchorDate, now)} (${fromNow(refDbrAnchorDate)})` : '-'}
                                                        </Text>
                                                    }
                                                </Stack>
                                                <Stack direction={{ base: 'column', sm: 'row' }} spacing="1" justify="space-between" w='full'>
                                                    <Text color="mainTextColorLight">New DBR estimated depletion date:</Text>
                                                    {
                                                        zapResponseData?.isLoading ? <SmallTextLoader pt="10px" width={'90px'} /> : <Text fontWeight="bold">
                                                            {newExpiryDate} ({fromNow(newExpiryTimestamp)})
                                                        </Text>
                                                    }
                                                </Stack>
                                            </VStack> :
                                                !!_debtToCover ? <Stack direction={{ base: 'column', sm: 'row' }} spacing="1" justify="space-between" w='full'>
                                                    <Text color="mainTextColorLight">DBR estimated depletion date:</Text>
                                                    {
                                                        zapResponseData?.isLoading ? <SmallTextLoader pt="10px" width={'90px'} /> : <Text fontWeight="bold">
                                                            {newExpiryDate} ({fromNow(newExpiryTimestamp)})
                                                        </Text>
                                                    }
                                                </Stack> : null
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
                    }
                </Stack>
                <InfoMessage alertProps={{ w: 'full', fontSize: '14px', mt: 4 }} title="Other ways to buy DBR:" description={
                    <VStack spacing="0" w='full' alignItems="flex-start">
                        <Text>
                            - In most cases you can use the <Link textDecoration="underline" href={BUY_LINKS.DBR} isExternal target="_blank">
                                Defillama aggregator <ExternalLinkIcon />
                            </Link>
                        </Text>
                        <Text>
                            - For larger DBR purchases we recommend to use <Link textDecoration="underline" href="https://swap.cow.fi/#/1/advanced/0x865377367054516e17014CcdED1e7d814EDC9ce4/0xAD038Eb671c44b853887A7E32528FaB35dC5D710?tab=all&page=1" isExternal target="_blank">
                                CoW Swap TWAP <ExternalLinkIcon />
                            </Link>
                        </Text>
                        {/* <Text>
                            - For smaller DBR purchases you might get a better price by selling DOLA with the <Link textDecoration="underline" href={'/dbr/auction'} isExternal target="_blank">
                                DBR auctions
                            </Link>
                        </Text> */}
                        <Text>
                            - If you prefer to not sell an asset to buy DBR, you can also use the <b>auto-buy</b> or <b>extend</b> features on the market pages (adds the cost as debt).
                        </Text>
                    </VStack>
                } />
            </VStack>
        </VStack>
    </SimpleModal>
}