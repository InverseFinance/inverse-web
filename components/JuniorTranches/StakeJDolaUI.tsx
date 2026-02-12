import { VStack, Text, HStack, Stack, Image, useInterval, useDisclosure, Link, Divider, RadioGroup, Radio } from "@chakra-ui/react"
import { useWeb3React } from "@web3-react/core";
import { SimpleAmountForm } from "../common/SimpleAmountForm";
import { useEffect, useMemo, useState } from "react";
import { getNetworkConfigConstants } from "@app/util/networks";
import { parseEther } from "@ethersproject/units";
import Container from "../common/Container";
import { NavButtons } from "@app/components/common/Button";
import { RSubmitButton } from "@app/components/common/Button/RSubmitButton";
import { InfoMessage, Message, StatusMessage, SuccessMessage } from "@app/components/common/Messages";
import { getNextThursdayTimestamp, preciseCommify } from "@app/util/misc";
import { useDOLABalance } from "@app/hooks/useDOLA";
import { useDebouncedEffect } from "@app/hooks/useDebouncedEffect";
import { useDBRPrice } from "@app/hooks/useDBR";
import { getMonthlyRate, getNumberToBn, shortenNumber } from "@app/util/markets";
import { SmallTextLoader } from "../common/Loaders/SmallTextLoader";
import { TextInfo } from "../common/Messages/TextInfo";
import { JDOLA_AUCTION_ADDRESS, JUNIOR_ESCROW_ADDRESS, ONE_DAY_MS, SDOLA_ADDRESS, SECONDS_PER_BLOCK } from "@app/config/constants";
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

