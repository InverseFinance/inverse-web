import { Stack, VStack, Text } from '@chakra-ui/react'
import { shortenNumber } from '@app/util/markets'
import { preciseCommify } from '@app/util/misc'
import { TextInfo } from '@app/components/common/Messages/TextInfo'
import { NavButtons } from '@app/components/common/Button'
import ScannerLink from '@app/components/common/ScannerLink'
import { useContext, useEffect, useState } from 'react'
import { getNetworkConfigConstants } from '@app/util/networks'
import Link from '@app/components/common/Link'
import { formatAndGroupFirmEvents, getDBRRiskColor, getDepletionDate } from '@app/util/f2'
import { InfoMessage } from '@app/components/common/Messages'
import { F2MarketContext } from '../F2Contex'
import { useEscrowBalanceEvolution, useFirmMarketEvents } from '@app/hooks/useFirm'
import { useAccount } from '@app/hooks/misc'
import { FirmAccountEvents } from '../Infos/FirmAccountEvents'
import { ErrorBoundary } from '@app/components/common/ErrorBoundary'
import { OracleType } from '../Infos/OracleType'
import { gaEvent } from '@app/util/analytics'
import { SmallTextLoader } from '@app/components/common/Loaders/SmallTextLoader'
import { useAppTheme } from '@app/hooks/useAppTheme'

type Data = {
    tooltip: string
    onClick: () => void
    color: string
    fontWeight: string
    title: string
    value: string
    isLoading?: boolean
    alternativeValueColor?: string
    alternativeValue?: string
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
            {
                left.isLoading ?
                    <SmallTextLoader pt="13px" width={'90px'} />
                    : <Text fontSize="18px" color={left.color} fontWeight={left.fontWeight || 'bold'}>
                        {left.value}
                    </Text>
            }
            {
                left.alternativeValue && !left.isLoading && 
                    <Text fontSize="14px" color={left.alternativeValueColor || left.color}>
                        {left.alternativeValue}
                    </Text>
            }
        </VStack>
        <VStack pt={{ base: '0', sm: '4' }} pb={{ base: 0, sm: isLast ? '0' : '4' }} pl={{ base: 0, sm: '4' }} w={{ base: 'full', sm: '50%' }} borderLeft={{ base: 'none', sm: "1px solid #cccccc66" }} spacing="0" alignItems={'flex-start'}>
            <TextInfo message={right.tooltip}>
                <Text fontSize="18px" color="mainTextColor" cursor={right.onClick ? 'pointer' : undefined} onClick={right.onClick} >
                    {right.title}:
                </Text>
            </TextInfo>
            {
                right.isLoading ?
                    <SmallTextLoader pt="13px" width="90px" /> :
                    <Text fontSize="18px" color={right.color} fontWeight={right.fontWeight || 'bold'}>
                        {right.value}
                    </Text>
            }
        </VStack>
    </Stack>
}

const ListInfos = ({ listInfos }: { listInfos: [Data, Data][] }) => {
    const lastIndex = listInfos.length - 1;
    return <VStack spacing="0" w='full' minH={{ base: '350px', md: '0' }}>
        {
            listInfos.map((infos, i) => {
                return <Infos key={infos[0].title} infos={infos} index={i} isLast={i === lastIndex} />
            })
        }
    </VStack>
}

const { DBR } = getNetworkConfigConstants();

