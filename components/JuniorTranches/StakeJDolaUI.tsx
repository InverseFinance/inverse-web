import { VStack, Text, HStack, Stack, Image, useInterval, useDisclosure, Link, Divider, RadioGroup, Radio, Box } from "@chakra-ui/react"
import { useWeb3React } from "@web3-react/core";
import { SimpleAmountForm } from "../common/SimpleAmountForm";
import { useEffect, useMemo, useState } from "react";
import { getNetworkConfigConstants } from "@app/util/networks";
import { parseEther } from "@ethersproject/units";
import Container from "../common/Container";
import { NavButtons } from "@app/components/common/Button";
import { RSubmitButton } from "@app/components/common/Button/RSubmitButton";
import { InfoMessage, Message, StatusMessage, SuccessMessage } from "@app/components/common/Messages";
import { formatDurationHumanReadable, getNextThursdayTimestamp, preciseCommify } from "@app/util/misc";
import { useDOLABalance } from "@app/hooks/useDOLA";
import { useDebouncedEffect } from "@app/hooks/useDebouncedEffect";
import { useDBRPrice } from "@app/hooks/useDBR";
import { getBnToNumber, getMonthlyRate, getNumberToBn, shortenNumber, smartShortNumber } from "@app/util/markets";
import { SmallTextLoader } from "../common/Loaders/SmallTextLoader";
import { TextInfo } from "../common/Messages/TextInfo";
import { JDOLA_AUCTION_ADDRESS, JDOLA_AUCTION_HELPER_ADDRESS, JUNIOR_ESCROW_ADDRESS, ONE_DAY_MS, SDOLA_ADDRESS, SECONDS_PER_BLOCK } from "@app/config/constants";
import { useAccount } from "@app/hooks/misc";
import { StakeJDolaInfos } from "./StakeJDolaInfos";
import { useDOLAPrice } from "@app/hooks/usePrices";
import { SkeletonBlob } from "../common/Skeleton";
import { stakeJDola, juniorQueueWithdrawal, cancelWithdrawal, useJDolaStakingEarnings, useJuniorWithdrawDelay, useStakedJDola, juniorCompleteWithdraw } from "@app/util/junior";
import { formatDateWithTime, fromNow } from "@app/util/time";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import { useStakedDola } from "@app/util/dola-staking";

const { DOLA } = getNetworkConfigConstants();

const StatBasic = ({ value, name, message, onClick = undefined, isLoading = false }: { value: string, message: any, onClick?: () => void, name: string, isLoading?: boolean }) => {
    return <VStack>
        {
            !isLoading ? <Text color={'secondary'} fontSize={{ base: '32px', sm: '40px' }} fontWeight="extrabold">{value}</Text>
                : <SmallTextLoader width={'100px'} />
        }
        <TextInfo message={message}>
            <Text cursor={!!onClick ? 'pointer' : undefined} textDecoration={!!onClick ? 'underline' : undefined} onClick={onClick} color={'mainTextColor'} fontSize={{ base: '16px', sm: '20px' }} fontWeight="bold">{name}</Text>
        </TextInfo>
    </VStack>
}

const STAKE_BAL_INC_INTERVAL = 100;
const MS_PER_BLOCK = SECONDS_PER_BLOCK * 1000;

type TimelineMarker = {
    time: number;
    label: string;
    isNow?: boolean;
}