export const StakeJDolaUI = ({ isLoadingStables, useDolaAsMain, topStable }) => {
    const account = useAccount();
    const { provider, account: connectedAccount } = useWeb3React();
    const [useDolaAsMainChoice, setUseDolaAsMainChoice] = useState(false);

    const [depositTokenSymbol, setDepositTokenSymbol] = useState('DOLA');
    const [depositTokenAddress, setDepositTokenAddress] = useState(DOLA);
    const [dolaAmount, setDolaAmount] = useState('');
    const [isConnected, setIsConnected] = useState(true);
    const [isPreventLoader, setIsPreventLoader] = useState(false);
    const [nowWithInterval, setNowWithInterval] = useState(Date.now());
    const [tab, setTab] = useState('Stake');
    const isStake = tab === 'Stake';

    const { priceUsd: dbrPrice } = useDBRPrice();

    const { apy, apy30d, projectedApy, isLoading, jDolaExRate, jDolaTotalAssets, jDolaSupply, weeklyRevenue, exitWindow, withdrawFee, isLoading: isLoadingStakedDola } = useStakedJDola(dbrPrice, !dolaAmount || isNaN(parseFloat(dolaAmount)) ? 0 : isStake ? parseFloat(dolaAmount) : -parseFloat(dolaAmount), true);
    const { apy: sDolaApy, sDolaExRate } = useStakedDola(dbrPrice, !dolaAmount || isNaN(parseFloat(dolaAmount)) ? 0 : isStake ? parseFloat(dolaAmount) : -parseFloat(dolaAmount), true);

    // value in jrDOLA terms
    const { stakedDolaBalance, stakedDolaBalanceBn } = useJDolaStakingEarnings(account);

    const [previousStakedDolaBalance, setPrevStakedDolaBalance] = useState(stakedDolaBalance);
    const [baseBalance, setBaseBalance] = useState(0);
    const [realTimeBalance, setRealTimeBalance] = useState(0);
    // value in DOLA terms
    const { withdrawDelay, withdrawDelayMax, withdrawTimestamp, withdrawTimestampMax, exitWindowStart, exitWindowEnd, pendingAmount, hasComingExit, isWithinExitWindow, canCancel } = useJuniorWithdrawDelay(jDolaSupply, parseFloat(dolaAmount || '0') / (jDolaExRate || 1), account, stakedDolaBalanceBn);

    const dolaStakedInVault = jDolaExRate * stakedDolaBalance;
    const pendingAmountInDola = jDolaExRate * pendingAmount;

    const nextThursdayTsString = useMemo(() => {
        return new Date(getNextThursdayTimestamp()).toLocaleDateString('en-US', { month: 'long', year: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' });
    }, [nowWithInterval]);

    useEffect(() => {
        if (depositTokenSymbol === 'DOLA') {
            setDepositTokenAddress(DOLA);
        } else {
            setDepositTokenAddress(SDOLA_ADDRESS);
        }
    }, [depositTokenSymbol]);

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
        if (realTimeBalance > dolaStakedInVault) return;
        setRealTimeBalance(dolaStakedInVault);
        setBaseBalance(dolaStakedInVault);
    }, MS_PER_BLOCK);

    useEffect(() => {
        if (previousStakedDolaBalance === stakedDolaBalance) return;
        setBaseBalance(dolaStakedInVault);
        setRealTimeBalance(dolaStakedInVault);
        setPrevStakedDolaBalance(stakedDolaBalance);
    }, [stakedDolaBalance, previousStakedDolaBalance, dolaStakedInVault]);

    useEffect(() => {
        if (!!baseBalance || !dolaStakedInVault) return;
        setBaseBalance(dolaStakedInVault);
    }, [baseBalance, dolaStakedInVault]);

    useDebouncedEffect(() => {
        setIsConnected(!!connectedAccount);
    }, [connectedAccount], 500);

    const monthlyDolaRewards = useMemo(() => {
        return (apy > 0 && dolaStakedInVault > 0 ? getMonthlyRate(dolaStakedInVault, apy) : 0);
    }, [dolaStakedInVault, apy]);

    const handleQueue = async () => {
        return juniorQueueWithdrawal(provider?.getSigner(), parseEther((parseFloat(dolaAmount) / jDolaExRate).toFixed(6)), withdrawDelay.toString());
    }

    const handleStake = () => {
        return stakeJDola(provider?.getSigner(), parseEther(dolaAmount), depositTokenSymbol === 'DOLA');
    }

    const unstakeAll = async () => {
        return juniorQueueWithdrawal(provider?.getSigner(), stakedDolaBalanceBn, withdrawDelayMax.toString());
    }

    const handleComplete = () => {
        return juniorCompleteWithdraw(provider?.getSigner());
    }

    const handleCancel = () => {
        return cancelWithdrawal(provider?.getSigner());
    }

    const resetRealTime = () => {
        setTimeout(() => {
            setBaseBalance(dolaStakedInVault);
            setRealTimeBalance(dolaStakedInVault);
        }, 250);
    }

    return <VStack w='full' spacing="8">
        <InfoMessage description={
            <VStack alignItems="flex-start">
                <Text fontWeight="bold">Junior DOLA - First-Loss Insurance for DOLA</Text>
                <Text>jrDOLA is a liquid yield-bearing token where stakers earn yield coming from DBR auctions on top of the yield coming from sDOLA, meaning the <b>yield is always equal or higher than sDOLA</b> but in case bad debt occurs in an allowed FiRM market the deposits in jrDOLA may be slashed proportionnally among depositors to repay the bad debt.</Text>
                <Text><b>Important note</b>: to exit jrDOLA and get back sDOLA a staker must queue a withdrawal, wait for the dynamic withdrawal delay and then complete the withdrawal within an exit window, if the exit window expired before completing the withdrawal then a new withdrawal must be queued.</Text>
                <Link textDecoration="underline" href="https://docs.inverse.finance/inverse-finance/inverse-finance/product-guide/tokens/jrdola" isExternal target="_blank">Learn more about jrDOLA and the risks <ExternalLinkIcon /> </Link>
            </VStack>
        } alertProps={{ w: 'full' }} />
        <Stack direction={{ base: 'column', lg: 'row' }} alignItems={{ base: 'center', lg: 'flex-start' }} justify="space-around" w='full' spacing="12">
            <VStack w='full' maxW='450px' spacing='4' pt='10'>
                <HStack justify="space-around" w='full'>
                    <VStack>
                        <Image src="/assets/sDOLAx512.png" h="120px" w="120px" />
                        <Text fontSize="20px" fontWeight="bold">jrDOLA</Text>
                    </VStack>
                </HStack>
                <HStack justify="space-between" w='full'>
                    <StatBasic message="This week's APY is calculated with last week's DBR auction revenues and assuming a weekly auto-compounding" isLoading={isLoading} name="Current APY" value={apy ? `${shortenNumber(apy, 2)}%` : '-'} />
                    <StatBasic message={"The projected APY is a theoretical estimation of where the APY should tend to go. It's calculated by considering current's week auction revenue and a forecast that considers the DBR incentives, where the forecast portion has a weight of more than 50%"} isLoading={isLoading} name="Projected APY" value={projectedApy ? `${shortenNumber(projectedApy, 2)}%` : '-'} />
                </HStack>
                <SuccessMessage
                    showIcon={false}
                    alertProps={{ w: 'full' }}
                    description={
                        <VStack alignItems="flex-start">
                            {
                                monthlyDolaRewards > 0 && <Stack direction={{ base: 'column', lg: 'row' }} w='full' justify="space-between">
                                    <Text>- Your rewards: </Text>
                                    <Text><b>~{preciseCommify(monthlyDolaRewards, 2)} DOLA per month</b></Text>
                                </Stack>
                            }
                            <Stack direction={{ base: 'column', lg: 'row' }} w='full' justify="space-between">
                                <Text>- 30-day average APY:</Text>
                                <Text><b>{apy30d ? `${shortenNumber(apy30d, 2)}%` : '-'}</b></Text>
                            </Stack>
                            <Stack direction={{ base: 'column', lg: 'row' }} w='full' justify="space-between">
                                <Text>- Total staked by all users:</Text>
                                <Text><b>{jDolaTotalAssets ? `${shortenNumber(jDolaTotalAssets, 2)} DOLA` : '-'}</b></Text>
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
                                                <Text fontSize="22px" fontWeight="bold">Deposit from:</Text>
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
                                            !isStake && <Text>
                                                Your staked sDOLA: <b>{dolaStakedInVault ? `${preciseCommify(realTimeBalance, 8)} (${shortenNumber(sDolaExRate * realTimeBalance, 2)} DOLA)` : '-'}</b>
                                            </Text>
                                        }
                                    </VStack>
                                }
                                {
                                    tab === 'Infos' ? <StakeJDolaInfos sDolaExRate={sDolaExRate} /> : isStake ?
                                        (isLoadingStables && !isPreventLoader ? <SkeletonBlob /> :
                                            <>
                                                {/* <Text fontSize="22px" fontWeight="bold">
                                                    {depositTokenSymbol} amount to stake:
                                                </Text> */}
                                                <SimpleAmountForm
                                                    btnProps={{ needPoaFirst: true }}
                                                    defaultAmount={dolaAmount}
                                                    address={depositTokenAddress}
                                                    destination={JDOLA_AUCTION_ADDRESS}
                                                    needApprove={true}
                                                    approveForceRefresh={true}
                                                    signer={provider?.getSigner()}
                                                    decimals={18}
                                                    onAction={() => handleStake()}
                                                    actionLabel={`Stake`}
                                                    onAmountChange={(v) => setDolaAmount(v)}
                                                    showMaxBtn={false}
                                                    showMax={true}
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
                                            // <EnsoZap
                                            //     defaultTokenIn={topStable?.token?.address}
                                            //     defaultTokenOut={JDOLA_AUCTION_ADDRESS}
                                            //     defaultTargetChainId={'1'}
                                            //     ensoPools={[{ poolAddress: JDOLA_AUCTION_ADDRESS, chainId: 1 }]}
                                            //     introMessage={''}
                                            //     isSingleChoice={true}
                                            //     targetAssetPrice={dolaPrice * jDolaExRate}
                                            //     exRate={jDolaExRate}
                                            //     isInModal={false}
                                            //     keepAmountOnAssetChange={true}
                                            //     fromText={"Stake from"}
                                            //     fromTextProps={{
                                            //         fontSize: '22px',
                                            //         fontWeight: 'bold'
                                            //     }}
                                            //     onAmountChange={(v) => {
                                            //         if(!!v){
                                            //             setIsPreventLoader(true);
                                            //         }
                                            //     }}
                                            // />
                                        )
                                        :
                                        <VStack w='full' alignItems="flex-start">
                                            <Text fontSize="22px" fontWeight="bold">
                                                1) Queue a withdrawal:
                                            </Text>
                                            <SimpleAmountForm
                                                btnProps={{ needPoaFirst: true }}
                                                defaultAmount={dolaAmount}
                                                address={JDOLA_AUCTION_ADDRESS}
                                                destination={JUNIOR_ESCROW_ADDRESS}
                                                needApprove={true}
                                                signer={provider?.getSigner()}
                                                decimals={18}
                                                onAction={() => handleQueue()}
                                                onMaxAction={() => unstakeAll()}
                                                maxActionLabel={`Initiate full withdrawal`}
                                                actionLabel={`Initiate withdrawal`}
                                                onAmountChange={(v) => setDolaAmount(v)}
                                                maxAmountFrom={[getNumberToBn(dolaStakedInVault, 18)]}
                                                showMaxBtn={stakedDolaBalance > 0}
                                                showMax={false}
                                                hideInputIfNoAllowance={false}
                                                showBalance={false}
                                                onSuccess={() => resetRealTime()}
                                            />
                                            {
                                                hasComingExit && <InfoMessage
                                                    alertProps={{ w: 'full' }}
                                                    description="Note: you already have a pending withdrawal, queuing a new withdrawal will merge both with the new queue duration being the longest of the two."
                                                />
                                            }
                                            <VStack alignItems="flex-start" spacing="0">
                                                <Text>
                                                    - Queue duration for {withdrawTimestamp && dolaAmount ? 'chosen amount' : 'max amount'} & the current supply:
                                                </Text>
                                                <Text fontWeight="bold">
                                                    <b>{dolaAmount ? fromNow(withdrawTimestamp, true) : withdrawTimestampMax ? fromNow(withdrawTimestampMax, true) : '-'}</b>
                                                </Text>
                                            </VStack>
                                            <VStack alignItems="flex-start" spacing="0">
                                                <Text>
                                                    - Exit window after queue duration ends:
                                                </Text>
                                                <Text fontWeight="bold">
                                                    <b>{exitWindow ? `${exitWindow / 86400} days` : '-'}</b>
                                                </Text>
                                                <Text>- Withdraw fee: {withdrawFee * 100}%</Text>
                                            </VStack>
                                            <Divider />
                                            <Text fontSize="22px" fontWeight="bold">
                                                2) Complete a withdrawal:
                                            </Text>
                                            {
                                                hasComingExit ? isWithinExitWindow ? <Text>You have a withdrawal of <b>{shortenNumber(pendingAmountInDola, 2)}</b> to complete!</Text> : <Text>You have a pending withdrawal of {shortenNumber(pendingAmountInDola, 2)} in queue phase</Text> : <Text>You don't have any pending withdrawal</Text>
                                            }
                                            {
                                                hasComingExit && <StatusMessage
                                                    status={isWithinExitWindow ? 'warning' : 'info'}
                                                    alertProps={{ w: 'full' }}
                                                    description={
                                                        isWithinExitWindow ? <VStack alignItems="flex-start" spacing="0">
                                                            <Text>- You have until <b>{formatDateWithTime(exitWindowEnd)}</b> to complete the withdrawal.</Text>
                                                            <Text>- Time left: ~{fromNow(exitWindowEnd, true)}</Text>
                                                            <Text>- The withdrawal will be cancelled otherwise.</Text>
                                                            <RSubmitButton mt="2" onClick={handleComplete}>
                                                                Complete Withdrawal
                                                            </RSubmitButton>
                                                        </VStack> : <VStack alignItems="flex-start" spacing="0">
                                                            <Text mb="1">The withdrawal exit window will be between:</Text>
                                                            <Text>- {formatDateWithTime(exitWindowStart)}</Text>
                                                            <Text>and</Text>
                                                            <Text>- {formatDateWithTime(exitWindowEnd)}</Text>
                                                        </VStack>
                                                    }
                                                />
                                            }
                                            {
                                                hasComingExit && <>
                                                    <Divider />
                                                    <VStack alignItems="flex-start" w='full' spacing="2">
                                                        <Text fontSize="22px" fontWeight="bold">
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
                                        </VStack>
                                }
                                {
                                    tab !== 'Infos' && <VStack alignItems="flex-start">
                                        {/* <HStack>
                                            <Text fontSize="16px" color="mainTextColorLight2">
                                                {isStake ? 'jrDOLA to receive' : 'jrDOLA to exchange'}:
                                            </Text>
                                            <Text fontSize="16px" color="mainTextColorLight2">
                                                {sDOLAamount ? preciseCommify(sDOLAamount, 2) : '-'}
                                            </Text>
                                        </HStack> */}
                                        {/* <HStack>
                                            <Text fontSize="16px" color="mainTextColorLight">
                                                DOLA-jrDOLA exchange rate:
                                            </Text>
                                            <Text fontSize="16px" color="mainTextColorLight">
                                                {jDolaExRate ? shortenNumber(1 / jDolaExRate, 6) : '-'}
                                            </Text>
                                        </HStack> */}
                                    </VStack>
                                }
                                {/* {
                                    isStake && <Text textDecoration="underline" onClick={() => setUseDolaAsMainChoice(!useDolaAsMainChoice)} cursor="pointer" color="accentTextColor">
                                        {
                                            useDolaAsMainChoice ? 'Or stake from another token than DOLA via Zap-In' : 'Or use DOLA as direct entry point'
                                        }
                                    </Text>
                                } */}
                            </>
                    }
                </VStack>
            </Container>
        </Stack>
    </VStack>
}