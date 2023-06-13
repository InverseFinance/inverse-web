import { Stack, VStack, Text } from '@chakra-ui/react'
import { shortenNumber } from '@app/util/markets'
import { preciseCommify } from '@app/util/misc'
import { TextInfo } from '@app/components/common/Messages/TextInfo'
import { NavButtons } from '@app/components/common/Button'
import ScannerLink from '@app/components/common/ScannerLink'
import { useContext, useEffect, useState } from 'react'
import { getNetworkConfigConstants } from '@app/util/networks'
import Link from '@app/components/common/Link'
import { getDBRRiskColor, getDepletionDate } from '@app/util/f2'
import { InfoMessage } from '@app/components/common/Messages'
import { F2MarketContext } from '../F2Contex'
import { useFirmMarketEvents } from '@app/hooks/useFirm'
import { useAccount } from '@app/hooks/misc'
import { FirmAccountEvents } from '../Infos/FirmAccountEvents'
import { ErrorBoundary } from '@app/components/common/ErrorBoundary'
import { OracleType } from '../Infos/OracleType'
import { gaEvent } from '@app/util/analytics'
import { useDBRNeeded } from '@app/hooks/useDBR'

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
        <VStack pt={{ base: '0', sm: '4' }} pb={{ base: 0, sm: isLast ? '0' : '4' }} w={{ base: 'full', sm: '50%' }} spacing="0" alignItems={'flex-start'}>
            <TextInfo message={left.tooltip}>
                <Text fontSize="18px" color="mainTextColor" cursor={left.onClick ? 'pointer' : undefined} onClick={left.onClick} >
                    {left.title}:
                </Text>
            </TextInfo>
            <Text fontSize="18px" color={left.color} fontWeight={left.fontWeight || 'bold'}>
                {left.value}
            </Text>
        </VStack>
        <VStack pt={{ base: '0', sm: '4' }} pb={{ base: 0, sm: isLast ? '0' : '4' }} pl={{ base: 0, sm: '4' }} w={{ base: 'full', sm: '50%' }} borderLeft={{ base: 'none', sm: "1px solid #cccccc66" }} spacing="0" alignItems={'flex-start'}>
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
    const lastIndex = listInfos.length - 1;
    console.log(listInfos)
    return <VStack spacing="0" w='full' minH={{ base: '350px', md: '0' }}>
        {
            listInfos.map((infos, i) => {
                return <Infos key={infos[0]?.title} infos={infos} index={i} isLast={i === lastIndex} />
            })
        }
    </VStack>
}

const { DBR } = getNetworkConfigConstants();