const WithdrawTimeline = ({ markers, title = 'Withdrawal timeline' }: { markers: TimelineMarker[], title?: string }) => {
    const validMarkers = (markers || []).filter(m => !!m.time && !isNaN(m.time));

    if (!validMarkers.length) {
        return null;
    }

    const times = validMarkers.sort((a, b) => a.time - b.time).map(m => m.time);
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const span = maxTime - minTime || 1;

    const padding = 15;
    const timelineHeight = 150;
    const availableHeight = timelineHeight - (padding * 2);

    return <VStack alignItems="flex-start" w='full' spacing="1" mt="2">
        <Text fontSize="14px" color="secondaryTextColor">{title}</Text>
        <Box position="relative" w="full" h={`${timelineHeight}px`} pl="4" py={`${padding}px`}>
            <Box position="absolute" top={`${padding}px`} bottom={`${padding}px`} left="5px" w="2px" bg="secondaryTextColor" opacity={0.3} transform="translateX(-50%)" />
            {
                validMarkers.map((m, i) => {
                    const timePerc = ((m.time - minTime) / span);
                    const calc = padding + (timePerc * availableHeight);
                    // const isInTheMiddle = i !== 0 && i !== validMarkers.length - 1;
                    // const topPx = i === 1 ? Math.min(60, calc) : i === validMarkers.length - 2 ? Math.min(calc, timelineHeight - 40) : calc;
                    const topPx = i === 1 ? Math.max(60, calc) : calc;
                    // const topPx = calc
                    return <HStack
                        key={m.label}
                        position="absolute"
                        top={`${topPx}px`}
                        transform="translateY(-50%)"
                        spacing="2"
                        alignItems="center"
                        left="0"
                    >
                        <Box
                            w={m.isNow ? "10px" : "8px"}
                            h={m.isNow ? "10px" : "8px"}
                            borderRadius="full"
                            bg={m.isNow ? "accentTextColor" : "mainTextColor"}
                            border={m.isNow ? "2px solid" : undefined}
                            borderColor={m.isNow ? "accentTextColor" : undefined}
                            position="relative"
                            zIndex={1}
                            left="5px"
                            transform="translateX(-50%)"
                        />
                        <Text
                            fontSize="12px"
                            textAlign="left"
                            whiteSpace="pre-line"
                            overflow="hidden"
                            textOverflow="ellipsis"
                            display="-webkit-box"
                            style={{
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                lineHeight: '1.2em',
                                maxHeight: '2.4em'
                            }}
                            maxW="200px"
                            ml="2"
                        >
                            {m.label}
                        </Text>
                    </HStack>
                })
            }
        </Box>
    </VStack>
}

