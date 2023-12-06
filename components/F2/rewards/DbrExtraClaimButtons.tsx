import { ROutlineButton, RSubmitButton } from "@app/components/common/Button/RSubmitButton"
import { Input } from "@app/components/common/Input"
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
import { claimDbrAndSell, claimDbrAndSellForDola, claimDbrSellAndDepositInv, claimDbrSellAndRepay } from "@app/util/firm-extra"
import { getNumberToBn, shortenNumber, smartShortNumber } from "@app/util/markets"
import { preciseCommify } from "@app/util/misc"
import { getNetworkConfigConstants } from "@app/util/networks"
import { ChevronDownIcon, ChevronRightIcon } from "@chakra-ui/icons"
import { VStack, useDisclosure, Text, Stack, RadioGroup, Radio, HStack, Select, RangeSlider, RangeSliderTrack, RangeSliderFilledTrack, RangeSliderThumb, Slider, SliderTrack, SliderFilledTrack, SliderThumb, Divider, Checkbox, FormControl, FormLabel } from "@chakra-ui/react"
import { useWeb3React } from "@web3-react/core"
import { Contract } from "ethers"
import { isAddress } from "ethers/lib/utils"
import { useMemo, useState } from "react"

const { F2_DBR_REWARDS_HELPER } = getNetworkConfigConstants();