// TODO: clean this mess
export const F2FormInfos = (props: { debtAmountNumInfo: number, collateralAmountNumInfo: number }) => {
    const account = useAccount();
    const { themeStyles } = useAppTheme();

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
        isDbrApproxLoading,
        underlyingExRate,
        escrow,
        firmActionIndex,
    } = useContext(F2MarketContext);

    const [now, setNow] = useState(Date.now());
    const [firmActionDepositsIndexState, setFirmActionDepositsIndexState] = useState(firmActionIndex);
    const { isLoading: isLoadingEvents, events, depositedByUser, currentCycleDepositedByUser, liquidated, depositsOnTopOfLeverageEvents, repaysOnTopOfDeleverageEvents } = useFirmMarketEvents(market, account, firmActionIndex);
    const { formattedEvents, isLoading: isLoadingEventsFromApi, firmActionIndex: responseFirmActionIndex } = useEscrowBalanceEvolution(account, escrow, market.address, firmActionIndex);
    const lastFirmActionIndexLoaded = firmActionIndex === firmActionDepositsIndexState;
    const { grouped: groupedEventsFallback, depositedByUser: depositedByUserFallback, currentCycleDepositedByUser: currentCycleDepositedByUserFallback, liquidated: liquidatedFallback } = formatAndGroupFirmEvents(market, account, lastFirmActionIndexLoaded ? formattedEvents: [], depositsOnTopOfLeverageEvents, repaysOnTopOfDeleverageEvents);
    // same length, use data from api (timestamp already there), otherwise use prefer live data from blockchain
    const _events = events?.length > groupedEventsFallback?.length ? events : groupedEventsFallback;
    const _depositedByUser = depositedByUser || depositedByUserFallback;
    const _currentCycleDepositedByUser = currentCycleDepositedByUser || currentCycleDepositedByUserFallback;
    const _liquidated = liquidated || liquidatedFallback;
    const totalAccCollateralRewards = _depositedByUser > 0 ? (deposits + (_liquidated)) - _depositedByUser : 0;
    // current cycle's collateral rewards
    const collateralRewards = _currentCycleDepositedByUser > 0 ? (deposits + (_liquidated)) - _currentCycleDepositedByUser : 0;

    useEffect(() => {
        setFirmActionDepositsIndexState(firmActionDepositsIndexState);
    }, [responseFirmActionIndex]);
    
    useEffect(() => {
        if(firmActionIndex === null) return;
        setFirmActionDepositsIndexState(firmActionIndex);
    }, [firmActionIndex]);

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
                value: `${preciseCommify(market.dolaLiquidity, 0)}`,
            },
            {
                tooltip: 'The debt in a market is due to what is currently borrowed plus the debt added due to the DBR replenishments.',
                title: 'Total Market Debt',
                value: `${preciseCommify(market.totalDebt, 0)}`,
            },
        ],
        [
            {
                tooltip: 'The daily limit of borrowable DOLAs in the market (UTC timezone)',
                title: 'Daily Borrow Limit',
                value: market.dailyLimit > 0 ? `${preciseCommify(market.dailyLimit, 0)}` : 'No daily limit',
            },
            {
                tooltip: 'The remaining DOLA borrowable today (UTC timezone)',
                title: 'Remaining liquidity',
                value: market.dailyLimit > 0 ? `${preciseCommify(market.leftToBorrow, 0)}` : 'No daily limit',
            },
        ],
        [
            {
                tooltip: 'Incentive regarding forced top-ups on borrowers in DBR deficit',
                title: 'DBR Top-up incentive',
                value: `${shortenNumber(market.replenishmentIncentive * 100, 2)}%`,
            },
            {
                tooltip: 'Maximum amount of DOLA allowed to be borrowed in this market, the Fed Chair can provide liquidity in the market that is less or equal to this limit.',
                title: 'Borrowing ceiling',
                value: `${preciseCommify(market.ceiling, 0)}`,
            },
        ],
        [
            {
                tooltip: 'Liquidation incentive to liquidate shortfalling loans',
                title: 'Liquidation Incentive',
                value: `${shortenNumber(market.liquidationIncentive * 100, 2)}%`,
            },
            {
                tooltip: 'Percentage that can be liquidated in one liquidation',
                title: 'Liquidation factor',
                value: `${shortenNumber(market.liquidationFactor * 100, 2)}%`,
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
                tooltip: 'Approximated DBR swap price for the total required DBR amount (dbr amount for the borrowed dola + dbr amount for that dbr amount)',
                title: 'DBR swap price',
                value: `~${shortenNumber(dbrSwapPrice, 6, true)}`,
                isLoading: debtAmountNumInfo > 0 && isDbrApproxLoading,
            },
            {
                tooltip: "DBR tokens needed for the borrow, they will be automatically used to cover borrowing interests over time. Don't sell them unless you know what you're doing! When auto-buying extra DBRs are added as cost to cover the auto-buyed DBRs.",
                title: 'Auto-buy DBR cost',
                value: dbrCover > 0 && isDeposit ? `~${shortenNumber(dbrCover, 2)} DBRs (${shortenNumber(dbrCoverDebt, 2, true)})` : '-',
                isLoading: debtAmountNumInfo > 0 && isDbrApproxLoading,
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
                value: newTotalDebt > 0 ? getDepletionDate(newDBRExpiryDate, now) : '-',
                color: newTotalDebt > 0 ? getDBRRiskColor(newDBRExpiryDate, now) : undefined
            },
        ],
    ];

    let alternativeBalanceValue = '';
    if (underlyingExRate > 0) {
        alternativeBalanceValue = `${newDeposits ? `Underlying amount: ${shortenNumber(newDeposits * underlyingExRate, 2)} yCrv` : ''}`
    }

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
                value: (!!deposits || !!newDeposits) && newLiquidationPrice > 0 ? `${preciseCommify(newLiquidationPrice, newLiquidationPrice < 10 ? 4 : 2, true)}` : '-',
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
                alternativeValue: alternativeBalanceValue,
                alternativeValueColor: themeStyles.colors.mainTextColorLight2,
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

    const hasCollateralRewards = market.hasStakingLikeRewards && collateralRewards >= 0.01;

    const stakingInfos = !hasCollateralRewards ? [] : [
        {
            tooltip: 'The amount of collateral that comes from your deposits (or leverage) (excludes staking rewards and liquidations) for the current position',
            title: 'Originally Deposited',
            value: _depositedByUser >= 0 ? `${shortenNumber(_depositedByUser, 2)} ${market.underlying.symbol}` : 'All have been withdrawn',
        },
        {
            tooltip: 'The increase in collateral balance since the start of the current position thanks to staking, anti-dilution protection or other mechanism that increases your collateral balance over time. USD value at current price. Amounts from previously closed positions are not included.',
            title: market.isInv ? 'Anti-dilution protection' : 'Earned with staking',
            value: `${preciseCommify(collateralRewards, 2)} ${market.underlying.symbol} (${shortenNumber(collateralRewards * market.price, 2, true)})`,
            color: 'seagreen',
        },
    ];

    const keyInfos = [
        positionInfos[0],
        dbrInfos[3],
        // positionInfos[1],
        positionInfos[2],
        positionInfos[3],
    ];

    if (!market.isInv && isAutoDBR) {
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
                                <Text>You don't have a position in this market yet.</Text>
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
                            !_events?.length && !isLoadingEvents && (!isLoadingEventsFromApi || !lastFirmActionIndexLoaded) ?
                                <InfoMessage alertProps={{ w: 'full' }} description="No event yet" />
                                :
                                <ErrorBoundary description={'Something went wrong getting activity'}>
                                    <FirmAccountEvents events={_events} account={account} overflowY="auto" maxH="300px" />
                                </ErrorBoundary>
                        }
                    </VStack>
                    :
                    <ListInfos listInfos={tabItems} />
        }
    </VStack>
}