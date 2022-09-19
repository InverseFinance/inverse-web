import { Stack, VStack, Text, HStack, useMediaQuery, FlexProps, Divider, Flex, Box, useDisclosure, SimpleGrid } from '@chakra-ui/react'
import Container from '@app/components/common/Container'
import { shortenNumber } from '@app/util/markets'
import { parseEther } from '@ethersproject/units'
import { SimpleAmountForm } from '@app/components/common/SimpleAmountForm'
import { F2Market } from '@app/types'
import { JsonRpcSigner } from '@ethersproject/providers'
import { f2CalcNewHealth, getRiskColor } from '@app/util/f2'
import { BigNumber } from 'ethers'
import { useAccountDBRMarket, useDBRPrice } from '@app/hooks/useDBR'
import { useEffect, useState } from 'react'
import { BigImageButton } from '@app/components/common/Button/BigImageButton'
import { AnimatedInfoTooltip } from '@app/components/common/Tooltip'
import { preciseCommify } from '@app/util/misc'
import { F2DurationInput, F2DurationMultiInput } from './F2DurationInput'
import InfoModal from '@app/components/common/Modal/InfoModal'
import { MarketImage } from '@app/components/common/Assets/MarketImage'
import { TOKENS } from '@app/variables/tokens'
import { getNetworkConfigConstants } from '@app/util/networks'
import { InfoMessage } from '@app/components/common/Messages'

const TextInfo = ({ message, children, color = 'mainTextColor' }) => {
    return <HStack>
        <AnimatedInfoTooltip
            message={message}
            iconProps={{ color, fontSize: '12px' }}
        />
        {children}
    </HStack>
}

const { DOLA } = getNetworkConfigConstants();

const dolaToken = TOKENS[DOLA];

const AmountInfos = ({
    label,
    value,
    newValue,
    price,
    dbrCover
}: {
    label: string
    value: number
    newValue?: number
    price?: number
    dbrCover?: number
}) => {
    const textProps = { fontSize: '12px', color: 'secondaryTextColor' }
    return <HStack spacing="1" justify="space-between">
        <Text {...textProps}>
            {label}: {shortenNumber(value, 2, false, true)} {price && value ? `(${shortenNumber(value * price, 2, true)})` : ''}
        </Text>
        {
            !!newValue && value !== newValue &&
            <Text {...textProps}>=> {shortenNumber(newValue, 2, false, true)} {price ? `(${shortenNumber(newValue * price, 2, true)})` : ''}{dbrCover ? ` + DBR Cover = ${shortenNumber(dbrCover + newValue, 2)}` : ''}</Text>
        }
    </HStack>
}