export const StakeJDolaUI = ({ isLoadingStables, useDolaAsMain, topStable }) => {
    const account = useAccount();
    const { provider, account: connectedAccount } = useWeb3React();
    const [useDolaAsMainChoice, setUseDolaAsMainChoice] = useState(false);

    const [depositTokenSymbol, setDepositTokenSymbol] = useState('DOLA');
    const [depositTokenAddress, setDepositTokenAddress] = useState(DOLA);
    const [inputAmount, setInputAmount] = useState('');
    const [isConnected, setIsConnected] = useState(true);
    const [isPreventLoader, setIsPreventLoader] = useState(false);
    const [nowWithInterval, setNowWithInterval] = useState(Date.now());
    const [wantsNewWithdrawal, setWantsNewWithdrawal] = useState(false);
    const [tab, setTab] = useState('Stake');
    const isStake = tab === 'Stake';

    const isDepositingViaDola = useMemo(() => depositTokenSymbol === 'DOLA', [depositTokenSymbol]);

    const { priceUsd: dbrPrice } = useDBRPrice();

    const { apy: sDolaApy, projectedApy: sDolaProjectedApy, sDolaExRate } = useStakedDola(dbrPrice);
    const { apy, apy30d, projectedApy, isLoading, jrDolaExRate, jrDolaTotalAssets, jrDolaSupply, weeklyRevenue, exitWindow, withdrawFeePerc, isLoading: isLoadingStakedDola } = useStakedJDola(dbrPrice, !inputAmount || isNaN(parseFloat(inputAmount)) ? 0 : isStake ? parseFloat(inputAmount) / (isDepositingViaDola ? (sDolaExRate || 1) : 1) : -parseFloat(inputAmount) / (isDepositingViaDola ? (sDolaExRate || 1) : 1), true);

    const totalJrDolaApy = apy + sDolaApy;
    const totalProjectedApy = projectedApy + sDolaProjectedApy;

    // value in jrDOLA terms
    const { stakedDolaBalance: jrDolaBalance, stakedDolaBalanceBn: jrDolaBalanceBn } = useJDolaStakingEarnings(account);

    const [previousJrDolaBalance, setPrevJrDolaBalance] = useState(jrDolaBalance);
    const [baseBalance, setBaseBalance] = useState(0);
    const [realTimeBalance, setRealTimeBalance] = useState(0);
    // value in DOLA terms
    const { withdrawDelay, withdrawDelayMax, withdrawTimestamp, withdrawTimestampMax, exitWindowStart, exitWindowEnd, pendingAmount, hasComingExit, isWithinExitWindow, hasExpiredWithdrawal, witdhrawDelayRenew, canCancel } = useJuniorWithdrawDelay(jrDolaSupply, parseFloat(inputAmount || '0') / (sDolaExRate || 1) / (jrDolaExRate || 1), account, jrDolaBalanceBn);

    const queueEndTs = inputAmount ? withdrawTimestamp : withdrawTimestampMax;

    let queueTimelineMarkers: TimelineMarker[] | null = null;
    if (queueEndTs && exitWindow) {
        const queueEnd = queueEndTs;
        const exitEnd = queueEnd + exitWindow * 1000;
        queueTimelineMarkers = [
            {
                time: nowWithInterval,
                label: `Now\n${formatDateWithTime(nowWithInterval)}`,
                isNow: true,
            },
            {
                time: queueEnd,
                label: `Queue ends & Exit window starts\n${formatDateWithTime(queueEnd)}`,
            },
            {
                time: exitEnd,
                label: `Exit window ends\n${formatDateWithTime(exitEnd)}`,
            },
        ];
    }

    let pendingTimelineMarkers: TimelineMarker[] | null = null;
    if (hasComingExit && exitWindowStart && exitWindowEnd) {
        pendingTimelineMarkers = [
            {
                time: exitWindowStart,
                label: `Exit window starts\n${formatDateWithTime(exitWindowStart)}`,
            },
            {
                time: exitWindowEnd,
                label: `Exit window ends\n${formatDateWithTime(exitWindowEnd)}`,
            },
            {
                time: nowWithInterval,
                label: `Now\n${formatDateWithTime(nowWithInterval)}`,
                isNow: true,
            },
        ];
    }

    // staked balances in sDOLA & DOLA terms
    const sdolaStakedInVault = jrDolaExRate * jrDolaBalance;
    const dolaStakedInVault = sdolaStakedInVault * sDolaExRate;

    // withdrawal pending amounts in sDOLA & DOLA terms
    const pendingAmountInSDola = jrDolaExRate * pendingAmount;
    const pendingAmountInDola = pendingAmountInSDola * sDolaExRate;

    const nextThursdayTsString = useMemo(() => {
        return new Date(getNextThursdayTimestamp()).toLocaleDateString('en-US', { month: 'long', year: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' });
    }, [nowWithInterval]);

    useEffect(() => {
        if (isDepositingViaDola) {
            setDepositTokenAddress(DOLA);
        } else {
            setDepositTokenAddress(SDOLA_ADDRESS);
        }
    }, [isDepositingViaDola]);

    useInterval(() => {
        setNowWithInterval(Date.now());
    }, 1000);

    useInterval(() => {
        const curr = (realTimeBalance || baseBalance);
        const incPerInterval = ((curr * (apy / 100)) * (STAKE_BAL_INC_INTERVAL / (ONE_DAY_MS * 365)));
        const neo = curr + incPerInterval;
        setRealTimeBalance(neo);
    }, STAKE_BAL_INC_INTERVAL);

    // every ~12s recheck base balance
    useInterval(() => {
        if (realTimeBalance > sdolaStakedInVault) return;
        setRealTimeBalance(sdolaStakedInVault);
        setBaseBalance(sdolaStakedInVault);
    }, MS_PER_BLOCK);

    useEffect(() => {
        if (previousJrDolaBalance === jrDolaBalance) return;
        setBaseBalance(sdolaStakedInVault);
        setRealTimeBalance(sdolaStakedInVault);
        setPrevJrDolaBalance(jrDolaBalance);
    }, [jrDolaBalance, previousJrDolaBalance, sdolaStakedInVault]);

    useEffect(() => {
        if (!!baseBalance || !dolaStakedInVault) return;
        setBaseBalance(sdolaStakedInVault);
    }, [baseBalance, sdolaStakedInVault]);

    useDebouncedEffect(() => {
        setIsConnected(!!connectedAccount);
    }, [connectedAccount], 500);

    const monthlyDolaRewards = useMemo(() => {
        return (totalJrDolaApy > 0 && dolaStakedInVault > 0 ? getMonthlyRate(dolaStakedInVault, totalJrDolaApy) : 0);
    }, [dolaStakedInVault, totalJrDolaApy]);

    const handleQueue = async () => {
        if (!sDolaExRate || !jrDolaExRate) return;
        return juniorQueueWithdrawal(provider?.getSigner(), parseEther((parseFloat(inputAmount) / sDolaExRate / jrDolaExRate).toFixed(6)), withdrawDelay.toString());
    }

    const handleRenew = async () => {
        if (!sDolaExRate || !jrDolaExRate) return;
        return juniorQueueWithdrawal(provider?.getSigner(), '0', witdhrawDelayRenew.toString());
    }

    const handleStake = () => {
        // only required if deposit via DOLA case, 0.1% slippage protection
        const minJrDolaShares = getNumberToBn(getBnToNumber(parseEther(inputAmount)) / (sDolaExRate || 1) / (jrDolaExRate || 1) * 0.999);
        return stakeJDola(provider?.getSigner(), parseEther(inputAmount), isDepositingViaDola, minJrDolaShares);
    }

    const unstakeAll = async () => {
        return juniorQueueWithdrawal(provider?.getSigner(), jrDolaBalanceBn, withdrawDelayMax.toString());
    }

    const handleComplete = () => {
        return juniorCompleteWithdraw(provider?.getSigner());
    }

    const handleCancel = () => {
        return cancelWithdrawal(provider?.getSigner());
    }

    const resetRealTime = () => {
        setTimeout(() => {
            setBaseBalance(sdolaStakedInVault);
            setRealTimeBalance(sdolaStakedInVault);
        }, 250);
    }

    return <VStack w='full' spacing="8">
        <InfoMessage description={
            <VStack alignItems="flex-start">
                <Text fontWeight="bold">Junior DOLA - First-Loss Insurance for DOLA</Text>
                <Text>jrDOLA is a liquid yield-bearing token where stakers earn yield coming from DBR auctions on top of the yield coming from sDOLA, meaning the <b>yield is always equal or higher than sDOLA</b> but in case bad debt occurs in an allowed FiRM market the deposits in jrDOLA may be slashed proportionnally among depositors to repay the bad debt.</Text>
                <Text><b>Important note</b>: to exit jrDOLA and get back sDOLA a staker must queue a withdrawal, wait for the dynamic withdrawal delay and then complete the withdrawal within an exit window, if the exit window expired before completing the withdrawal then a new withdrawal must be queued, otherwise depending on liquidity the instant alternative is to swap at market price.</Text>
                <Link textDecoration="underline" href="https://docs.inverse.finance/inverse-finance/inverse-finance/product-guide/tokens/jrdola" isExternal target="_blank">Learn more about jrDOLA and the risks <ExternalLinkIcon /> </Link>
            </VStack>
        } alertProps={{ w: 'full' }} />
        <Stack direction={{ base: 'column', lg: 'row' }} alignItems={{ base: 'center', lg: 'flex-start' }} justify="space-around" w='full' spacing="12">
            <VStack w='full' maxW='450px' spacing='4'>
                {/* <HStack justify="space-around" w='full'>
                    <VStack>
                        <Image src="/assets/sDOLAx512.png" h="120px" w="120px" />
                        <Text fontSize="20px" fontWeight="bold">jrDOLA</Text>
                    </VStack>
                </HStack> */}
                <HStack justify="space-between" w='full'>
                    <StatBasic message="This week's APY is calculated with last week's DBR auction revenues plus sDOLA's apy and assuming a weekly auto-compounding" isLoading={isLoading} name="Current APY" value={totalJrDolaApy ? `${shortenNumber(totalJrDolaApy, 2)}%` : '-'} />
                    <StatBasic message={"The projected APY is a theoretical estimation of where the APY should tend to go. It's calculated by considering current's week auction revenue and a forecast that considers the DBR incentives, where the forecast portion has a weight of more than 50%"} isLoading={isLoading} name="Projected APY" value={totalProjectedApy ? `${shortenNumber(totalProjectedApy, 2)}%` : '-'} />
                </HStack>
                <SuccessMessage
                    showIcon={false}
                    alertProps={{ w: 'full' }}
                    description={
                        <VStack alignItems="flex-start">
                            <Stack direction={{ base: 'column', lg: 'row' }} w='full' justify="space-between">
                                <Text>- sDOLA's APY for reference:</Text>
                                <Text><b>{sDolaApy ? `${shortenNumber(sDolaApy, 2)}%` : '-'}</b></Text>
                            </Stack>
                            {
                                monthlyDolaRewards > 0 && <Stack direction={{ base: 'column', lg: 'row' }} w='full' justify="space-between">
                                    <Text>- Your rewards: </Text>
                                    <Text><b>~{preciseCommify(monthlyDolaRewards, 2)} DOLA per month</b></Text>
                                </Stack>
                            }
                            {/* <Stack direction={{ base: 'column', lg: 'row' }} w='full' justify="space-between">
                                <Text>- 30-day average APY:</Text>
                                <Text><b>{apy30d ? `${shortenNumber(apy30d, 2)}%` : '-'}</b></Text>
                            </Stack> */}
                            <Stack direction={{ base: 'column', lg: 'row' }} w='full' justify="space-between">
                                <Text>- Total staked by all users:</Text>
                                <Text><b>{jrDolaTotalAssets ? `${shortenNumber(jrDolaTotalAssets * sDolaExRate, 2)} DOLA` : '-'}</b></Text>
                            </Stack>
                            <Stack direction={{ base: 'column', lg: 'row' }} w='full' justify="space-between">
                                <Text>The projected APY will become the current APY on {nextThursdayTsString}</Text>
                            </Stack>
                        </VStack>
                    }
                />
            </VStack>
            <Container
                label="jrDOLA - Yield-Bearing liquid vault"
                description="See contract"
                href={`https://etherscan.io/address/${JDOLA_AUCTION_ADDRESS}`}
                noPadding
                m="0"
                p="0"
                maxW='450px'
            >
                <VStack spacing="2" alignItems="flex-start" w='full'>
                    {
                        !isConnected ? <InfoMessage alertProps={{ w: 'full' }} description="Please connect your wallet" />
                            :
                            <>
                                <NavButtons active={tab} options={['Stake', 'Unstake', 'Infos']} onClick={(v) => setTab(v)} />
                                {
                                    tab !== 'Infos' && <VStack alignItems="flex-start" w='full' justify="space-between">
                                        {
                                            isStake && <HStack w='full' justify="space-between">
                                                <Text fontSize="20px" fontWeight="bold">Deposit from:</Text>
                                                <RadioGroup onChange={(v) => setDepositTokenSymbol(v)} value={depositTokenSymbol}>
                                                    <HStack className="gap-2">
                                                        <Radio value="DOLA">DOLA</Radio>
                                                        <Radio value="sDOLA">sDOLA</Radio>
                                                    </HStack>
                                                </RadioGroup>
                                            </HStack>
                                        }
                                        {/* <Text>
                                            DOLA balance in wallet: <b>{dolaBalance ? preciseCommify(dolaBalance, 2) : '-'}</b>
                                        </Text> */}
                                        {
                                            !isStake && <Text color="secondaryTextColor">
                                                Your staked sDOLA: <b>{dolaStakedInVault ? `${preciseCommify(realTimeBalance, 8)} (${shortenNumber(sDolaExRate * realTimeBalance, 2)} DOLA)` : '-'}</b>
                                            </Text>
                                        }
                                    </VStack>
                                }
                                {
                                    tab === 'Infos' ? <StakeJDolaInfos sDolaExRate={sDolaExRate} /> : isStake ?
                                        (isLoadingStables && !isPreventLoader ? <SkeletonBlob /> :
                                            <>
                                                <SimpleAmountForm
                                                    btnProps={{ needPoaFirst: true }}
                                                    defaultAmount={inputAmount}
                                                    address={depositTokenAddress}
                                                    destination={isDepositingViaDola ? JDOLA_AUCTION_HELPER_ADDRESS : JDOLA_AUCTION_ADDRESS}
                                                    needApprove={true}
                                                    approveForceRefresh={true}
                                                    signer={provider?.getSigner()}
                                                    decimals={18}
                                                    onAction={() => handleStake()}
                                                    actionLabel={`Stake`}
                                                    onAmountChange={(v) => setInputAmount(v)}
                                                    showMax={true}
                                                    showMaxBtn={false}
                                                    hideInputIfNoAllowance={false}
                                                    showBalance={true}
                                                    onSuccess={() => resetRealTime()}
                                                />
                                                <InfoMessage
                                                    description={
                                                        <VStack alignItems="flex-start">
                                                            <Text><b>Note</b>: you can stake into jrDOLA from DOLA or sDOLA but unstaking always gives sDOLA.</Text>
                                                            <Text><b>Reminder</b>: staking is intant but unstaking is not and may take several days depending on amount and supply.</Text>
                                                        </VStack>
                                                    }
                                                />
                                            </>
                                        )
                                        :
                                        <VStack w='full' alignItems="flex-start">
                                            <Text fontSize="20px" fontWeight="bold">
                                                1) Queue a withdrawal (in DOLA terms):
                                            </Text>
                                            {
                                                hasComingExit && <InfoMessage
                                                    alertProps={{ w: 'full' }}
                                                    description={
                                                        <VStack alignItems="flex-start" w='full'>
                                                            <Text><b>Note</b>: you already have a pending withdrawal, queuing a new withdrawal will merge both with the new queue duration being the longest of the two.</Text>
                                                            <RSubmitButton onClick={() => setWantsNewWithdrawal(!wantsNewWithdrawal)}>
                                                                {wantsNewWithdrawal ? 'Hide' : 'Queue a new withdrawal'}
                                                            </RSubmitButton>
                                                        </VStack>
                                                    }
                                                />
                                            }
                                            {
                                                ((!hasComingExit) || (hasComingExit && wantsNewWithdrawal)) && <>
                                                    <SimpleAmountForm
                                                        btnProps={{ needPoaFirst: true }}
                                                        defaultAmount={inputAmount}
                                                        address={JDOLA_AUCTION_ADDRESS}
                                                        destination={JUNIOR_ESCROW_ADDRESS}
                                                        needApprove={true}
                                                        signer={provider?.getSigner()}
                                                        decimals={18}
                                                        onAction={() => handleQueue()}
                                                        onMaxAction={() => unstakeAll()}
                                                        maxActionLabel={`Initiate full withdrawal`}
                                                        actionLabel={`Initiate withdrawal`}
                                                        onAmountChange={(v) => setInputAmount(v)}
                                                        maxAmountFrom={[getNumberToBn(dolaStakedInVault, 18)]}
                                                        showMaxBtn={jrDolaBalance > 0}
                                                        showMax={true}
                                                        hideInputIfNoAllowance={false}
                                                        showBalance={false}
                                                        onSuccess={() => resetRealTime()}
                                                    />

                                                    <VStack alignItems="flex-start" spacing="0">
                                                        <Text>
                                                            - Queue duration for {withdrawTimestamp && inputAmount ? 'chosen amount' : 'max amount'} & the current supply:
                                                        </Text>
                                                        <Text fontWeight="bold">
                                                            <b>{inputAmount && !!withdrawTimestamp ? formatDurationHumanReadable((withdrawTimestamp - nowWithInterval) / 1000) : withdrawTimestampMax ? formatDurationHumanReadable((withdrawTimestampMax - nowWithInterval) / 1000) : '-'}</b>
                                                        </Text>
                                                    </VStack>
                                                    <VStack alignItems="flex-start" spacing="0">
                                                        <Text>
                                                            - Exit window after queue duration ends:
                                                        </Text>
                                                        <Text fontWeight="bold">
                                                            <b>{exitWindow ? `${smartShortNumber(exitWindow / 86400, 2)} days` : '-'}</b>
                                                        </Text>
                                                        <Text>- Withdraw fee: {withdrawFeePerc ? `${shortenNumber(withdrawFeePerc, 2)}%` : '-'}</Text>
                                                        {
                                                            withdrawFeePerc > 0 && <Text>- Post-fee withdrawal in DOLA terms: {inputAmount && !!parseFloat(inputAmount) ? `${shortenNumber(parseFloat(inputAmount) - parseFloat(inputAmount) * withdrawFeePerc / 100, 2)}` : '-'}</Text>
                                                        }
                                                    </VStack>
                                                    {
                                                        queueTimelineMarkers && <WithdrawTimeline markers={queueTimelineMarkers} />
                                                    }
                                                </>
                                            }
                                            <Divider />
                                            <Text fontSize="20px" fontWeight="bold">
                                                2) Complete a withdrawal:
                                            </Text>
                                            {
                                                hasComingExit ? isWithinExitWindow ? <Text>You have a withdrawal of <b>{shortenNumber(pendingAmountInSDola, 2)} sDOLA ({shortenNumber(pendingAmountInDola, 2)} DOLA)</b> to complete!</Text> : <Text><b>{shortenNumber(pendingAmountInSDola, 2)} sDOLA ({shortenNumber(pendingAmountInDola, 2)} DOLA)</b> in queue phase</Text> : <Text>You don't have any pending withdrawal</Text>
                                            }
                                            {
                                                hasExpiredWithdrawal && <InfoMessage
                                                    alertProps={{ w: 'full' }}
                                                    description={
                                                        <VStack alignItems="flex-start" spacing="0">
                                                            <Text>You have an expired withdrawal of <b>{shortenNumber(pendingAmountInSDola, 2)} sDOLA ({shortenNumber(pendingAmountInDola, 2)} DOLA)</b></Text>
                                                            <RSubmitButton mt="2" onClick={handleRenew}>
                                                                Renew the withdrawal
                                                            </RSubmitButton>
                                                        </VStack>
                                                    }
                                                />
                                            }
                                            {
                                                hasComingExit && isWithinExitWindow && <StatusMessage
                                                    status={'warning'}
                                                    alertProps={{ w: 'full' }}
                                                    description={
                                                        <VStack alignItems="flex-start" spacing="0">
                                                            <Text>- You have until <b>{formatDateWithTime(exitWindowEnd)}</b> to complete the withdrawal.</Text>
                                                            <Text>- Time left: <b>{formatDurationHumanReadable((exitWindowEnd - nowWithInterval) / 1000)}</b></Text>
                                                            <Text>- The withdrawal will be cancelled otherwise.</Text>
                                                            <RSubmitButton mt="2" onClick={handleComplete}>
                                                                Complete Withdrawal
                                                            </RSubmitButton>
                                                        </VStack>
                                                    }
                                                />
                                            }
                                            {
                                                hasComingExit && pendingTimelineMarkers && <WithdrawTimeline markers={pendingTimelineMarkers} />
                                            }
                                            {
                                                hasComingExit && <>
                                                    <Divider />
                                                    <VStack alignItems="flex-start" w='full' spacing="2">
                                                        <Text fontSize="20px" fontWeight="bold">
                                                            Or cancel withdrawal
                                                        </Text>
                                                        <InfoMessage description="Cancelling sends you back the previously queued up jrDOLA" />
                                                        <RSubmitButton isDisabled={!canCancel} themeColor="warning" onClick={handleCancel}>Cancel withdrawal</RSubmitButton>
                                                        {
                                                            !canCancel && <Text>Note: Cancelling is only possible after the start of the exit window</Text>
                                                        }
                                                    </VStack>
                                                </>
                                            }
                                            <Text fontSize="20px" fontWeight="bold">
                                                Alternative:
                                            </Text>
                                            <Link href="https://swap.defillama.com/?chain=ethereum&from=0x633821B8e003344e5223509277F2084EA809A452&tab=swap&to=0x865377367054516e17014ccded1e7d814edc9ce4" isExternal target="_blank" textDecoration="underline">
                                                Swap jrDOLA <ExternalLinkIcon />
                                            </Link>
                                        </VStack>
                                }
                            </>
                    }
                </VStack>
            </Container>
        </Stack>
    </VStack>
}