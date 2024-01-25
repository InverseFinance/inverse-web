import { ROutlineButton, RSubmitButton } from "@app/components/common/Button/RSubmitButton"
import { Input } from "@app/components/common/Input"
import { InfoMessage } from "@app/components/common/Messages"
import { TextInfo } from "@app/components/common/Messages/TextInfo"
import { Modal } from "@app/components/common/Modal"
import { F2_ESCROW_ABI } from "@app/config/abis"
import { BURN_ADDRESS } from "@app/config/constants"
import { useAccount } from "@app/hooks/misc"
import { useAppTheme } from "@app/hooks/useAppTheme"
import { useAccountDBR, useAccountF2Markets, useDBRMarkets, useTriCryptoSwap } from "@app/hooks/useDBR"
import useEtherSWR from "@app/hooks/useEtherSWR"
import { useStakedInFirm } from "@app/hooks/useFirm"
import { usePrices } from "@app/hooks/usePrices"
import { ZapperToken } from "@app/types"
import { claimDbrAndSell } from "@app/util/firm-extra"
import { getNumberToBn, shortenNumber, smartShortNumber } from "@app/util/markets"
import { preciseCommify } from "@app/util/misc"
import { getNetworkConfigConstants } from "@app/util/networks"
import { TOKEN_IMAGES } from "@app/variables/images"
import { ChevronDownIcon, ChevronRightIcon } from "@chakra-ui/icons"
import { VStack, Image, useDisclosure, Text, Stack, HStack, Select, RangeSlider, RangeSliderTrack, RangeSliderFilledTrack, RangeSliderThumb, Slider, SliderTrack, SliderFilledTrack, SliderThumb, Divider, Checkbox, FormControl, FormLabel } from "@chakra-ui/react"
import { useWeb3React } from "@web3-react/core"
import { Contract } from "ethers"
import { isAddress } from "ethers/lib/utils"
import { useEffect, useMemo, useState } from "react"

const { F2_DBR_REWARDS_HELPER } = getNetworkConfigConstants();