export const F2CombinedForm = ({
    f2market,
    account,
    signer,
    isDepositDefault = true,
    onDepositChange,
    onDebtChange,
    onHealthOpen,
    onDbrOpen,
    ...props
}: {
    f2market: F2Market
    account: string | null | undefined
    signer: JsonRpcSigner | undefined
    isDepositDefault?: boolean
    onDepositChange?: (v: number) => void
    onDebtChange?: (v: number) => void
    onHealthOpen: () => void,
    onDbrOpen: () => void,
} & Partial<FlexProps>) => {
    const colDecimals = f2market.underlying.decimals;
    const [duration, setDuration] = useState(365);
    const [collateralAmount, setCollateralAmount] = useState(0);
    const [debtAmount, setDebtAmount] = useState(0);
    const [isDeposit, setIsDeposit] = useState(isDepositDefault);
    const [isSmallerThan728] = useMediaQuery('(max-width: 728px)');
    const { price: dbrPrice } = useDBRPrice();
    const { isOpen, onOpen, onClose } = useDisclosure();

    const { deposits, bnDeposits, debt, bnWithdrawalLimit, perc, bnDolaLiquidity, bnCollateralBalance, collateralBalance } = useAccountDBRMarket(f2market, account);

    const dbrCover = debtAmount / (365 / duration);
    const dbrCoverDebt = debtAmount * dbrPrice / (365 / duration);
    // const newTotalDebt = newDebt + dbrCover;

    const {
        newDebt, newDeposits
    } = f2CalcNewHealth(f2market, deposits, debt, collateralAmount, debtAmount, perc);

    const {
        newPerc, newLiquidationPrice, newCreditLimit, newDebt: newTotalDebt
    } = f2CalcNewHealth(f2market, deposits, debt + dbrCoverDebt, collateralAmount, debtAmount, perc);

    const handleAction = (amount: BigNumber) => {
        if (!signer) { return }
        alert('Simple-Mode Contract is not implemented yet - Please Advanced-Mode for now');
    }

    const handleCollateralChange = (floatNumber: number) => {
        setCollateralAmount(floatNumber)
    }

    const handleDebtChange = (floatNumber: number) => {
        setDebtAmount(floatNumber)
    }

    useEffect(() => {
        if (!onDepositChange) { return };
        onDepositChange(isDeposit ? collateralAmount : -collateralAmount);
    }, [isDeposit, collateralAmount, onDepositChange]);

    useEffect(() => {
        if (!onDebtChange) { return };
        onDebtChange(isDeposit ? debtAmount : -debtAmount);
    }, [isDeposit, debtAmount, onDebtChange]);

    const btnLabel = isDeposit ? `Deposit & Borrow` : 'Withdraw';
    const btnMaxlabel = `${btnLabel} Max`;
    const isFormFilled = (!!collateralAmount && !!debtAmount) || debt > 0 || newDebt > 0;
    const riskColor = !isFormFilled ? 'mainTextColor' : getRiskColor(newPerc);

    const leftPart = <Stack direction={{ base: 'column', lg: 'row' }} spacing="4" w={{ base: '100%', lg: '100%' }} >
        <VStack w='full' alignItems="flex-start">
            <TextInfo message="The more you deposit, the more you can borrow against">
                <Text color="mainTextColor"><b>Deposit</b> {f2market.name}:</Text>
            </TextInfo>
            <SimpleAmountForm
                address={f2market.collateral}
                destination={f2market.address}
                signer={signer}
                decimals={colDecimals}
                maxAmountFrom={isDeposit ? [bnCollateralBalance] : [bnDeposits, bnWithdrawalLimit]}
                onAction={({ bnAmount }) => handleAction(bnAmount)}
                onMaxAction={({ bnAmount }) => handleAction(bnAmount)}
                actionLabel={btnLabel}
                maxActionLabel={btnMaxlabel}
                onAmountChange={handleCollateralChange}
                showMaxBtn={isDeposit || !debt}
                hideInputIfNoAllowance={false}
                hideButtons={true}
                showBalance={true}
                inputRight={<MarketImage pr="2" image={f2market.icon || f2market.underlying.image} size={25} />}
                isError={collateralAmount > collateralBalance}
            />
            <AmountInfos label="Deposits" value={deposits} newValue={newDeposits} price={f2market.price} />
        </VStack>
        <VStack w='full' alignItems="flex-start">
            <TextInfo message="The amount of DOLA stablecoin you wish to borrow">
                <Text color="mainTextColor"><b>Borrow</b> DOLA:</Text>
            </TextInfo>
            <SimpleAmountForm
                address={f2market.collateral}
                destination={f2market.address}
                signer={signer}
                decimals={colDecimals}
                maxAmountFrom={isDeposit ? [bnDolaLiquidity, parseEther((newCreditLimit * 0.99).toFixed(0))] : []}
                onAction={({ bnAmount }) => handleAction(bnAmount)}
                onMaxAction={({ bnAmount }) => handleAction(bnAmount)}
                actionLabel={btnLabel}
                maxActionLabel={btnMaxlabel}
                onAmountChange={handleDebtChange}
                showMax={false}
                showMaxBtn={!isDeposit}
                hideInputIfNoAllowance={false}
                hideButtons={true}
                isDisabled={newPerc < 1}
                inputRight={<MarketImage pr="2" image={dolaToken.image} size={25} />}
            />
            <AmountInfos dbrCover={dbrCoverDebt} label="Debt" value={debt} newValue={newDebt} />
        </VStack>
    </Stack>

    const rightPart = <VStack spacing='4' w={{ base: '100%', lg: '100%' }}>
        <VStack w='full' alignItems="flex-start">
            <TextInfo message="This will lock-in a Borrow Rate for the desired duration, after the duration you can still keep the loan but at the expense of a higher debt and Borrow Rate.">
                <Text color="mainTextColor"><b>Duration</b> of the Fixed-Rate Loan:</Text>
            </TextInfo>
            <F2DurationInput
                onChange={(v) => setDuration(v)}
            />
            {/* <F2DurationMultiInput
                onChange={(v) => setDuration(v)}                
            /> */}
        </VStack>
    </VStack>

    const actionBtn = <HStack>
        <SimpleAmountForm
            defaultAmount={collateralAmount?.toString()}
            address={f2market.collateral}
            destination={f2market.address}
            signer={signer}
            decimals={colDecimals}
            maxAmountFrom={isDeposit ? [bnCollateralBalance] : [bnDeposits, bnWithdrawalLimit]}
            onAction={({ bnAmount }) => handleAction(bnAmount)}
            onMaxAction={({ bnAmount }) => handleAction(bnAmount)}
            actionLabel={btnLabel}
            maxActionLabel={btnMaxlabel}
            onAmountChange={handleCollateralChange}
            showMaxBtn={false}
            isDisabled={duration <= 0 || debtAmount <= 0 || collateralAmount <= 0}
            hideInputIfNoAllowance={false}
            hideInput={true}
            hideButtons={false}
            btnProps={{
                h: '50px',
                w: 'fit-content',
                fontSize: '18px'
            }}
        />
    </HStack>

    const bottomPart = <Stack position="relative" alignItems="center" justify="space-between" spacing="4" w='full' direction={{ base: 'column', sm: 'row' }}>
        <VStack alignItems="flex-start">
            <TextInfo color="accentTextColor" message="The Fixed Annual Borrowing Rate">
                <Text color="accentTextColor">Current Fixed-Rate:</Text>
            </TextInfo>
            <Text color="accentTextColor" fontWeight="extrabold" fontSize="24px">
                {shortenNumber(dbrPrice * 100, 2)}%
            </Text>
        </VStack>
        {actionBtn}
    </Stack>

    return <Container
        noPadding
        p="0"
        label={isSmallerThan728 ? 'Deposit & Borrow' : `Deposit ${f2market.name} and Borrow DOLA`}
        description={`Quick and Easy Fixed-Rate Borrowing - Learn More`}
        href="https://docs.inverse.finance/inverse-finance/about-inverse"
        // contentBgColor={'lightPrimaryAlpha'}
        image={isSmallerThan728 ? undefined : <BigImageButton bg={`url('/assets/dola.png')`} h="50px" w="80px" />}
        // right={
        //     <F2DurationSlider duration={duration} onChange={(v) => setDuration(v)} />
        // }
        w='full'
        {...props}
    >
        <InfoModal title="Loan Breakdown" isOpen={isOpen} onClose={onClose} onOk={onClose}>
            <VStack>
                <Text>Breakdown here</Text>
            </VStack>
        </InfoModal>
        <VStack position="relative" w='full' px='2%' py="2" alignItems="center" spacing="6">
            <Stack justify="space-between" w='full' spacing="6" direction={{ base: 'column' }}>
                {leftPart}
                {rightPart}
            </Stack>
            {
                parseFloat(collateralAmount) > collateralBalance &&
                <InfoMessage
                    alertProps={{ w: 'full' }}
                    description="Not Enough collateral to deposit"
                />
            }
            <Divider borderColor="#cccccc66" />
            <Stack w='full' direction={{ base: 'column', sm: 'row' }} justify="space-between">
                <VStack spacing="0" alignItems="flex-start">
                    <TextInfo message="Percentage of the loan covered by the collateral worth">
                        <Text color="mainTextColor" cursor="pointer" onClick={() => onHealthOpen()} >
                            Collateral Health:
                        </Text>
                    </TextInfo>
                    <Text color={newPerc < 75 ? riskColor : undefined} fontWeight={isFormFilled && newPerc <= 25 ? 'bold' : undefined}>{isFormFilled ? `${shortenNumber(newPerc, 2)}%` : '-'}</Text>
                </VStack>
                <VStack spacing="0" alignItems="flex-start">
                    <TextInfo message="Minimum Collateral Price before liquidations can happen">
                        <Text color="mainTextColor" cursor="pointer" onClick={() => onHealthOpen()}>
                            Liq. Price:
                        </Text>
                    </TextInfo>
                    <Text color={newPerc < 75 ? riskColor : undefined} fontWeight={isFormFilled && newPerc <= 25 ? 'bold' : undefined}>
                        {isFormFilled ? newLiquidationPrice >= f2market.price ? 'Instant' : `${preciseCommify(newLiquidationPrice, 2, true)}` : '-'}
                    </Text>
                </VStack>
                <VStack spacing="0" alignItems={{ base: 'flex-start', sm: 'flex-end' }}>
                    <TextInfo message="DBR tokens you will receive, they will be automatically used to cover borrowing interests over time. Don't sell them unless you know what you're doing!">
                        <Text cursor="pointer" onClick={() => onDbrOpen()} color="mainTextColor">
                            DBR cover:
                        </Text>
                    </TextInfo>
                    <Text>{shortenNumber(dbrCover, 2)} ({shortenNumber(dbrCoverDebt, 2, true)})</Text>
                </VStack>
                <VStack spacing="0" alignItems={{ base: 'flex-start', sm: 'flex-end' }}>
                    <TextInfo message="The Fixed Rate will be locked-in for a specific duration, you can change the duration by clicking the settings icon.">
                        <Text cursor="pointer" onClick={() => onDbrOpen()} color="mainTextColor">
                            Rate Validity:
                        </Text>
                    </TextInfo>
                    <Text>{duration} days</Text>
                </VStack>
            </Stack>
            <Divider borderColor="#cccccc66" />
            {bottomPart}
        </VStack>
    </Container>
}