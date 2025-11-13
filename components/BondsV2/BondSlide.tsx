import { BondV2WithRoi } from '@app/types'
import { SlideModal } from '@app/components/common/Modal/SlideModal'
import { Divider, Flex, HStack, Image, Stack, Text, VStack } from '@chakra-ui/react'
import { getBnToNumber, shortenNumber } from '@app/util/markets'
import { useBalances } from '@app/hooks/useBalances'
import { formatUnits } from '@ethersproject/units'
import { AnimatedInfoTooltip } from '@app/components/common/Tooltip'
import { BalanceInput } from '@app/components/common/Input'
import { useEffect, useState } from 'react'
import { roundFloorString, timestampToUTC } from '@app/util/misc'
import { SubmitButton } from '@app/components/common/Button'
import { useWeb3React } from '@app/util/wallet';
import { Web3Provider } from '@ethersproject/providers';
import { useRouter } from 'next/router'
import { REWARD_TOKEN } from '@app/variables/tokens'
import { BondSlippage } from './BondSlippage'
import { useAllowances } from '@app/hooks/useApprovals'
import { hasAllowance } from '@app/util/web3'
import { ApproveButton } from '@app/components/Anchor/AnchorButton'
import { ArrowLeftIcon, ArrowRightIcon, TimeIcon } from '@chakra-ui/icons'
import ScannerLink from '@app/components/common/ScannerLink'
import Link from '@app/components/common/Link'
import { MarketImage } from '@app/components/common/Assets/MarketImage'
import { useBondV2PayoutFor } from '@app/hooks/useBondsV2'
import { bondV2Deposit } from '@app/util/bonds'
import { InfoMessage, WarningMessage } from '../common/Messages'
import { BOND_V2_FIXED_TERM_TELLER } from '@app/variables/bonds'
import { formatDateWithTime } from '@app/util/time'

const invDarkBgImg = 'https://assets.coingecko.com/coins/images/14205/small/inverse_finance.jpg?1614921871';