// TODO: clean this mess
export const F2FormInfos = (props: { debtAmountNumInfo: number, collateralAmountNumInfo: number }) => {
    const account = useAccount();

    const {
        collateralAmountNumInfo,
        debtAmountNumInfo,
    } = props;

    const {
        infoTab,
        setInfoTab,
        newBorrowLimit,
        maxBorrow,
        riskColor,
        newLiquidationPrice,
        market,
        dbrCoverDebt,
        dbrCover,
        dbrPrice,
        dbrSwapPrice,
        newDailyDBRBurnInMarket,
        newDBRExpiryDate,
        isDeposit,
        deposits,
        debt,
        debtAmount,
        newDeposits,
        newTotalDebt,
        newTotalDebtInMarket,
        newCreditLimit,
        dbrBalance,
        isAutoDBR,
        dbrApproxData,
    } = useContext(F2MarketContext);

    const [now, setNow] = useState(Date.now());
    const { events, isLoading: isLoadingEvents, depositedByUser, liquidated } = useFirmMarketEvents(market, account);    
    const collateralRewards = (deposits + liquidated) - depositedByUser;

    useEffect(() => {
        let interval = setInterval(() => {
            setNow(Date.now());
        }, 60000);
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
                value: <ScannerLink value={market.address} useName={false} />,
            },
            {
                tooltip: 'Collateral Smart Contract used for this Market',
                title: 'Collateral Contract',
                value: <ScannerLink value={market.underlying.address} useName={false} />,
            },
        ],
        [
            {
                tooltip: 'Main Smart Contract handling this Market',
                title: 'Oracle Feed',
                value: <ScannerLink value={market.oracleFeed} useName={false} />,
            },
            {
                tooltip: 'On-chain source for the collateral price. PPO is the Pessimistic Price Oracle, it uses the two-day low price of the source oracle.',
                title: 'Oracle Type',
                value: <OracleType oracleType={market.oracleType} showImage={false} simplify={true} />,
            },
        ],
        [
            {
                tooltip: 'Max Collateral Factor for the collateral in this Market',
                title: 'Max Collateral Factor',
                value: `${shortenNumber(market.collateralFactor * 100, 2)}%`,
            },
            {
                tooltip: 'Current Collateral Price according to the Oracle',
                title: 'Collateral Price',
                value: `${preciseCommify(market.price, 2, true)}`,
            },
        ],
        [
            {
                tooltip: 'The current DOLA liquidity available to borrow in this market',
                title: 'Market DOLA liquidity',
                value: `${preciseCommify(market.dolaLiquidity, 0, true)}`,
            },
            {
                tooltip: 'Total amount of DOLA already borrowed from this market',
                title: 'Total Already Borrowed',
                value: `${preciseCommify(market.totalDebt, 0, true)}`,
            },
        ],
        [
            {
                tooltip: 'The daily limit of borrowable DOLAs in the market (UTC timezone)',
                title: 'Daily Borrow Limit',
                value: market.dailyLimit > 0 ? `${preciseCommify(market.dailyLimit, 0, true)}` : 'No daily limit',
            },
            {
                tooltip: 'The remaining DOLA borrowable today (UTC timezone)',
                title: 'Remaining liquidity',
                value: market.dailyLimit > 0 ? `${preciseCommify(market.leftToBorrow, 0, true)}` : 'No daily limit',
            },
        ],
        [
            {
                tooltip: 'Incentive regarding forced top-ups on borrowers in DBR deficit',
                title: 'DBR Top-up incentive',
                value: `${shortenNumber(market.replenishmentIncentive * 100, 2)}%`,
            },
            {
                tooltip: 'Liquidation incentive to liquidate shortfalling loans',
                title: 'Liquidation Incentive',
                value: `${shortenNumber(market.liquidationIncentive * 100, 2)}%`,
            },
        ],
    ]

    const dbrInfos = [
        [
            {
                tooltip: 'DBR Smart Contract',
                title: 'DBR Contract',
                value: <ScannerLink value={DBR} useName={false} />,
            },
            {
                tooltip: 'Learn more about DBR',
                title: 'DBR docs',
                value: <Link textDecoration="underline" color="mainTextColor" href="https://docs.inverse.finance/inverse-finance/dbr-dola-borrowing-rights" isExternal target="_blank">
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
                tooltip: 'The DBR swap price on the Curve pool for the exact DOLA demanded. Includes some extra dola when auto-buying DBR.',
                title: debtAmount ? 'DBR swap price' : 'DBR market price',
                value: `~${shortenNumber(debtAmount ? dbrSwapPrice : dbrPrice, 6, true)}`,
            },
            {
                tooltip: "DBR tokens needed for the borrow, they will be automatically used to cover borrowing interests over time. Don't sell them unless you know what you're doing! When auto-buying extra DBRs are added as cost to cover the auto-buyed DBRs.",
                title: `${isAutoDBR ? 'Auto-buy ' : ''}DBR cost`,
                value: dbrCover > 0 && isDeposit ? `~${shortenNumber(dbrCover, 2)} DBRs (${shortenNumber(dbrCoverDebt, 2, true)})` : '-',
            },
        ],
        [
            {
                tooltip: 'The total number of DBRs that will be spent every day',
                title: 'Daily DBR spend',
                value: `-${newDailyDBRBurnInMarket ? `${shortenNumber(newDailyDBRBurnInMarket, 4)} (${shortenNumber(newDailyDBRBurnInMarket * dbrPrice, 2, true)})` : ''}`,
            },
            {
                tooltip: "Date where you will run out of DBRs, it is recommended that you always have DBRs in your wallet as when you run out of DBRs someone can force top-up your balance and this will cost your additional debt",
                title: 'DBR depletion date',
                value: getDepletionDate(newDBRExpiryDate, now),
                color: newTotalDebt > 0 ? getDBRRiskColor(newDBRExpiryDate, now) : undefined
            },
        ],
    ];

    const positionInfos = [
        [
            {
                tooltip: 'Percentage of the borrow capacity used, should not reach 100%',
                title: 'Borrow Limit',
                value: !!deposits || !!newDeposits ? `${shortenNumber(newBorrowLimit, 2)}%` : '-',
                color: newDeposits > 0 || newTotalDebtInMarket > 0 ? riskColor : undefined,
            },
            {
                tooltip: 'Minimum Collateral Price before liquidations can happen',
                title: 'Liquidation Price',
                value: (!!deposits || !!newDeposits) && newLiquidationPrice > 0 ? `${preciseCommify(newLiquidationPrice, 2, true)}` : '-',
                color: newDeposits > 0 || newTotalDebtInMarket > 0 ? riskColor : undefined,
            },
        ],
        [
            {
                tooltip: `Amouunt of Collateral that you are ${isDeposit ? 'depositing' : 'withdrawing'}`,
                title: isDeposit ? 'Depositing' : 'Withdrawing',
                value: `${collateralAmountNumInfo > 0 ? `${shortenNumber(collateralAmountNumInfo, 4)} ${market.underlying.symbol} (${shortenNumber(collateralAmountNumInfo * market.price, 2, true)})` : '-'}`,
            },
            {
                tooltip: `Amouunt of Debt that you are ${isDeposit ? 'borrowing' : 'repaying'}`,
                title: isDeposit ? 'Borrowing' : 'Repaying',
                value: `${debtAmountNumInfo > 0 ? `${shortenNumber(debtAmountNumInfo, 2)} DOLA` : '-'}`,
            },
        ],
        [
            {
                tooltip: 'The resulting collateral balance after you deposit/withdraw',
                title: 'Total Balance',
                value: `${newDeposits ? `${shortenNumber(newDeposits, 2)} ${market.underlying.symbol} (${shortenNumber(newDeposits * market.price, 2, true)})` : '-'}`,
            },
            {
                tooltip: 'The total amount of debt after you borrow/repay',
                title: 'Total Debt',
                value: `${newTotalDebtInMarket ? `${preciseCommify(newTotalDebtInMarket, 2)} DOLA` : '-'}`,
            },
        ],
        [
            {
                tooltip: 'Technical Max Borrowing Power, usually you would avoid borrowing the maximum to reduce liquidation risk',
                title: 'Your borrowing power',
                value: `${maxBorrow ? `${preciseCommify(maxBorrow, 2)} DOLA` : '-'}`,
            },
            {
                tooltip: 'Max debt before liquidation',
                title: 'Max Debt',
                value: `${newCreditLimit ? `${preciseCommify(newCreditLimit < 0 ? 0 : newCreditLimit, 0)} DOLA` : '-'}`,
                color: newCreditLimit <= 0 && newDeposits > 0 ? 'error' : undefined
            },
        ],
    ];

    const hasCollateralRewards = collateralRewards >= 0.01;

    const stakingInfos = !hasCollateralRewards ? [] : [
        {
            tooltip: 'The amount of collateral that comes from your deposits alone (excludes staking rewards and liquidations)',
            title: 'Originally Deposited',
            value: depositedByUser >= 0 ? `${shortenNumber(depositedByUser, 2)} ${market.underlying.symbol}` : 'All have been withdrawn',
        },
        {
            tooltip: 'The increase in collateral balance thanks to staking, anti-dilution protection or other mechanism that increases your collateral balance over time. USD value at current price.',
            title: market.isInv ? 'Anti-dilution protection' : 'Earned with staking',
            value: `${preciseCommify(collateralRewards, 2)} ${market.underlying.symbol} (${shortenNumber(collateralRewards * market.price, 2, true)})`,
            color: 'seagreen',
        },
    ];

    const keyInfos = market.isInv ? [
        positionInfos[2],
    ] : [
        positionInfos[0],
        dbrInfos[3],
        // positionInfos[1],
        positionInfos[2],
        positionInfos[3],
    ];

    if (!market.isInv) {
        keyInfos.splice(2, 0, dbrInfos[2]);
    }

    if (hasCollateralRewards) {
        const balanceIndex = keyInfos.findIndex((v) => v[0].title === 'Total Balance');
        keyInfos.splice(balanceIndex, 0, stakingInfos);
    }

    const lists = {
        'Summary': keyInfos,
        // 'My Activity': positionInfos,
        'DBR Details': dbrInfos,
        'Market Details': marketInfos,
    }

    const tabItems = lists[infoTab];

    const handleTabChange = (v: string) => {
        setInfoTab(v);
        gaEvent({ action: `FiRM-info-tab-${v.toLowerCase().replace(' ', '_')}` });
    }

    return <VStack spacing="0" w='full'>
        <NavButtons
            active={infoTab}
            options={['Summary', 'My Activity', 'DBR Details', 'Market Details']}
            onClick={(v) => handleTabChange(v)}
        />
        {
            !debtAmountNumInfo && !collateralAmountNumInfo && !debt && !deposits && infoTab === 'Summary' ?
                <VStack pt="4" w='full'>
                    <InfoMessage
                        alertProps={{ w: 'full' }}
                        description={
                            <VStack alignItems="flex-start">
                                <Text>You don't have a position in this market yet, the easiest to get started is to use the Walkthrough mode</Text>
                            </VStack>
                        }
                    />
                </VStack>
                :
                infoTab === 'My Activity' ?
                    <VStack pt="4" w='full' alignItems="flex-start">
                        <Text color="secondaryTextColor">
                            Most recent events in this market about my account:
                        </Text>
                        {
                            !events?.length && !isLoadingEvents ?
                                <InfoMessage alertProps={{ w: 'full' }} description="No event yet" />
                                :
                                <ErrorBoundary description={'Something went wrong getting activity'}>
                                    <FirmAccountEvents events={events} account={account} overflowY="auto" maxH="300px" />
                                </ErrorBoundary>
                        }
                    </VStack>
                    :
                    <ListInfos listInfos={tabItems} />
        }
    </VStack>
}