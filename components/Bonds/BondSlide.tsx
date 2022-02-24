import { Bond } from '@app/types'
import { SlideModal } from '@app/components/common/Modal/SlideModal'
import { Divider, HStack, Text, VStack } from '@chakra-ui/react'
import { shortenNumber } from '@app/util/markets'
import { UnderlyingItemBlock } from '@app/components/common/Assets/UnderlyingItemBlock'
import { useBalances } from '@app/hooks/useBalances'
import { formatUnits } from '@ethersproject/units'
import { AnimatedInfoTooltip } from '@app/components/common/Tooltip'
import { BalanceInput } from '@app/components/common/Input'
import { useState } from 'react'
import { roundFloorString } from '@app/util/misc'
import { SubmitButton } from '@app/components/common/Button'

export const BondSlide = ({
    isOpen,
    onClose,
    bond,
}: {
    isOpen: boolean,
    onClose: () => void,
    bond: Bond
}) => {
    const { balances } = useBalances([bond.input]);
    const [amount, setAmount] = useState('0');

    const bal = balances && balances[bond.input] ? formatUnits(balances[bond.input], bond.underlying.decimals) : '0';
    console.log(bond);

    const handleMax = () => {
        const maxUser = parseFloat(bal);
        const maxDeposit = bond.maxPayout * bond.marketPrice / bond.inputUsdPrice;
        setAmount(roundFloorString(Math.min(maxUser, maxDeposit), bond.underlying.decimals));
    }

    return <SlideModal onClose={onClose} isOpen={isOpen}>
        <VStack w='full' fontSize="18px" fontWeight="bold">
            <VStack maxW="700px" w='full' spacing="4">
                <HStack fontSize="24px">
                    <UnderlyingItemBlock symbol={bond.underlying.symbol} nameAttribute="name" />
                    <Text>BOND</Text>
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
                    <HStack w='full'>
                        <BalanceInput
                            value={amount}
                            inputProps={{ fontSize: '15px' }}
                            onChange={(e: React.MouseEvent<HTMLInputElement>) => setAmount(e.currentTarget.value)}
                            onMaxClick={() => handleMax()}
                        />
                        <SubmitButton w="120px">
                            Deposit
                        </SubmitButton>
                    </HStack>
                    <HStack w='full' justify="space-between">
                        <Text>
                            Amount of INV you will receive:
                        </Text>
                        <Text>
                            {parseFloat(amount || '0') * bond.inputUsdPrice / bond.marketPrice}
                        </Text>
                    </HStack>
                </VStack>
            </VStack>
        </VStack>
    </SlideModal>
}