export const BondSlide = ({
    isOpen,
    onClose,
    bonds,
    bondIndex,
    handleDetails
}: {
    isOpen: boolean,
    onClose: () => void,
    bonds: BondV2WithRoi[],
    bondIndex: number,
    handleDetails: (i: number) => void,
}) => {
    const { account, provider } = useWeb3React<Web3Provider>();
    const router = useRouter();
    const { query } = router;
    const userAddress = (query?.viewAddress as string) || account;

    const bond = bonds[bondIndex];

    const { balances } = useBalances([bond.input]);
    const [amount, setAmount] = useState('');
    const [maxSlippage, setMaxSlippage] = useState(1);
    const { approvals } = useAllowances([bond.input], bond.teller);
    const { approvals: pcApproval } = useAllowances([bond.output], bond.teller, bond.owner);
    const [isApproved, setIsApproved] = useState(hasAllowance(approvals, bond.input));
    const { payout: receiveAmount } = useBondV2PayoutFor(bond.bondContract, bond.id, bond.underlying.decimals, amount, REWARD_TOKEN!.decimals, bond.referrer);
    const pcApproved = pcApproval && pcApproval[bond.output] ? getBnToNumber(pcApproval[bond.output]) : 0;

    useEffect(() => {
        setIsApproved(hasAllowance(approvals, bond.input));
    }, [approvals, bond.input]);

    const bal = balances && balances[bond.input] ? formatUnits(balances[bond.input], bond.underlying.decimals) : '0';

    const getMax = () => {
        const maxUser = parseFloat(bal);
        const maxDeposit = bond.maxPayout * bond.bondPrice / bond.inputUsdPrice;
        return maxUser > maxDeposit ? maxDeposit : maxUser > bond.capacity && bond.capacityInQuote ? bond.capacity : bal;
    }

    const handleMax = () => {
        setAmount(roundFloorString(getMax(), 0));
    }

    const handleDeposit = () => {
        if (!provider?.getSigner() || !userAddress) { return }
        return bondV2Deposit(bond, provider?.getSigner(), amount, maxSlippage, receiveAmount, account);
    }

    const handleSuccess = () => {
        router.push('/bonds/purchased')
    }

    const now = timestampToUTC(Date.now());
    const split = now.split('-');
    const vestingCompleteDate = Date.UTC(parseInt(split[0]), parseInt(split[1]) - 1, parseInt(split[2]) + bond.vestingDays, 0);

    return <SlideModal onClose={onClose} isOpen={isOpen}>
        <VStack maxH={{ base: 'calc(100vh - 80px)' }} w='full' position="relative" overflowY="auto" overflowX="hidden" fontSize={{ base: '12px', sm: '18px' }}>
            <VStack maxW="700px" w='full' spacing="4">
                <HStack fontSize={{ base: '18px', sm: '24px' }} fontWeight="extrabold">
                    {bondIndex !== 0 && <ArrowLeftIcon zIndex="10" cursor="pointer" onClick={() => handleDetails(bondIndex - 1)} position="absolute" left="0" />}
                    <Flex>
                        {/* <LPImg leftSize={30} rightSize={20} rightDeltaX={-5} leftImg={bond.underlying.image} rightImg={invDarkBgImg} /> */}
                        <MarketImage size={30} image={bond.underlying.image} protocolImage={bond.underlying.protocolImage} />
                        <Text ml="2" textTransform="uppercase">
                            {bond.underlying.name} BOND ({bond.vestingDays} days vesting)
                        </Text>
                    </Flex>
                    {bondIndex !== (bonds.length - 1) && <ArrowRightIcon zIndex="10" cursor="pointer" onClick={() => handleDetails(bondIndex + 1)} position="absolute" right="0" />}
                </HStack>
                <Divider />
                <HStack w='full' justify="space-between" fontWeight="bold">
                    <HStack>
                        <MarketImage size={18} image={bond.underlying.image} protocolImage={bond.underlying.protocolImage} />
                        <Text mr="1" display={{ base: 'none', sm: 'inline-block' }}>Deposit</Text>
                    </HStack>
                    <Text>=></Text>
                    <Flex alignItems="center">
                        <TimeIcon fontSize="16px" />
                        <Text mx="2" fontWeight="extrabold">Wait ~{bond.vestingDays} days</Text>
                        <AnimatedInfoTooltip type="tooltip" message={`After bonding you will need to wait around ${bond.vestingDays} days before being able to redeem your INVs (no linear unlocking)`} />
                    </Flex>
                    <Text>=></Text>
                    <Stack direction="row" alignItems="center">
                        <Text display={{ base: 'none', sm: 'inline-block' }}>Redeem</Text>
                        <Image ignoreFallback={true} src={invDarkBgImg} w='18px' h='18px' borderRadius="15px" />
                    </Stack>
                </HStack>
                <Divider />
                <HStack w='full' justify="space-between" fontWeight="bold">
                    <Flex>
                        <Text fontWeight="normal" mr="1">Bond Price: </Text>
                        <Text fontWeight="extrabold">{shortenNumber(bond.bondPrice, 2, true)}</Text>
                    </Flex>
                    <Flex>
                        <Text fontWeight="normal" mr="1">Market Price: </Text>
                        <Text fontWeight="extrabold">{shortenNumber(bond.marketPrice, 2, true)}</Text>
                    </Flex>
                    <Text fontWeight="extrabold" textAlign="right" color={bond.positiveRoi ? 'secondary' : 'error'}>
                        ROI: {shortenNumber(bond.roi, 2, false)}%
                    </Text>
                </HStack>
                <HStack fontSize="12px" w='full' justify="space-between">
                    <Stack direction={{ base: 'column', sm: 'row' }} fontSize="12px" w='25%' >
                        <Text>Bond Market ID: </Text>
                        <Text>{bond.id.toString()}</Text>
                    </Stack>
                    <Stack direction={{ base: 'column', sm: 'row' }} fontSize="12px" w='25%' >
                        <Text>Min bond price: </Text>
                        <Text>{shortenNumber(bond.minPrice, 2, true)}</Text>
                    </Stack>
                    <Stack direction={{ base: 'column', sm: 'row' }} w='25%' alignItems="center" justify="center">
                        <Text>Teller: </Text>
                        <ScannerLink value={BOND_V2_FIXED_TERM_TELLER} />
                    </Stack>
                    <Stack direction={{ base: 'column', sm: 'row' }} w='25%' alignItems="center" justify="flex-end">
                        <Text>Auctioneer: </Text>
                        <ScannerLink value={bond.bondContract} />
                    </Stack>
                </HStack>

                <Divider />
                <VStack w='full' m="0" p="0" spacing="4" fontSize="14px">
                    <HStack w='full' justify="space-between">
                        <Text>
                            Your {bond.underlying.symbol} Balance:
                        </Text>
                        {
                            parseFloat(bal) === 0 ?
                                <Link fontWeight="extrabold" color="secondary" textDecoration="underline" href={bond.howToGetLink}>
                                    Get {bond.underlying.symbol}
                                </Link>
                                :
                                <Text fontWeight="extrabold" textAlign="right">
                                    {shortenNumber(parseFloat(bal), 2, false, true)} ({shortenNumber(parseFloat(bal) * bond.inputUsdPrice, 2, true, true)})
                                </Text>
                        }
                    </HStack>
                    <HStack w='full' justify="space-between">
                        <Text>
                            Current Max Available Payout for this bond <AnimatedInfoTooltip type="tooltip" message="The number of INVs available in this bonding contract" />:
                        </Text>
                        <Text fontWeight="bold" textAlign="right">
                            {bond.maxPayout} ({shortenNumber(bond.maxPayout * bond.marketPrice, 2, true)})
                        </Text>
                    </HStack>
                    <HStack w='full' justify="space-between">
                        <Text>
                            Remaining bond market Capacity <AnimatedInfoTooltip type="tooltip" message="Once this reaches 0, the bond cannot be purchased anymore." />:
                        </Text>
                        <Text fontWeight="bold" textAlign="right">
                            {bond.capacity} {bond.capacityInQuote ? bond.underlying.symbol : 'INV'}
                        </Text>
                    </HStack>
                    {
                        bond.capacity && !bond.capacityInQuote && pcApproved < bond.capacity &&
                        <HStack w='full' justify="flex-start">
                            <WarningMessage
                                alertProps={{ w: 'full' }}
                                description="The Policy Committee needs to increase allowance for this market"
                            />
                        </HStack>
                    }
                    <Stack direction={{ base: 'column', sm: 'row' }} w='full' justify="space-between">
                        <Flex w='full' maxW={{ base: 'full', sm: '400px' }}>
                            <BalanceInput
                                value={amount}
                                inputProps={{ fontSize: '15px', py: { base: '20px', sm: '24px' } }}
                                onChange={(e: React.MouseEvent<HTMLInputElement>) => setAmount(e.currentTarget.value.replace(',', '.').replace(/[^0-9.]/g, ''))}
                                onMaxClick={() => handleMax()}
                            />
                        </Flex>
                        <Flex maxW={{ base: 'none', sm: '190px' }} w="full" minW="120px">
                            {
                                !isApproved ?
                                    <ApproveButton needPoaFirst={true} tooltipMsg='' signer={provider?.getSigner()} address={bond.underlying.address} toAddress={bond.teller} isDisabled={(!provider?.getSigner())} />
                                    :
                                    <SubmitButton
                                        needPoaFirst={true}
                                        onSuccess={() => handleSuccess()}
                                        isDisabled={!parseFloat(amount || '0') || parseFloat(amount || '0') > getMax() || !parseFloat(receiveAmount) || (parseFloat(receiveAmount) > pcApproved)}
                                        onClick={handleDeposit}
                                        refreshOnSuccess={true}>
                                        Purchase
                                    </SubmitButton>
                            }
                        </Flex>
                    </Stack>
                    <HStack w='full'>
                        <BondSlippage maxSlippage={maxSlippage} toToken={REWARD_TOKEN!} toAmount={receiveAmount.toString()} onChange={(v) => setMaxSlippage(parseFloat(v))} />
                    </HStack>
                    {
                        parseFloat(amount) > 0 && !parseFloat(receiveAmount) &&
                        <InfoMessage
                            alertProps={{ w: 'full' }}
                            description="Payout amount is null with current conditions and parameters"
                        />
                    }
                    <HStack fontSize={{ base: '12px', sm: '18px' }} w='full' justify="space-between">
                        <Text fontWeight="bold">
                            Estimated INV amount to receive:
                        </Text>
                        <Text fontWeight="extrabold">
                            {shortenNumber(parseFloat(receiveAmount), 4)}
                        </Text>
                    </HStack>
                    <InfoMessage
                        alertProps={{ w: 'full' }}
                        description={`Vesting will be complete on ${formatDateWithTime(vestingCompleteDate)}`}
                    />
                </VStack>
            </VStack>
        </VStack>
    </SlideModal>
}