export const DbrRewardsModal = ({
    isOpen,
    onClose,
    onSuccess,
    dbrRewardsInfo,
}: {
    isOpen: boolean,
    onClose: () => void,
    onSuccess: () => void,
    dbrRewardsInfo: ZapperToken
}) => {
    const { themeStyles } = useAppTheme();
    const { prices } = usePrices();
    const account = useAccount();
    const { provider } = useWeb3React();
    const [isCustomAddress, setIsCustomAddress] = useState(false);
    const [customAddress, setCustomAddress] = useState('');
    const [isFreshlyAuthorized, setIsFreshlyAuthorized] = useState(false);
    const { debt } = useAccountDBR(isCustomAddress && isAddress(customAddress) ? customAddress : account);
    const { markets } = useDBRMarkets();
    const { escrow } = useStakedInFirm(account);
    const { data: claimersData } = useEtherSWR(
        {
            args: !!escrow && escrow !== BURN_ADDRESS ? [
                [escrow, 'claimers', F2_DBR_REWARDS_HELPER],
            ] : [[]],
            abi: F2_ESCROW_ABI,
        }
    );
    const isHelperAllowedAsClaimer = isFreshlyAuthorized || (claimersData ? claimersData[0] : false);
    const accountMarkets = useAccountF2Markets(markets, account);
    const marketsWithDebt = useMemo(() => {
        return accountMarkets.filter(m => m.debt > 0).sort((a, b) => b.debt - a.debt);
    }, [accountMarkets.map(m => m.debt).join('-')]);

    const [slippage, setSlippage] = useState('1');
    const [hasRepay, setHasRepay] = useState(false);
    const [marketToRepay, setMarketToRepay] = useState('');
    const [percentageForInv, setPercentageForInv] = useState(100);
    const [percentageForDola, setPercentageForDola] = useState(0);
    const [percentageRepay, setPercentageRepay] = useState(100);

    // amounts of DOLA and INV for selling DBR
    const { amountOut: dolaAmountOut } = useTriCryptoSwap(dbrRewardsInfo.balance, 1, 0);
    const { amountOut: invAmountOut } = useTriCryptoSwap(dbrRewardsInfo.balance, 1, 2);
    const percentageToReinvest = percentageForInv - percentageForDola;
    const slippageFactor = (1 - parseFloat(slippage) / 100);
    const dolaMinOut = dolaAmountOut ? dolaAmountOut * (percentageForDola / 100) * slippageFactor : 0;
    const invMinOut = invAmountOut ? invAmountOut * (percentageToReinvest / 100) * slippageFactor : 0;

    const dolaPrice = prices ? prices['dola-usd']?.usd : 0;
    const invPrice = prices ? prices['inverse-finance']?.usd : 0;

    const changeSlippage = (e) => {
        setSlippage(e.target.value.replace(/[^0-9.]/, '').replace(/(\..*)\./g, '$1'));
    }

    const authorizeAsClaimer = () => {
        if (!account) return;
        const contract = new Contract(escrow, F2_ESCROW_ABI, provider?.getSigner())
        return contract.setClaimer(F2_DBR_REWARDS_HELPER, true);
    }

    const handleClaim = () => {
        if (!account) return;
        const destinationAddress = isCustomAddress ? customAddress : account;

        const invBps = (percentageToReinvest * 100).toString();
        const dolaBps = (percentageForDola * 100).toString();
        const dolaMinOutBn = getNumberToBn(dolaMinOut);
        const invMinOutBn = getNumberToBn(invMinOut);
        const exchangeData = [destinationAddress, destinationAddress, destinationAddress, dolaMinOutBn, dolaBps, invMinOutBn, invBps];
        const repayData = hasRepay ?
            [marketToRepay, destinationAddress, (percentageRepay * 100).toString()]
            : [BURN_ADDRESS, BURN_ADDRESS, '0'];
        return claimDbrAndSell(provider.getSigner(), exchangeData, repayData);
    }

    const hasInvalidSlippage = (!slippage || slippage === '0' || isNaN(parseFloat(slippage)));
    const hasInvalidMins = (percentageForDola > 0 && !dolaMinOut) || (percentageToReinvest > 0 && !invMinOut);

    // first number: perc of dola, second number: INV
    const handleSellRange = (range: number[]) => {
        const [dola, inv] = range;
        setPercentageForInv(inv);
        setPercentageForDola(dola);
    }

    const handleRepaySlider = (percToReinvest: number) => {
        setPercentageRepay(percToReinvest);
    }

    useEffect(() => {
        if (!marketToRepay && marketsWithDebt?.length === 1) {
            setMarketToRepay(marketsWithDebt[0].address);
        }
    }, [marketToRepay, marketsWithDebt]);

    const dolaInvCombo = <HStack justify="center" alignItems="center">
        <Image borderRadius="50px" src={TOKEN_IMAGES.DOLA} h="14px" w="14px" />
        <Image borderRadius="50px" src={TOKEN_IMAGES.INV} h="14px" w="14px" />
    </HStack>

    return <Modal
        isOpen={isOpen}
        onClose={onClose}
        width="600px"
        maxW="98vw"
        scrollBehavior="inside"
        header={
            <Stack minWidth={24} direction="row" align="center" >
                <Text>
                    Advanced DBR Claim Options
                </Text>
            </Stack>
        }
    >
        <VStack w='full' spacing="8" px="6" py="5" alignItems="flex-start">
            <VStack w='full' spacing="4" alignItems="flex-start">
                <VStack w='full'>
                    <InfoMessage
                        alertProps={{ w: 'full' }}
                        title="Advanced DBR Claim Options:"
                        description={<VStack alignItems="flex-start" spacing="0">
                            <Text>Sell your DBR rewards for INV/DOLA, repay debt in a market.</Text>
                            <Text>When choosing INV, it will <b>automatically be staked in FiRM</b>.</Text>
                        </VStack>
                        }
                    />
                    <HStack w='full' justify="space-between">
                        <Text>DBR rewards: <b>{smartShortNumber(dbrRewardsInfo.balance)} (~{smartShortNumber(dbrRewardsInfo.balanceUSD, 2, true, true)})</b></Text>
                        {
                            debt > 0 && <Text>My total debt: {smartShortNumber(debt, 2)} DOLA</Text>
                        }
                    </HStack>
                </VStack>
                <Divider borderColor="#ccc" />
                <VStack w='full' alignItems="flex-start">
                    <Text>
                        Claim and sell DBR rewards for:
                    </Text>
                    <HStack w='full' justify="space-between">
                        <HStack w="110px" alignItems="center" justify="flex-start">
                            <Text color="accentTextColor" fontSize='18px' fontWeight="bold">
                                DOLA:
                            </Text>
                            <Text fontWeight="bold" fontSize='18px'>{shortenNumber(percentageForDola, 0)}%</Text>
                        </HStack>
                        <HStack w="100px" alignItems="center" justify="center">
                            <Text color="accentTextColor" fontSize='18px' fontWeight="bold">
                                INV:
                            </Text>
                            <Text fontWeight="bold" fontSize='18px'>{shortenNumber(percentageToReinvest, 0)}%</Text>
                        </HStack>
                        <HStack w="100px" alignItems="center" justify="flex-end">
                            <Text color="accentTextColor" fontSize='18px' fontWeight="bold">
                                DBR:
                            </Text>
                            <Text fontWeight="bold" fontSize='18px'>{shortenNumber(100 - percentageForInv, 0)}%</Text>
                        </HStack>
                    </HStack>
                    <RangeSlider
                        aria-label={['min', 'max']}
                        defaultValue={[0, 100]}
                        onChange={val => handleSellRange(val)}
                        value={[percentageForDola, percentageForInv]}
                    >
                        <RangeSliderTrack>
                            <RangeSliderFilledTrack />
                        </RangeSliderTrack>
                        <RangeSliderThumb boxSize={8} index={0}>
                            {percentageForDola === percentageForInv ? dolaInvCombo : <Image borderRadius="50px" src={TOKEN_IMAGES.DOLA} h="20px" w="20px" />}
                        </RangeSliderThumb>
                        <RangeSliderThumb boxSize={8} index={1}>
                            {percentageForDola === percentageForInv ? dolaInvCombo : <Image borderRadius="50px" src={TOKEN_IMAGES.INV} h="20px" w="20px" />}
                        </RangeSliderThumb>
                    </RangeSlider>
                    <HStack w='full' justify="space-between">
                        <Text color="mainTextColorLight" w='123px' cursor="pointer" textDecoration="underline" onClick={() => handleSellRange([100, 100])}>
                            Sell all for DOLA
                        </Text>
                        <Text color="mainTextColorLight" cursor="pointer" textDecoration="underline" onClick={() => handleSellRange([50, 100])}>
                            50% DOLA / 50% INV
                        </Text>
                        <Text textAlign="right" color="mainTextColorLight" w='123px' cursor="pointer" textDecoration="underline" onClick={() => handleSellRange([0, 100])}>
                            Sell all for INV
                        </Text>
                    </HStack>
                </VStack>
                <VStack alignItems="flex-start" justify="space-between" w='full'>
                    <HStack>
                        <Text>Max. slippage:</Text>
                        <Input _focusVisible={false} border={hasInvalidSlippage ? '1px solid red' : undefined} py="0" maxH="30px" w='80px' value={slippage} onChange={(e) => changeSlippage(e)} />
                    </HStack>
                    <HStack w='full' justify="space-between">
                        <Text>Min. DOLA: <b>{dolaMinOut ? `${smartShortNumber(dolaMinOut, 2, false, true)} (${smartShortNumber(dolaMinOut * dolaPrice, 2, true)})` : '-'}</b></Text>
                        <Text>Min. INV: <b>{invMinOut ? `${smartShortNumber(invMinOut, 2, false, true)} (${smartShortNumber(invMinOut * invPrice, 2, true)})` : '-'}</b></Text>
                    </HStack>
                </VStack>
                <VStack spacing="0" w='full' alignItems="flex-start">
                    <TextInfo message="If you wish the assets to be transferred or deposited to another account address">
                        <HStack spacing="2" cursor="pointer" onClick={v => !!customAddress ? () => { } : setIsCustomAddress(!isCustomAddress)}>
                            <Text>Recipient address (optional)</Text>
                            {!customAddress ? isCustomAddress ? <ChevronDownIcon /> : <ChevronRightIcon /> : null}
                        </HStack>
                    </TextInfo>
                    <Input fontSize="14px" isInvalid={!!customAddress && !isAddress(customAddress)} display={isCustomAddress ? 'block' : 'none'} w='full' placeholder={account} value={customAddress} onChange={e => setCustomAddress(e.target.value)} />
                </VStack>
                <Divider borderColor="#ccc" />
                {
                    percentageForDola > 0 && marketsWithDebt?.length > 0 && <VStack w='full'>
                        <FormControl display="inline-flex" alignItems="center" w='full'>
                            <Checkbox cursor="pointer" mr="2" id="dbr-rewards-repay-checkbox" onChange={e => { setHasRepay(!hasRepay); }} isChecked={hasRepay}></Checkbox>
                            <FormLabel color="accentTextColor" fontSize='18px' fontWeight="bold" cursor="pointer" m="0" p="0" htmlFor="dbr-rewards-repay-checkbox">
                                Use some DOLA to repay debt?
                            </FormLabel>
                        </FormControl>
                        {
                            hasRepay && <VStack
                                borderLeft={`1px solid #ccc`}
                                borderRight={`1px solid #ccc`}
                                borderBottom={`1px solid #ccc`}
                                borderBottomRadius="md"
                                p="4"
                                w='full'
                                alignItems="flex-start"
                            >
                                {
                                    marketsWithDebt?.length === 1 ?
                                        <Text>Market to repay: {marketsWithDebt[0].name} ({preciseCommify(marketsWithDebt[0].debt, 0)} debt)</Text>
                                        : <Select onChange={(e) => setMarketToRepay(e.target.value)} value={marketToRepay} placeholder='Select a Market to repay debt'>
                                            {
                                                marketsWithDebt.map((m) => {
                                                    return <option key={m.address} value={m.address}>
                                                        {m.name} ({`${preciseCommify(m.debt, 0)} debt`})
                                                    </option>
                                                })
                                            }
                                        </Select>
                                }
                                <VStack spacing="2" w='full' alignItems="flex-start">
                                    <HStack w='full' justify="space-between">
                                        <Text fontWeight="bold" color="accentTextColor">Percentage of the DOLA to use to repay debt:</Text>
                                        <Text fontWeight="bold" color="accentTextColor">{shortenNumber(percentageRepay, 0)}%</Text>
                                    </HStack>
                                    <Slider
                                        value={percentageRepay}
                                        onChange={(v: number) => handleRepaySlider(v)}
                                        min={0}
                                        max={100}
                                        step={1}
                                        aria-label='slider-ex-4'
                                        defaultValue={100}>
                                        <SliderTrack h="10px">
                                            <SliderFilledTrack bg={themeStyles.colors.success} />
                                        </SliderTrack>
                                        <SliderThumb boxSize={6} />
                                    </Slider>
                                    <HStack w='full' justify="space-between">
                                        <Text color="mainTextColorLight" w='123px' cursor="pointer" textDecoration="underline" onClick={() => handleRepaySlider(0)}>
                                            Keep all DOLA
                                        </Text>
                                        <Text color="mainTextColorLight" cursor="pointer" textDecoration="underline" onClick={() => handleRepaySlider(50)}>
                                            50%
                                        </Text>
                                        <Text textAlign="right" color="mainTextColorLight" w='123px' cursor="pointer" textDecoration="underline" onClick={() => handleRepaySlider(100)}>
                                            Use all to repay
                                        </Text>
                                    </HStack>
                                    <HStack w='full' justify="space-between">
                                        <HStack>
                                            <Text>Keeping min.:</Text>
                                            <Text>{dolaMinOut && percentageRepay < 100 ? `~${preciseCommify(dolaMinOut * (1 - percentageRepay / 100), 2)}` : '-'}</Text>
                                        </HStack>
                                        <HStack>
                                            <Text>Repaying min. debt:</Text>
                                            <Text>{dolaMinOut && percentageRepay > 0 ? `~${preciseCommify(dolaMinOut * percentageRepay / 100, 2)}` : '-'}</Text>
                                        </HStack>
                                    </HStack>
                                </VStack>
                            </VStack>
                        }
                    </VStack>
                }
            </VStack>
            <VStack alignItems="center" w='full'>
                {
                    !isHelperAllowedAsClaimer ?
                        <RSubmitButton refreshOnSuccess={false} onSuccess={() => setIsFreshlyAuthorized(true)} onClick={authorizeAsClaimer} p="6" w='fit-content' fontSize="18px">
                            1/2 - Authorize DBR Rewards Helper
                        </RSubmitButton>
                        :
                        <RSubmitButton onSuccess={onSuccess} refreshOnSuccess={true} disabled={hasInvalidSlippage || hasInvalidMins || (hasRepay && !marketToRepay) || (isCustomAddress && (!isAddress(customAddress) || customAddress === BURN_ADDRESS))} onClick={handleClaim} p="6" w='fit-content' fontSize="18px">
                            Confirm
                        </RSubmitButton>
                }
            </VStack>
        </VStack>
    </Modal>
}

export const DbrExtraClaimButtons = ({
    dbrRewardsInfo,
    onSuccess,
}: {
    dbrRewardsInfo: any,
    onSuccess: () => void,
}) => {
    const { isOpen, onClose, onOpen } = useDisclosure();
    return <VStack>
        <ROutlineButton onClick={onOpen} minW='220px' fontSize='16px'>
            Advanced Claim Options
        </ROutlineButton>
        {
            isOpen && <DbrRewardsModal onSuccess={onSuccess} dbrRewardsInfo={dbrRewardsInfo} isOpen={isOpen} onClose={onClose} />
        }
    </VStack>
}