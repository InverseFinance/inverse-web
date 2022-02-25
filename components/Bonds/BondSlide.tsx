import { Bond } from '@app/types'
import { SlideModal } from '@app/components/common/Modal/SlideModal'
import { Divider, Flex, HStack, Text, VStack } from '@chakra-ui/react'
import { shortenNumber } from '@app/util/markets'
import { UnderlyingItemBlock } from '@app/components/common/Assets/UnderlyingItemBlock'
import { useBalances } from '@app/hooks/useBalances'
import { formatUnits } from '@ethersproject/units'
import { AnimatedInfoTooltip } from '@app/components/common/Tooltip'
import { BalanceInput } from '@app/components/common/Input'
import { useEffect, useState } from 'react'
import { roundFloorString } from '@app/util/misc'
import { SubmitButton } from '@app/components/common/Button'
import { bondDeposit } from '@app/util/contracts'
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { useRouter } from 'next/router'
import { REWARD_TOKEN } from '@app/variables/tokens'
import { BondSlippage } from './BondSlippage'
import { useAllowances } from '@app/hooks/useApprovals'
import { hasAllowance } from '@app/util/web3'
import { ApproveButton } from '@app/components/Anchor/AnchorButton'
import { BondRedeem } from './BondRedeem'
import { ArrowLeftIcon, ArrowRightIcon } from '@chakra-ui/icons'
import ScannerLink from '@app/components/common/ScannerLink'

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
    const { account, library } = useWeb3React<Web3Provider>();
    const { query } = useRouter();
    const userAddress = (query?.viewAddress as string) || account;

    const bond = bonds[bondIndex];

    const { balances } = useBalances([bond.input]);
    const [amount, setAmount] = useState('0');
    const [maxSlippage, setMaxSlippage] = useState(1);
    const { approvals } = useAllowances([bond.input], bond.bondContract);
    const [isApproved, setIsApproved] = useState(hasAllowance(approvals, bond.input));

    useEffect(() => {
        setIsApproved(hasAllowance(approvals, bond.input));
    }, [approvals, bond.input]);

    const bal = balances && balances[bond.input] ? formatUnits(balances[bond.input], bond.underlying.decimals) : '0';
    const receiveAmount = parseFloat(amount || '0') * bond.inputUsdPrice / bond.marketPrice;

    const handleMax = () => {
        const maxUser = parseFloat(bal);
        const maxDeposit = bond.maxPayout * bond.marketPrice / bond.inputUsdPrice;
        setAmount(roundFloorString(Math.min(maxUser, maxDeposit), bond.underlying.decimals));
    }

    const handleDeposit = () => {
        if (!library?.getSigner() || !userAddress) { return }
        return bondDeposit(bond, library?.getSigner(), amount, maxSlippage, userAddress);
    }

    return <SlideModal onClose={onClose} isOpen={isOpen}>
        <VStack w='full' position="relative" pb="10" overflowY="auto" overflowX="hidden" fontSize="18px" fontWeight="bold">
            <VStack maxW="700px" w='full' spacing="4">
                <HStack fontSize="24px">
                    {bondIndex !== 0 && <ArrowLeftIcon cursor="pointer" onClick={() => handleDetails(bondIndex - 1)} position="absolute" left="0" />}
                    <UnderlyingItemBlock symbol={bond.underlying.symbol} nameAttribute="name" />
                    <Text>BOND</Text>
                    {bondIndex !== (bonds.length - 1) && <ArrowRightIcon cursor="pointer" onClick={() => handleDetails(bondIndex + 1)} position="absolute" right="0" />}
                </HStack>
                <Divider />
                <HStack w='full' justify="space-between">
                    <HStack>
                        <Text>Deposit</Text>
                        <UnderlyingItemBlock symbol={bond.underlying.symbol} nameAttribute='name' />
                    </HStack>
                    <Text>=></Text>
                    <Text alignItems="center">
                        Wait 7 days <AnimatedInfoTooltip message="After bonding you will need to wait 7 days to claim your INVs" />
                    </Text>
                    <Text>=></Text>
                    <HStack>
                        <Text>Claim</Text>
                        <UnderlyingItemBlock symbol={'INV'} nameAttribute='name' />
                    </HStack>
                </HStack>
                <HStack w='full' justify="space-between" fontWeight="bold">
                    <Text>
                        Bond Price: {shortenNumber(bond.usdPrice, 2, true)}
                    </Text>
                    <Text>
                        Market Price: {shortenNumber(bond.marketPrice, 2, true)}
                    </Text>
                    <Text color={bond.positiveRoi ? 'secondary' : 'error'}>
                        ROI: {shortenNumber(bond.roi, 2, true)}%
                    </Text>
                </HStack>
                <HStack w='full' justify="space-between">
                    <Text>Contract: </Text>
                    <ScannerLink value={bond.bondContract} />
                </HStack>
                <Divider />
                <VStack w='full' m="0" p="0" spacing="4">
                    <HStack w='full' justify="space-between">
                        <Text>
                            Your {bond.underlying.symbol} balance:
                        </Text>
                        <Text>
                            {shortenNumber(parseFloat(bal), 2, false, true)} ({shortenNumber(parseFloat(bal) * bond.inputUsdPrice, 2, true, true)})
                        </Text>
                    </HStack>
                    <HStack w='full' justify="space-between">
                        <Text>
                            Current Max Available Payout for this bond <AnimatedInfoTooltip message="The number of INVs available in this bonding contract" />:
                        </Text>
                        <Text>
                            {bond.maxPayout} ({shortenNumber(bond.maxPayout * bond.marketPrice, 2, true)})
                        </Text>
                    </HStack>
                    <HStack w='full' justify="space-between">
                        <Flex w='full' maxW="400px">
                            <BalanceInput
                                value={amount}
                                inputProps={{ fontSize: '15px' }}
                                onChange={(e: React.MouseEvent<HTMLInputElement>) => setAmount(e.currentTarget.value)}
                                onMaxClick={() => handleMax()}
                            />
                        </Flex>
                        <Flex w="120px">
                            {
                                !isApproved ?
                                    <ApproveButton signer={library?.getSigner()} address={bond.underlying.address} toAddress={bond.bondContract} isDisabled={isApproved || (!library?.getSigner())} />
                                    :
                                    <SubmitButton onClick={handleDeposit} refreshOnSuccess={true}>
                                        Deposit
                                    </SubmitButton>
                            }
                        </Flex>
                    </HStack>
                    <HStack w='full'>
                        <BondSlippage maxSlippage={maxSlippage} toToken={REWARD_TOKEN!} toAmount={receiveAmount.toString()} onChange={(v) => setMaxSlippage(parseFloat(v))} />
                    </HStack>
                    <HStack w='full' justify="space-between">
                        <Text>
                            Estimated INV amount to receive:
                        </Text>
                        <Text>
                            {receiveAmount}
                        </Text>
                    </HStack>
                </VStack>
                {
                    bond.userInfos.payout > 0 && <>
                        <Divider />
                        <BondRedeem bond={bond} />
                    </>
                }
            </VStack>
        </VStack>
    </SlideModal>
}