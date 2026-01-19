import { VStack, Text, HStack, Stack, Image, useInterval, useDisclosure, Link } from "@chakra-ui/react"
import { useWeb3React } from "@web3-react/core";
import { SimpleAmountForm } from "../common/SimpleAmountForm";
import { useEffect, useMemo, useState } from "react";
import { getNetworkConfigConstants } from "@app/util/networks";
import { parseEther } from "@ethersproject/units";
import Container from "../common/Container";
import { NavButtons } from "@app/components/common/Button";
import { InfoMessage, SuccessMessage } from "@app/components/common/Messages";
import { getNextThursdayTimestamp, preciseCommify } from "@app/util/misc";
import { useDOLABalance } from "@app/hooks/useDOLA";
import { useDebouncedEffect } from "@app/hooks/useDebouncedEffect";
import { useDBRPrice } from "@app/hooks/useDBR";
import { getMonthlyRate, getNumberToBn, shortenNumber } from "@app/util/markets";
import { SmallTextLoader } from "../common/Loaders/SmallTextLoader";
import { TextInfo } from "../common/Messages/TextInfo";
import { JDOLA_AUCTION_ADDRESS, ONE_DAY_MS, SECONDS_PER_BLOCK } from "@app/config/constants";
import { useAccount } from "@app/hooks/misc";
import { StakeJDolaInfos } from "./StakeJDolaInfos";
import { useDOLAPrice } from "@app/hooks/usePrices";
import { SkeletonBlob } from "../common/Skeleton";
import { stakeJDola, unstakeJDola, useJDolaStakingEarnings, useJuniorWithdrawDelay, useStakedJDola } from "@app/util/junior";

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

    const [dolaAmount, setDolaAmount] = useState('');
    const [isConnected, setIsConnected] = useState(true);
    const [isPreventLoader, setIsPreventLoader] = useState(false);
    const [nowWithInterval, setNowWithInterval] = useState(Date.now());
    const [tab, setTab] = useState('Stake');
    const isStake = tab === 'Stake';

    const { priceUsd: dbrPrice } = useDBRPrice();
    const { price: dolaPrice } = useDOLAPrice();
    const { apy, apy30d, projectedApy, isLoading, jDolaExRate, jDolaTotalAssets, jDolaSupply, weeklyRevenue, isLoading: isLoadingStakedDola, spectraApy, spectraLink } = useStakedJDola(dbrPrice, !dolaAmount || isNaN(parseFloat(dolaAmount)) ? 0 : isStake ? parseFloat(dolaAmount) : -parseFloat(dolaAmount), true);
    const { balance: dolaBalance } = useDOLABalance(account);
    // value in jDOLA terms
    const { stakedDolaBalance, stakedDolaBalanceBn } = useJDolaStakingEarnings(account);
    const [previousStakedDolaBalance, setPrevStakedDolaBalance] = useState(stakedDolaBalance);
    const [baseBalance, setBaseBalance] = useState(0);
    const [realTimeBalance, setRealTimeBalance] = useState(0);
    // value in DOLA terms
    const { withdrawDelay } = useJuniorWithdrawDelay(jDolaSupply, dolaAmount, account);
    const dolaStakedInVault = jDolaExRate * stakedDolaBalance;
    const sDOLAamount = dolaAmount ? parseFloat(dolaAmount) / jDolaExRate : '';

    const nextThursdayTsString = useMemo(() => {
        return new Date(getNextThursdayTimestamp()).toLocaleDateString('en-US', { month: 'long', year: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' });
    }, [nowWithInterval]);

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

    const handleAction = async () => {
        if (isStake) {
            return stakeJDola(provider?.getSigner(), parseEther(dolaAmount));
        }
        return unstakeJDola(provider?.getSigner(), parseEther(dolaAmount));
    }

    const unstakeAll = async () => {
        return unstakeJDola(provider?.getSigner(), stakedDolaBalanceBn);
    }

    const resetRealTime = () => {
        setTimeout(() => {
            setBaseBalance(dolaStakedInVault);
            setRealTimeBalance(dolaStakedInVault);
        }, 250);
    }

    return <VStack w='full' spacing="4">
        <InfoMessage description={
            <VStack>
                <Text>What is jDOLA?</Text>
                <Text>jDOLA is a yield-bearing stablecoin where stakers earn yield coming from DBR auctions similarly to sDOLA, but contrary to sDOLA the DOLA deposits of jDOLA stakers serve as junior tranche and cannot be withdrawn immediately, in case bad debt occurs in an allowed FiRM market the DOLA deposits in jDOLA may be slashed proportionnally among depositors.</Text>
                <Text>To exit jDOLA and get back DOLA a user must queue a withdrawal, wait for the withdrawal delay and then complete the withdrawal within an exit window, if the exit window expired before completing the withdrawal then a new withdrawal must be queued.</Text>
            </VStack>
        } alertProps={{ w: 'full' }} />
        <Stack direction={{ base: 'column', lg: 'row' }} alignItems={{ base: 'center', lg: 'flex-start' }} justify="space-around" w='full' spacing="12">
            <VStack w='full' maxW='450px' spacing='4' pt='10'>
                <HStack justify="space-around" w='full'>
                    <VStack>
                        <Image src="/assets/sDOLAx512.png" h="120px" w="120px" />
                        <Text fontSize="20px" fontWeight="bold">jDOLA</Text>
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
                label="jDOLA - Yield-Bearing stablecoin"
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
                                        {/* <Text>
                                            DOLA balance in wallet: <b>{dolaBalance ? preciseCommify(dolaBalance, 2) : '-'}</b>
                                        </Text> */}
                                        <Text>
                                            Your staked DOLA: <b>{dolaStakedInVault ? preciseCommify(realTimeBalance, 8) : '-'}</b>
                                        </Text>
                                    </VStack>
                                }
                                {
                                    tab === 'Infos' ? <StakeJDolaInfos /> : isStake ?
                                        (useDolaAsMainChoice ?
                                            <VStack w='full' alignItems="flex-start">
                                                <Text fontSize="22px" fontWeight="bold">
                                                    DOLA amount to stake:
                                                </Text>
                                                <SimpleAmountForm
                                                    btnProps={{ needPoaFirst: true }}
                                                    defaultAmount={dolaAmount}
                                                    address={DOLA}
                                                    destination={JDOLA_AUCTION_ADDRESS}
                                                    signer={provider?.getSigner()}
                                                    decimals={18}
                                                    onAction={() => handleAction()}
                                                    actionLabel={`Stake`}
                                                    maxActionLabel={`Stake all`}
                                                    onAmountChange={(v) => setDolaAmount(v)}
                                                    showMaxBtn={false}
                                                    showMax={true}
                                                    hideInputIfNoAllowance={false}
                                                    showBalance={false}
                                                    onSuccess={() => resetRealTime()}
                                                    enableCustomApprove={true}
                                                />
                                            </VStack>
                                            : isLoadingStables && !isPreventLoader ? <SkeletonBlob /> :
                                                <>
                                                    <Text fontSize="22px" fontWeight="bold">
                                                        DOLA amount to stake:
                                                    </Text>
                                                    <SimpleAmountForm
                                                        btnProps={{ needPoaFirst: true }}
                                                        defaultAmount={dolaAmount}
                                                        address={JDOLA_AUCTION_ADDRESS}
                                                        destination={JDOLA_AUCTION_ADDRESS}
                                                        needApprove={false}
                                                        signer={provider?.getSigner()}
                                                        decimals={18}
                                                        onAction={() => handleAction()}
                                                        maxActionLabel={`Unstake all`}
                                                        actionLabel={`Unstake`}
                                                        onAmountChange={(v) => setDolaAmount(v)}
                                                        maxAmountFrom={[getNumberToBn(dolaStakedInVault, 18)]}
                                                        showMaxBtn={stakedDolaBalance > 0}
                                                        showMax={false}
                                                        hideInputIfNoAllowance={false}
                                                        showBalance={false}
                                                        onSuccess={() => resetRealTime()}
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
                                                DOLA amount to unstake:
                                            </Text>
                                            <SimpleAmountForm
                                                btnProps={{ needPoaFirst: true }}
                                                defaultAmount={dolaAmount}
                                                address={JDOLA_AUCTION_ADDRESS}
                                                destination={JDOLA_AUCTION_ADDRESS}
                                                needApprove={false}
                                                signer={provider?.getSigner()}
                                                decimals={18}
                                                onAction={() => handleAction()}
                                                onMaxAction={() => unstakeAll()}
                                                maxActionLabel={`Unstake all`}
                                                actionLabel={`Unstake`}
                                                onAmountChange={(v) => setDolaAmount(v)}
                                                maxAmountFrom={[getNumberToBn(dolaStakedInVault, 18)]}
                                                showMaxBtn={stakedDolaBalance > 0}
                                                showMax={false}
                                                hideInputIfNoAllowance={false}
                                                showBalance={false}
                                                onSuccess={() => resetRealTime()}
                                            />
                                            {
                                                <InfoMessage description="Note: to unstake everything use the unstake all button to avoid leaving dust" />
                                            }
                                        </VStack>
                                }
                                {
                                    tab !== 'Infos' && <VStack alignItems="flex-start">
                                        {/* <HStack>
                                            <Text fontSize="16px" color="mainTextColorLight2">
                                                {isStake ? 'jDOLA to receive' : 'jDOLA to exchange'}:
                                            </Text>
                                            <Text fontSize="16px" color="mainTextColorLight2">
                                                {sDOLAamount ? preciseCommify(sDOLAamount, 2) : '-'}
                                            </Text>
                                        </HStack> */}
                                        <HStack>
                                            <Text fontSize="16px" color="mainTextColorLight">
                                                DOLA-jDOLA exchange rate:
                                            </Text>
                                            <Text fontSize="16px" color="mainTextColorLight">
                                                {jDolaExRate ? shortenNumber(1 / jDolaExRate, 6) : '-'}
                                            </Text>
                                        </HStack>
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