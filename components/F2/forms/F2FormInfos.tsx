import { Stack, VStack, Text, Divider } from '@chakra-ui/react'
import { shortenNumber } from '@app/util/markets'
import { preciseCommify } from '@app/util/misc'
import { TextInfo } from '@app/components/common/Messages/TextInfo'
import { NavButtons } from '@app/components/common/Button'
import ScannerLink from '@app/components/common/ScannerLink'
import { useContext, useEffect, useState } from 'react'
import { getNetworkConfigConstants } from '@app/util/networks'
import Link from '@app/components/common/Link'
import { getDBRRiskColor, getDepletionDate } from '@app/util/f2'
import { RecapInfos } from '../Infos/RecapInfos'
import { InfoMessage } from '@app/components/common/Messages'
import { F2MarketContext } from '../F2Contex'

type Data = {
    tooltip: string
    onClick: () => void
    color: string
    fontWeight: string
    title: string
    value: string
}

const Infos = ({ infos, index, isLast }: { infos: [Data, Data], index: number, isLast: boolean }) => {
    const [left, right] = infos;

    return <Stack py={{ base: '2', sm: '0' }} borderTop={index > 0 ? '1px solid #cccccc66' : undefined} w='full' direction={{ base: 'column', sm: 'row' }} justify="space-between">
        <VStack pt={{ base: '0', sm: '4' }} pb={{ base: 0, sm: isLast ? '0' : '4' }} w={{ base: 'full', sm: '50%' }} spacing="0" alignItems={ 'flex-start' }>
            <TextInfo message={left.tooltip}>
                <Text fontSize="18px" color="mainTextColor" cursor={left.onClick ? 'pointer' : undefined} onClick={left.onClick} >
                    {left.title}:
                </Text>
            </TextInfo>
            <Text fontSize="18px" color={left.color} fontWeight={left.fontWeight || 'bold'}>
                {left.value}
            </Text>
        </VStack>
        <VStack pt={{ base: '0', sm: '4' }} pb={{ base: 0, sm: isLast ? '0' : '4' }} w={{ base: 'full', sm: '50%' }} borderLeft={{ base: 'none', sm: "1px solid #cccccc66" }} spacing="0" alignItems={{ base: 'flex-start', sm: 'flex-end' }}>
            <TextInfo message={right.tooltip}>
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
    const lastIndex = listInfos.length-1;
    return <VStack spacing="0" w='full' minH={{ base: '350px', md: '0' }}>
        {
            listInfos.map((infos, i) => {
                return <Infos key={infos[0].title} infos={infos} index={i} isLast={i === lastIndex} />
            })
        }
    </VStack>
}

const { DBR } = getNetworkConfigConstants();

