import { Stack, VStack, Text } from '@chakra-ui/react'
import { shortenNumber } from '@app/util/markets'
import { preciseCommify } from '@app/util/misc'
import { TextInfo } from '@app/components/common/Messages/TextInfo'
import moment from 'moment'
import { NavButtons } from '@app/components/common/Button'
import ScannerLink from '@app/components/common/ScannerLink'
import { useState } from 'react'
import { getNetworkConfigConstants } from '@app/util/networks'
import Link from '@app/components/common/Link'

type Data = {
    tooltip: string
    onClick: () => void
    color: string
    fontWeight: string
    title: string
    value: string
}

const Infos = ({ infos }: { infos: [Data, Data] }) => {
    const [left, right] = infos;
    return <Stack borderBottom="1px solid #cccccc66" w='full' direction={{ base: 'column', sm: 'row' }} justify="space-between">
        <VStack py={{ base: '0', sm: '4' }} w={{ base: 'full', sm: '50%' }} spacing="0" alignItems={{ base: 'center', sm: 'flex-start' }}>
            <TextInfo message="Percentage of the loan covered by the collateral worth">
                <Text fontSize="18px" color="mainTextColor" cursor={left.onClick ? 'pointer' : undefined} onClick={left.onClick} >
                    {left.title}:
                </Text>
            </TextInfo>
            <Text fontSize="18px" color={left.color} fontWeight={left.fontWeight || 'bold'}>
                {left.value}
            </Text>
        </VStack>
        <VStack py={{ base: '0', sm: '4' }} w={{ base: 'full', sm: '50%' }} borderLeft={{ base: 'none', sm: "1px solid #cccccc66" }} spacing="0" alignItems={{ base: 'center', sm: 'flex-end' }}>
            <TextInfo message="Percentage of the loan covered by the collateral worth">
                <Text fontSize="18px" color="mainTextColor" cursor={right.onClick ? 'pointer' : undefined} onClick={right.onClick} >
                    {right.title}:
                </Text>
            </TextInfo>
            <Text fontSize="18px" color={right.color} fontWeight={right.fontWeight || 'bold'}>
                {right.value}
            </Text>
        </VStack>
    </Stack>
}

const ListInfos = ({ listInfos }: { listInfos: [Data, Data][] }) => {
    return <VStack spacing="0" w='full'>
        {
            listInfos.map((infos, i) => {
                return <Infos key={i} infos={infos} />
            })
        }
    </VStack>
}

