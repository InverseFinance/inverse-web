import { Bond } from '@app/types'
import { SlideModal } from '@app/components/common/Modal/SlideModal'
import { Divider, Flex, HStack, Image, Stack, Text, VStack } from '@chakra-ui/react'
import { shortenNumber } from '@app/util/markets'
import { useBalances } from '@app/hooks/useBalances'
import { formatUnits } from '@ethersproject/units'
import { AnimatedInfoTooltip } from '@app/components/common/Tooltip'
import { BalanceInput } from '@app/components/common/Input'
import { useEffect, useState } from 'react'
import { roundFloorString } from '@app/util/misc'
import { SubmitButton } from '@app/components/common/Button'
import { bondDeposit } from '@app/util/contracts'
import { useWeb3React } from '@app/util/wallet';
import { Web3Provider } from '@ethersproject/providers';
import { useRouter } from 'next/router'
import { REWARD_TOKEN } from '@app/variables/tokens'
import { BondSlippage } from './BondSlippage'
import { useAllowances } from '@app/hooks/useApprovals'
import { hasAllowance } from '@app/util/web3'
import { ApproveButton } from '@app/components/Anchor/AnchorButton'
import { BondRedeem } from './BondRedeem'
import { ArrowLeftIcon, ArrowRightIcon, TimeIcon } from '@chakra-ui/icons'
import ScannerLink from '@app/components/common/ScannerLink'
import { useBondPayoutFor } from '@app/hooks/useBonds'
import Link from '@app/components/common/Link'
import { MarketImage } from '@app/components/common/Assets/MarketImage'

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
    bonds: Bond[],
    bondIndex: number,
    handleDetails: (i: number) => void,
}) => {
    const { account, provider } = useWeb3React<Web3Provider>();
    const { query } = useRouter();
    const userAddress = (query?.viewAddress as string) || account;

    const bond = bonds[bondIndex];

    const { balances } = useBalances([bond.input]);
    const [amount, setAmount] = useState('');
    const [maxSlippage, setMaxSlippage] = useState(1);
    const { approvals } = useAllowances([bond.input], bond.bondContract);
    const [isApproved, setIsApproved] = useState(hasAllowance(approvals, bond.input));
    const { payout: receiveAmount } = useBondPayoutFor(bond.bondContract, bond.underlying.decimals, amount, REWARD_TOKEN!.decimals);
    const maxReceiveAmount = Math.min(parseFloat(receiveAmount), bond.maxPayout);

    useEffect(() => {
        setIsApproved(hasAllowance(approvals, bond.input));
    }, [approvals, bond.input]);

    const bal = balances && balances[bond.input] ? formatUnits(balances[bond.input], bond.underlying.decimals) : '0';

    const getMax = () => {
        const maxUser = parseFloat(bal);
        const maxDeposit = bond.maxPayout * bond.usdPrice / bond.inputUsdPrice;
        return maxUser > maxDeposit ? maxDeposit : bal;
    }

    const handleMax = () => {
        setAmount(roundFloorString(getMax(), bond.underlying.decimals));
    }

    const handleDeposit = () => {
        if (!provider?.getSigner() || !userAddress) { return }
        return bondDeposit(bond, provider?.getSigner(), amount, maxSlippage, userAddress);
    }

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
                        <Text mx="2" fontWeight="extrabold">Wait {bond.vestingDays} days</Text>
                        <AnimatedInfoTooltip type="tooltip" message={`After bonding you will need to wait ${bond.vestingDays} days to claim 100% of your INVs, you can also claim a proportional part before vesting completion`} />
                    </Flex>
                    <Text>=></Text>
                    <Stack direction="row" alignItems="center">
                        <Text display={{ base: 'none', sm: 'inline-block' }}>Claim</Text>
                        <Image ignoreFallback={true} src={invDarkBgImg} w='18px' h='18px' borderRadius="15px" />
                    </Stack>
                </HStack>
                <Divider />
                <HStack w='full' justify="space-between" fontWeight="bold">
                    <Flex>
                        <Text fontWeight="normal" mr="1">Bond Price: </Text>
                        <Text fontWeight="extrabold">{shortenNumber(bond.usdPrice, 2, true)}</Text>
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
                    <Text>Bond Contract: </Text>
                    <ScannerLink value={bond.bondContract} />
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
                    <Stack direction={{ base: 'column', sm: 'row' }} w='full' justify="space-between">
                        <Flex w='full' maxW={{ base: 'full', sm: '400px' }}>
                            <BalanceInput
                                value={amount}
                                inputProps={{ fontSize: '15px', py: { base: '20px', sm: '24px' } }}
                                onChange={(e: React.MouseEvent<HTMLInputElement>) => setAmount(e.currentTarget.value)}
                                onMaxClick={() => handleMax()}
                            />
                        </Flex>
                        <Flex maxW={{ base: 'none', sm: '190px' }} w="full" minW="120px">
                            {
                                !isApproved ?
                                    <ApproveButton tooltipMsg='' signer={provider?.getSigner()} address={bond.underlying.address} toAddress={bond.bondContract} isDisabled={isApproved || (!provider?.getSigner())} />
                                    :
                                    <SubmitButton isDisabled={!parseFloat(amount || '0') || parseFloat(amount || '0') > getMax()} onClick={handleDeposit} refreshOnSuccess={true}>
                                        Deposit
                                    </SubmitButton>
                            }
                        </Flex>
                    </Stack>
                    <HStack w='full'>
                        <BondSlippage maxSlippage={maxSlippage} toToken={REWARD_TOKEN!} toAmount={maxReceiveAmount.toString()} onChange={(v) => setMaxSlippage(parseFloat(v))} />
                    </HStack>
                    <HStack fontSize={{ base: '12px', sm: '18px' }} w='full' justify="space-between">
                        <Text fontWeight="bold">
                            Estimated INV amount to receive:
                        </Text>
                        <Text fontWeight="extrabold">
                            {shortenNumber(parseFloat(maxReceiveAmount), 4)}
                        </Text>
                    </HStack>
                </VStack>
                <Divider />
                <BondRedeem bond={bond} />
            </VStack>
        </VStack>
    </SlideModal>
}