export const F2FormInfos = (props) => {
    const {
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
        dbrBalance,
        isAutoDBR,
        maxBorrowable,
        durationType,
        durationTypedValue,
        mode,
    } = props;

    const {
        infoTab,
        setInfoTab,
    } = useContext(F2MarketContext);

    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        let interval = setInterval(() => {
            setNow(Date.now());
        });
        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, []);

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
                tooltip: 'Max Collateral Factor for the collateral in this Market',
                title: 'Max Collateral Factor',
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
                value: `${shortenNumber(f2market.dolaLiquidity, 2, true)}`,
            },
            {
                tooltip: 'Total amount of DOLA already borrowed from this market',
                title: 'Total Already Borrowed',
                value: `${shortenNumber(f2market.totalDebt, 2, true)}`,
            },
        ],
        [
            {
                tooltip: 'The daily limit of borrowable DOLAs in the market (UTC timezone)',
                title: 'Daily Borrow Limit',
                value: f2market.dailyLimit > 0 ? `${shortenNumber(f2market.dailyLimit, 2, true)}` : 'No daily limit',
            },
            {
                tooltip: 'The remaining DOLA borrowable today (UTC timezone)',
                title: 'Remaining Daily Limit',
                value: f2market.dailyLimit > 0  ? `${shortenNumber(f2market.leftToBorrow, 2, true)}` : 'No daily limit',
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
                tooltip: 'Your Current DBR balance',
                title: 'DBR balance',
                value: `${preciseCommify(dbrBalance, 2)} (${shortenNumber(dbrBalance * dbrPrice, 2, true)})`,
            },
            {
                tooltip: 'DBR balance after the transaction',
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
                title: 'DBR cost',
                value: dbrCover > 0 && isDeposit ? `${shortenNumber(dbrCover, 2)} DBRs (${shortenNumber(dbrCoverDebt, 2, true)})` : '-',
            },
        ],
        [
            {
                tooltip: 'The total number of DBRs that will be spent every day',
                title: 'Total daily DBR spend',
                value: `-${newDailyDBRBurn ? `${shortenNumber(newDailyDBRBurn, 4)} (${shortenNumber(newDailyDBRBurn * dbrPrice, 2, true)})` : ''}`,
            },
            {
                tooltip: "Date where you will run out of DBRs, it is recommended that you always have DBRs in your wallet as when you run out of DBRs someone can force top-up your balance and this will cost your additional debt",
                title: 'DBR depletion date',
                value: getDepletionDate(newDBRExpiryDate, now),
                color: newTotalDebt > 0 ? getDBRRiskColor(newDBRExpiryDate, now) : undefined
            },
        ],
    ]

    const positionInfos = [
        [
            {
                tooltip: `Amouunt of Collateral that you are ${isDeposit ? 'depositing' : 'withdrawing'}`,
                title: isDeposit ? 'Depositing' : 'Withdrawing',
                value: `${collateralAmount > 0 ? `${shortenNumber(collateralAmount, 4)} ${f2market.underlying.symbol} (${shortenNumber(collateralAmount * f2market.price, 2, true)})` : '-'}`,
            },
            {
                tooltip: `Amouunt of Debt that you are ${isDeposit ? 'borrowing' : 'repaying'}`,
                title: isDeposit ? 'Borrowing' : 'Repaying',
                value: `${debtAmount > 0 ? `${shortenNumber(debtAmount, 2)} DOLA` : '-'}`,
            },
        ],
        [
            {
                tooltip: 'The total amount of collateral after you deposit/withdraw',
                title: 'Total Deposits',
                value: `${newDeposits ? `${shortenNumber(newDeposits, 4)} ${f2market.underlying.symbol} (${shortenNumber(newDeposits * f2market.price, 2, true)})` : '-'}`,
            },
            {
                tooltip: 'The total amount of debt after you borrow/repay',
                title: 'Total Debt',
                value: `${newTotalDebt ? `${shortenNumber(newTotalDebt, 2)} DOLA` : '-'}`,
            },
        ],
        [
            {
                tooltip: '99% of your technical Max Borrowing Power, usually you would avoid being that close to the maximum',
                title: 'Your borrowing power',
                value: `${maxBorrowable ? `${shortenNumber(maxBorrowable, 2)} DOLA` : '-'}`,
            },
            {
                tooltip: 'Max debt before liquidation',
                title: 'Max Debt',
                value: `${newCreditLimit ? `${shortenNumber(newCreditLimit < 0 ? 0 : newCreditLimit, 0)} DOLA` : '-'}`,
                color: newCreditLimit <= 0 && newDeposits > 0 ? 'error' : undefined
            },
        ],
        [
            {
                tooltip: 'Percentage of the loan covered by the collateral worth (taking into account collateral factor)',
                title: 'Loan Health',
                value: !!deposits || !!newDeposits ? `${shortenNumber(newPerc, 2)}%` : '-',
                color: newDeposits > 0 ? riskColor : undefined,
            },
            {
                tooltip: 'Minimum Collateral Price before liquidations can happen',
                title: 'Liquidation Price',
                value: (!!deposits || !!newDeposits) && newLiquidationPrice > 0 ? newLiquidationPrice >= f2market.price ? 'Instant' : `${preciseCommify(newLiquidationPrice, 2, true)}` : '-',
                color: newDeposits > 0 ? riskColor : undefined,
            },
        ],
    ];

    const keyInfos = [
        positionInfos[0],
        [positionInfos[2][0], dbrInfos[3][1]],
        positionInfos[3],
    ];
    if(isAutoDBR && isDeposit && !!debtAmount && ['Deposit & Borrow', 'Borrow'].includes(mode)){
        keyInfos.splice(1, 0, dbrInfos[2]);
    }
    if(!debtAmount  && !collateralAmount){
        keyInfos.splice(0, 1);
    }
    if(deposits > 0 || debt > 0){
        keyInfos.splice(1, 0, positionInfos[1]);
    }

    const lists = {
        'Summary': keyInfos,
        'Position Details': positionInfos,
        'DBR Details': dbrInfos,
        'Market Details': marketInfos,
    }

    const recapData = {
        market: f2market,
        dbrCover,
        newLiquidationPrice,
        durationTypedValue,
        durationType,
        dbrPrice,
        riskColor,
        newPerc,
        dbrCoverDebt,
        collateralAmount,
        debtAmount,
        duration,
        isAutoDBR,
        isTuto: false,
        isDeposit,
        newDBRExpiryDate,
    }

    const tabItems = lists[infoTab];

    return <VStack spacing="0" w='full'>
        <NavButtons
            active={infoTab}
            options={['Summary', 'Position Details', 'DBR Details', 'Market Details']}
            onClick={(v) => setInfoTab(v)}
        />
        {
            infoTab === 'Recap' ?
                <VStack
                    spacing="4"
                    w='full'
                    pt='4'
                    // h='350px'
                    alignItem="center"
                    justifyContent='center'
                    justify='center'
                >
                    <RecapInfos
                        {...recapData}
                        spacing='4'
                    />                    
                </VStack>
                : 
                    tabItems.length <= 2 ?
                    <VStack pt="4" w='full'>
                            <InfoMessage
                    alertProps={{ w: 'full' }} 
                    description={
                        <VStack alignItems="flex-start">
                            <Text>You don't have a position yet in this market, the easiest to get started is to use the Walkthrough mode</Text>
                        </VStack>
                    }
                     />
                        </VStack>
                    :
                    <ListInfos listInfos={tabItems} />

                
        }
    </VStack>
}