const { DBR } = getNetworkConfigConstants();

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
    collateralAmount,
    debtAmount,
    isDeposit,
    deposits,
    debt,
    newDeposits,
    newTotalDebt,
    newCreditLimit,
    newCreditLeft,
    dbrBalance,
    isAutoDBR,
    onHealthOpen = () => { },
    onDbrOpen = () => { },
}) => {
    const [type, setType] = useState('Position Result');

    const newDbrBalance = dbrBalance + (isAutoDBR ? isDeposit ? dbrCover : -dbrCover : 0);

    const marketInfos = [
        [
            {
                tooltip: 'Main Smart Contract handling this Market',
                title: 'Market Contract',
                value: <ScannerLink value={f2market.address} />,
            },
            {
                tooltip: 'Collateral Smart Contract used for this Market',
                title: 'Collateral Contract',
                value: <ScannerLink value={f2market.underlying.address} />,
            },
        ],
        [
            {
                tooltip: 'Collateral Factor for the collateral in this Market',
                title: 'Collateral Factor',
                value: `${shortenNumber(f2market.collateralFactor * 100, 2)}%`,
            },
            {
                tooltip: 'Current Collateral Price according to the Oracle',
                title: 'Collateral Price',
                value: `${shortenNumber(f2market.price, 2, true)}`,
            },
        ],
        [
            {
                tooltip: 'The current DOLA liquidity available to borrow in this market',
                title: 'Market DOLA liquidity',
                value: `${shortenNumber(f2market.dolaLiquidity, 2)}`,
            },
            {
                tooltip: 'Total amount of DOLA already borrowed from this market',
                title: 'Total Already Borrowed',
                value: `${shortenNumber(f2market.totalDebt, 2, true)}`,
            },
        ],
        [
            {
                tooltip: 'Incentive regarding forced top-ups on borrowers in DBR deficit',
                title: 'DBR Top-up incentive',
                value: `${shortenNumber(f2market.replenishmentIncentive * 100, 2)}%`,
            },
            {
                tooltip: 'Liquidation incentive to liquidate shortfalling loans',
                title: 'Liquidation Incentive',
                value: `${shortenNumber(f2market.liquidationIncentive * 100, 2, true)}%`,
            },
        ],
    ]

    const dbrInfos = [
        [
            {
                tooltip: 'DBR Smart Contract',
                title: 'DBR Contract',
                value: <ScannerLink value={DBR} />,            
            },
            {
                tooltip: 'Learn more about DBR',
                title: 'DBR docs',
                value: <Link textDecoration="underline" color="mainTextColor" href="https://docs.google.com/document/d/1xDsuhhXTHqNLIZmlwjzCf-P7bjDvQEI72dS0Z0GGM38" isExternal target="_blank">
                    Learn More
                </Link>,            
            },
        ],
        [
            {
                tooltip: 'tbd',
                title: 'DBR balance',
                value: `${preciseCommify(dbrBalance, 2)} (${shortenNumber(dbrBalance * dbrPrice, 2, true)})`,
            },
            {
                tooltip: 'tbd',
                title: 'New DBR balance',
                value: newDbrBalance === dbrBalance ? 'No change' : `${preciseCommify(newDbrBalance, 2)}  (${shortenNumber((newDbrBalance) * dbrPrice, 2, true)})`,
            },
        ],
        [
            {
                tooltip: 'Current market price for DBR, the token used to pay borrowing fees',
                title: 'Current DBR price',
                value: `${shortenNumber(dbrPrice, 4, true)}`,
            },
            {
                tooltip: "DBR tokens you will receive, they will be automatically used to cover borrowing interests over time. Don't sell them unless you know what you're doing!",
                title: 'Fees over time for this loan',
                value: `${shortenNumber(dbrCover, 2)} DBRs (${shortenNumber(dbrCoverDebt, 2, true)})`,
            },
        ],
        [
            {
                tooltip: 'The total number of DBRs that will be burned every day',
                title: 'Total daily DBR burn',
                value: `-${newDailyDBRBurn ? `${shortenNumber(newDailyDBRBurn, 4)} (${shortenNumber(newDailyDBRBurn * dbrPrice, 2, true)})` : ''}`,
            },
            {
                tooltip: "Date where you will run out of DBRs",
                title: 'DBR depletion date',
                value: !!newDBRExpiryDate ? moment(newDBRExpiryDate).format('MMM Do, YYYY') : '-',
            },
        ],
    ]

    const positionInfos = [
        [
            {
                tooltip: `Amouunt of Collateral that you are ${isDeposit ? 'depositing' : 'withdrawing'}`,
                title: isDeposit ? 'Depositing' : 'Withdrawing',
                value: `${collateralAmount > 0 ? `${shortenNumber(collateralAmount, 4)} (${shortenNumber(collateralAmount * f2market.price, 2, true)})` : '-'}`,
            },
            {
                tooltip: `Amouunt of Debt that you are ${isDeposit ? 'borrowing' : 'repaying'}`,
                title: isDeposit ? 'Borrowing' : 'Repaying',
                value: `${debtAmount > 0 ? shortenNumber(debtAmount, 4) : '-'}`,
            },
        ],
        [
            {
                tooltip: 'The total amount of collateral after you deposit/withdraw',
                title: 'Total Deposits',
                value: `${newDeposits ? `${shortenNumber(newDeposits, 4)} (${shortenNumber(newDeposits * f2market.price, 2, true)})` : '-'}`,
            },
            {
                tooltip: 'The total amount of debt after you borrow/repay',
                title: 'Total Debt',
                value: `${newTotalDebt ? shortenNumber(newTotalDebt, 2) : '-'}`,
            },
        ],
        [
            {
                tooltip: 'The total Borrowing Power given by your collaterals in USD',
                title: 'Borrowing Power',
                value: `${newCreditLimit ? `${shortenNumber(newCreditLimit, 2, true)}` : '-'}`,
            },
            {
                tooltip: 'Your remaining Borrowing Power',
                title: 'Borrowing Power Left',
                value: `${newCreditLeft ? shortenNumber(newCreditLeft, 2, true) : '-'}`,
            },
        ],
        [
            {
                tooltip: 'Percentage of the loan covered by the collateral worth',
                title: 'Collateral Health',
                value: isFormFilled ? `${shortenNumber(newPerc, 2)}%` : '-',
                color: newPerc < 75 ? riskColor : undefined,
            },
            {
                tooltip: 'Minimum Collateral Price before liquidations can happen',
                title: 'Liquidation Price',
                value: isFormFilled ? newLiquidationPrice >= f2market.price ? 'Instant' : `${preciseCommify(newLiquidationPrice, 2, true)}` : '-',
                color: newPerc < 75 ? riskColor : undefined,
            },
        ],
    ]

    const lists = {
        'Position Result': positionInfos,
        'DBR Infos': dbrInfos,
        'Market Infos': marketInfos,
    }

    return <VStack spacing="0" w='full'>
        <NavButtons
            active={type}
            options={['Position Result', 'DBR Infos', 'Market Infos']}
            onClick={(v) => setType(v)}
        />
        <ListInfos listInfos={lists[type]} />
    </VStack>
}