export const DbrRewardsModal = ({
    isOpen,
    onClose,
    basicClaim,
    dbrRewardsInfo,
}: {
    isOpen: boolean,
    onClose: () => void,
    basicClaim: () => void,
    dbrRewardsInfo: ZapperToken
}) => {
    const { themeStyles } = useAppTheme();
    const { prices } = usePrices();
    const account = useAccount();
    const { provider } = useWeb3React();
    const [isCustomAddress, setIsCustomAddress] = useState(false);
    const [customAddress, setCustomAddress] = useState('');
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
    const isHelperAllowedAsClaimer = claimersData ? claimersData[0] : false;
    const accountMarkets = useAccountF2Markets(markets, account);
    const marketsWithDebt = useMemo(() => {
        return accountMarkets.filter(m => m.debt > 0).sort((a, b) => b.debt - a.debt);
    }, [accountMarkets.map(m => m.debt).join('-')]);

    const [selected, setSelected] = useState('restake');
    const [slippage, setSlippage] = useState('1');
    const [hasRepay, setHasRepay] = useState(false);
    const [marketToRepay, setMarketToRepay] = useState('');
    const [percentageToReinvest, setPercentageToReinvest] = useState(100);
    const [percentageRepay, setPercentageRepay] = useState(100);

    // amounts of DOLA and INV for selling DBR
    const { amountOut: dolaAmountOut } = useTriCryptoSwap(dbrRewardsInfo.balance, 1, 0);
    const { amountOut: invAmountOut } = useTriCryptoSwap(dbrRewardsInfo.balance, 1, 2);    

    const dolaPerc = 100 - percentageToReinvest;
    const slippageFactor = (1 - parseFloat(slippage) / 100);
    const dolaMinOut = dolaAmountOut ? dolaAmountOut * (dolaPerc / 100) * slippageFactor : 0;
    const invMinOut = invAmountOut ? invAmountOut * (percentageToReinvest / 100) * slippageFactor : 0;

    const isRestake = selected === 'restake';
    const isNotBasicClaim = selected !== 'claim';
    const isRepay = selected === 'repay';

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
        const dolaBps = (dolaPerc * 100).toString();
        const dolaMinOutBn = getNumberToBn(dolaMinOut);
        const invMinOutBn = getNumberToBn(invMinOut);
        const exchangeData = [destinationAddress, destinationAddress, destinationAddress, dolaMinOutBn, dolaBps, invMinOutBn, invBps];
        const repayData = [destinationAddress, destinationAddress, (percentageRepay*100).toString()];
        return claimDbrAndSell(provider.getSigner(), exchangeData, repayData);
        // if (selected === 'restake') {
        //     return claimDbrSellAndDepositInv(minAmountOutBn, provider?.getSigner(), destinationAddress);
        // } else if (selected === 'sell') {
        //     return claimDbrAndSellForDola(minAmountOutBn, provider?.getSigner(), destinationAddress);
        // } else if (selected === 'repay' && !!marketToRepay) {
        //     return claimDbrSellAndRepay(minAmountOutBn, marketToRepay, provider?.getSigner(), destinationAddress);
        // } else if (selected === 'claim') {
        //     return basicClaim(destinationAddress);
        // }
    }

    const hasInvalidSlippage = (!slippage || slippage === '0' || isNaN(parseFloat(slippage)));

    const handleSellSlider = (percToReinvest: number) => {
        setPercentageToReinvest(percToReinvest);
    }

    const handleRepaySlider = (percToReinvest: number) => {
        setPercentageRepay(percToReinvest);
    }

    return <Modal
        isOpen={isOpen}
        onClose={onClose}
        width="550px"
        maxW="98vw"
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
                    <HStack w='full' justify="space-between">
                        <Text>DBR rewards: {smartShortNumber(dbrRewardsInfo.balance)} (~{smartShortNumber(dbrRewardsInfo.balanceUSD, 2, true, true)})</Text>
                        {
                            debt > 0 && <Text>My total debt: {smartShortNumber(debt, 2)} DOLA</Text>
                        }
                    </HStack>
                </VStack>
                <Divider borderColor="#ccc" />
                {/* <Text fontSize='20px' fontWeight="bold">
                    Choose an action to do with the DBR rewards:
                </Text> */}
                {/* <RadioGroup onChange={setSelected} pl="4" defaultValue='restake'>
                    <Stack spacing="3">
                        <Radio value='restake'>
                            <Text fontWeight={selected === 'restake' ? 'bold' : undefined}>Re-invest it in INV and stake</Text>
                        </Radio>
                        <Radio value='sell'>
                            <Text fontWeight={selected === 'sell' ? 'bold' : undefined}>Sell it for DOLA</Text>
                        </Radio>
                        <Radio value='claim'>
                            <Text fontWeight={selected === 'claim' ? 'bold' : undefined}>Simply claim it</Text>
                        </Radio>
                        <Radio value='repay' isDisabled={!debt}>
                            <Text fontWeight={selected === 'repay' ? 'bold' : undefined}>Sell it for DOLA and repay debt in a market</Text>
                        </Radio>
                    </Stack>
                </RadioGroup> */}
                <VStack w='full' alignItems="flex-start">
                    <HStack w='full' justify="space-between">
                        <Text fontSize='18px' fontWeight="bold">Percentage to re-invest and stake in INV:</Text>
                        <Text fontWeight="bold" color="accentTextColor">{shortenNumber(percentageToReinvest, 0)}%</Text>
                    </HStack>
                    <Slider
                        value={percentageToReinvest}
                        onChange={(v: number) => handleSellSlider(v)}
                        min={0}
                        max={100}
                        step={1}
                        aria-label='slider-ex-4'
                        defaultValue={100}>
                        <SliderTrack h="10px">
                            <SliderFilledTrack />
                        </SliderTrack>
                        <SliderThumb boxSize={6} />
                    </Slider>
                    <HStack w='full' justify="space-between">
                        <Text color="mainTextColorLight" w='123px' cursor="pointer" textDecoration="underline" onClick={() => handleSellSlider(0)}>
                            Sell all for DOLA
                        </Text>
                        <Text color="mainTextColorLight" cursor="pointer" textDecoration="underline" onClick={() => handleSellSlider(50)}>
                            50%
                        </Text>
                        <Text textAlign="right" color="mainTextColorLight" w='123px' cursor="pointer" textDecoration="underline" onClick={() => handleSellSlider(100)}>
                            Sell all for INV
                        </Text>
                    </HStack>
                </VStack>
                {
                    isNotBasicClaim && <VStack alignItems="flex-start" justify="space-between" w='full'>
                        <HStack>
                            <Text>Max. slippage:</Text>
                            <Input _focusVisible={false} border={hasInvalidSlippage ? '1px solid red' : undefined} py="0" maxH="30px" w='80px' value={slippage} onChange={(e) => changeSlippage(e)} />
                        </HStack>
                        <HStack w='full' justify="space-between">
                            <Text>Min. DOLA: <b>{dolaMinOut ? `${smartShortNumber(dolaMinOut, 2, false, true)} (${smartShortNumber(dolaMinOut * dolaPrice, 2, true)})` : '-'}</b></Text>
                            <Text>Min. INV: <b>{invMinOut ? `${smartShortNumber(invMinOut, 2, false, true)} (${smartShortNumber(invMinOut * invPrice, 2, true)})` : '-'}</b></Text>
                        </HStack>
                    </VStack>
                }
                <VStack spacing="0" w='full' alignItems="flex-start">
                    <TextInfo message="If you wish to assets transferred or deposited to another account address">
                        <HStack spacing="2" cursor="pointer" onClick={v => !!customAddress ? () => { } : setIsCustomAddress(!isCustomAddress)}>
                            <Text>Recipient address (optional)</Text>
                            {!customAddress ? isCustomAddress ? <ChevronDownIcon /> : <ChevronRightIcon /> : null}
                        </HStack>
                    </TextInfo>
                    <Input fontSize="14px" isInvalid={!!customAddress && !isAddress(customAddress)} display={isCustomAddress ? 'block' : 'none'} w='full' placeholder={account} value={customAddress} onChange={e => setCustomAddress(e.target.value)} />
                </VStack>
                <Divider borderColor="#ccc" />
                {
                    percentageToReinvest < 100 && <VStack w='full'>
                        <FormControl display="inline-flex" alignItems="center" w='full'>
                            <Checkbox cursor="pointer" mr="2" id="dbr-rewards-repay-checkbox" onChange={e => { setHasRepay(!hasRepay); }} isChecked={hasRepay}></Checkbox>
                            <FormLabel fontSize='18px' fontWeight="bold" cursor="pointer" m="0" p="0" htmlFor="dbr-rewards-repay-checkbox">
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
                            >
                                <Select onChange={(e) => setMarketToRepay(e.target.value)} value={marketToRepay} placeholder='Select a Market to repay debt'>
                                    {
                                        marketsWithDebt.map((m) => {
                                            return <option key={m.address} value={m.address}>
                                                {m.name} ({`${preciseCommify(m.debt, 0)} debt`})
                                            </option>
                                        })
                                    }
                                </Select>
                                <VStack spacing="2" w='full' alignItems="flex-start">
                                    <HStack w='full' justify="space-between">
                                        <Text fontWeight="bold">Percentage of the DOLA to use to repay debt:</Text>
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
                                            <Text>{dolaMinOut && percentageRepay < 100 ? `~${preciseCommify(dolaMinOut * (1-percentageRepay/100), 2)}` : '-'}</Text>
                                        </HStack>
                                        <HStack>
                                            <Text>Repaying min. debt:</Text>
                                            <Text>{dolaMinOut && percentageRepay > 0 ? `~${preciseCommify(dolaMinOut * percentageRepay/100, 2)}` : '-'}</Text>
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
                        <RSubmitButton refreshOnSuccess={true} onClick={authorizeAsClaimer} p="6" w='fit-content' fontSize="18px">
                            Authorize DBR Rewards Helper
                        </RSubmitButton>
                        :
                        <RSubmitButton refreshOnSuccess={true} disabled={(isNotBasicClaim && hasInvalidSlippage) || (isRepay && !marketToRepay)} onClick={handleClaim} p="6" w='fit-content' fontSize="18px">
                            Confirm
                        </RSubmitButton>
                }
            </VStack>
        </VStack>
    </Modal>
}

export const DbrExtraClaimButtons = ({
    basicClaim,
    dbrRewardsInfo,
}: {
    basicClaim: () => void,
    dbrRewardsInfo: any,
}) => {
    const { isOpen, onClose, onOpen } = useDisclosure();
    return <VStack>
        <ROutlineButton onClick={onOpen} minW='220px' fontSize='16px'>
            Advanced Claim Options
        </ROutlineButton>
        {
            isOpen && <DbrRewardsModal dbrRewardsInfo={dbrRewardsInfo} basicClaim={basicClaim} isOpen={isOpen} onClose={onClose} />
        }
    </VStack>
}