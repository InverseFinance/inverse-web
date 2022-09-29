import { Stack, VStack, Text, Divider } from '@chakra-ui/react'
import { shortenNumber } from '@app/util/markets'
import { preciseCommify } from '@app/util/misc'
import { TextInfo } from '@app/components/common/Messages/TextInfo'
import moment from 'moment'

export const F2FormInfos = ({
    newPerc,
    riskColor,
    isFormFilled,
    newLiquidationPrice,
    f2market,
    dbrCoverDebt,
    dbrCover,
    duration,
    dbrPrice,
    newDailyDBRBurn,
    newDBRExpiryDate,
    onHealthOpen = () => { },
    onDbrOpen = () => { },
}) => {
    return <VStack spacing="0" w='full'>
        <Stack w='full' py={{ base: '2', sm: '0' }} direction={{ base: 'column', sm: 'row' }} justify="space-between">
            <VStack pb={{ base: '0', sm: '4' }} w={{ base: 'full', sm: '50%' }} spacing="0" alignItems={{ base: 'center', sm: 'flex-start' }}>
                <TextInfo message="Percentage of the loan covered by the collateral worth">
                    <Text fontSize="18px"color="mainTextColor" cursor="pointer" onClick={() => onHealthOpen()} >
                        Collateral Health:
                    </Text>
                </TextInfo>
                <Text fontSize="18px"color={newPerc < 75 ? riskColor : undefined} fontWeight={isFormFilled && newPerc <= 25 ? 'bold' : undefined}>{isFormFilled ? `${shortenNumber(newPerc, 2)}%` : '-'}</Text>
            </VStack>
            <VStack pb={{ base: '0', sm: '4' }} w={{ base: 'full', sm: '50%' }} borderLeft={{ base: 'none', sm: "1px solid #cccccc66" }} spacing="0" alignItems={{ base: 'center', sm: 'flex-end' }}>
                <TextInfo message="Minimum Collateral Price before liquidations can happen">
                    <Text fontSize="18px"color="mainTextColor" cursor="pointer" onClick={() => onHealthOpen()}>
                        Liq. Price:
                    </Text>
                </TextInfo>
                <Text fontSize="18px"color={newPerc < 75 ? riskColor : undefined} fontWeight={isFormFilled && newPerc <= 25 ? 'bold' : undefined}>
                    {isFormFilled ? newLiquidationPrice >= f2market.price ? 'Instant' : `${preciseCommify(newLiquidationPrice, 2, true)}` : '-'}
                </Text>
            </VStack>

        </Stack>
        <Divider borderColor="#cccccc66" />
        <Stack w='full' py={{ base: '2', sm: '0' }} direction={{ base: 'column', sm: 'row' }} justify="space-between">
            <VStack py={{ base: '0', sm: '4' }} w={{ base: 'full', sm: '50%' }}  spacing="0" alignItems={{ base: 'center', sm: 'flex-start' }}>
                <TextInfo message="Collateral Factor for the collateral in this Market">
                    <Text fontSize="18px"color="mainTextColor" cursor="pointer" onClick={() => onHealthOpen()} >
                        Collateral Factor:
                    </Text>
                </TextInfo>
                <Text fontSize="18px" fontWeight="bold">{shortenNumber(f2market.collateralFactor * 100, 2)}%</Text>
            </VStack>
            <VStack borderLeft={{ base: 'none', sm: "1px solid #cccccc66" }} py={{ base: '0', sm: '4' }} w={{ base: 'full', sm: '50%' }}  spacing="0" alignItems={{ base: 'center', sm: 'flex-end' }}>
                <TextInfo message="Current Collateral Price according to the Oracle">
                    <Text fontSize="18px"color="mainTextColor" cursor="pointer" onClick={() => onHealthOpen()}>
                        Collateral Price:
                    </Text>
                </TextInfo>
                <Text fontSize="18px" fontWeight="bold">{shortenNumber(f2market.price, 2, true)}</Text>
            </VStack>
            {/* <VStack spacing="0" alignItems={{ base: 'center', sm: 'flex-end' }}>
                <TextInfo message="The current DOLA liquidity available to borrow in this market">
                    <Text fontSize="18px"color="mainTextColor">
                        Market liquidity:
                    </Text>
                </TextInfo>
                <Text fontSize="18px" fontWeight="bold">{shortenNumber(f2market.dolaLiquidity, 2)} DOLA</Text>
            </VStack> */}
        </Stack>
        <Divider borderColor="#cccccc66" />
        <Stack w='full' py={{ base: '2', sm: '0' }} direction={{ base: 'column', sm: 'row' }} justify="space-between">
            <VStack py={{ base: '0', sm: '4' }} w={{ base: 'full', sm: '50%' }}  spacing="0" alignItems={{ base: 'center', sm: 'flex-start' }}>
                <TextInfo message="Current market price for DBR, the token used to pay borrowing fees">
                    <Text fontSize="18px"cursor="pointer" onClick={() => onDbrOpen()} color="mainTextColor">
                        DBR price:
                    </Text>
                </TextInfo>
                <Text fontSize="18px" fontWeight="bold">{shortenNumber(dbrPrice, 4, true)}</Text>
            </VStack>
            <VStack borderLeft={{ base: 'none', sm: "1px solid #cccccc66" }} py={{ base: '0', sm: '4' }} w={{ base: 'full', sm: '50%' }}  spacing="0" alignItems={{ base: 'center', sm: 'flex-end' }}>
                <TextInfo message="DBR tokens you will receive, they will be automatically used to cover borrowing interests over time. Don't sell them unless you know what you're doing!">
                    <Text fontSize="18px"cursor="pointer" onClick={() => onDbrOpen()} color="mainTextColor">
                        Fees over time:
                    </Text>
                </TextInfo>
                <Text fontSize="18px" fontWeight="bold">{shortenNumber(dbrCover, 2)} DBRs ({shortenNumber(dbrCoverDebt, 2, true)})</Text>
            </VStack>
            {/* <VStack spacing="0" alignItems={{ base: 'center', sm: 'flex-end' }}>
                <TextInfo message="The Fixed Rate will be locked-in for a specific duration, you can change the duration by clicking the settings icon.">
                    <Text fontSize="18px"cursor="pointer" onClick={() => onDbrOpen()} color="mainTextColor">
                        Rate Duration:
                    </Text>
                </TextInfo>
                <Text fontSize="18px" fontWeight="bold">{duration} days</Text>
            </VStack> */}
            
        </Stack>
        <Divider borderColor="#cccccc66" />
        <Stack w='full' py={{ base: '2', sm: '0' }} direction={{ base: 'column', sm: 'row' }} justify="space-between">
            <VStack py={{ base: '0', sm: '4' }} w={{ base: 'full', sm: '50%' }}  spacing="0" alignItems={{ base: 'center', sm: 'flex-start' }}>
                <TextInfo message="Current market price for DBR, the token used to pay borrowing fees">
                    <Text fontSize="18px"cursor="pointer" onClick={() => onDbrOpen()} color="mainTextColor">
                        New daily DBR burn:
                    </Text>
                </TextInfo>
                <Text fontSize="18px" fontWeight="bold">-{newDailyDBRBurn ? shortenNumber(newDailyDBRBurn, 4) : ''}</Text>
            </VStack>
            <VStack borderLeft={{ base: 'none', sm: "1px solid #cccccc66" }} py={{ base: '0', sm: '4' }} w={{ base: 'full', sm: '50%' }}  spacing="0" alignItems={{ base: 'center', sm: 'flex-end' }}>
                <TextInfo message="DBR tokens you will receive, they will be automatically used to cover borrowing interests over time. Don't sell them unless you know what you're doing!">
                    <Text fontSize="18px"cursor="pointer" onClick={() => onDbrOpen()} color="mainTextColor">
                        New DBR expiry date:
                    </Text>
                </TextInfo>
                <Text fontSize="18px" fontWeight="bold">
                    {!!newDBRExpiryDate ? moment(newDBRExpiryDate).format('MMM Do, YYYY') : '-'}
                </Text>
            </VStack>
        </Stack>
    </VStack>
}