import { VStack, Text, HStack, Stack, Image, useInterval } from "@chakra-ui/react"
import { useWeb3React } from "@web3-react/core";
import { SimpleAmountForm } from "../common/SimpleAmountForm";
import { useEffect, useMemo, useState } from "react";
import { getNetworkConfigConstants } from "@app/util/networks";
import { parseEther } from "@ethersproject/units";
import Container from "../common/Container";
import { NavButtons } from "@app/components/common/Button";
import { InfoMessage, SuccessMessage, WarningMessage } from "@app/components/common/Messages";
import { getAvgOnLastItems, preciseCommify, timestampToUTC } from "@app/util/misc";
import { useDebouncedEffect } from "@app/hooks/useDebouncedEffect";
import { useDBRMarkets, useDBRPrice } from "@app/hooks/useDBR";
import { getBnToNumber, getMonthlyRate, shortenNumber } from "@app/util/markets";
import { SmallTextLoader } from "../common/Loaders/SmallTextLoader";
import { TextInfo } from "../common/Messages/TextInfo";
import { ONE_DAY_MS, SECONDS_PER_BLOCK } from "@app/config/constants";
import { useAccount } from "@app/hooks/misc";
import { useDbrAuctionActivity } from "@app/util/dbr-auction";
import { StakeInvInfos } from "./StakeInvInfos";
import useEtherSWR from "@app/hooks/useEtherSWR";
import { redeemSInv, stakeInv, unstakeInv, useInvStakingEvolution, useStakedInv, useStakedInvBalance, VERSIONED_ADDRESSES } from "@app/util/sINV";

const { INV } = getNetworkConfigConstants();

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

export const StakeInvUI = ({
    version = 'V2',
    showVersion = false,
    ...props
}: {
    version: 'V1' | 'V2';
    showVersion?: boolean;
    props?: any;
}) => {
    const sinvAddress = VERSIONED_ADDRESSES[version].sinv;

    const account = useAccount();
    const { provider, account: connectedAccount } = useWeb3React();
    const { events: auctionBuys } = useDbrAuctionActivity();

    const { markets } = useDBRMarkets();
    const invMarket = markets?.find(m => m.isInv);
    const invPrice = invMarket?.price || 0;

    const [invAmount, setInvAmount] = useState('');
    const [isConnected, setIsConnected] = useState(true);
    const [thirtyDayAvg, setThirtyDayAvg] = useState(0);
    const [now, setNow] = useState(Date.now());
    const [tab, setTab] = useState('Stake');
    const isStake = tab === 'Stake';

    const { priceUsd: dbrPrice, priceDola: dbrDolaPrice } = useDBRPrice();
    const supplyDelta = !invAmount || isNaN(parseFloat(invAmount)) ? 0 : isStake ? parseFloat(invAmount) : -parseFloat(invAmount);
    const { apy, projectedApy, isLoading, sInvExRate, sInvTotalAssets, periodRevenue, depositLimit } = useStakedInv(dbrDolaPrice, version, supplyDelta);

    const { evolution, timestamp: lastDailySnapTs, isLoading: isLoadingEvolution } = useInvStakingEvolution();
    const { data: invBalanceBn } = useEtherSWR(
        [INV, 'balanceOf', account],
    );
    const invBalance = invBalanceBn ? getBnToNumber(invBalanceBn) : 0;
    // value in sINV terms
    const { shares: stakedInvBalance, bnShares: stakedInvBalanceBn } = useStakedInvBalance(account, version);
    const [previousStakedDolaBalance, setPrevStakedDolaBalance] = useState(stakedInvBalance);
    const [baseBalance, setBaseBalance] = useState(0);
    const [realTimeBalance, setRealTimeBalance] = useState(0);
    // value in INV terms
    const invStakedInSInv = sInvExRate * stakedInvBalance;
    const sINVamount = invAmount ? parseFloat(invAmount) / sInvExRate : '';

    const sInvAuctionBuys = auctionBuys.filter(e => e.auctionType === 'sINV')
        .reduce((prev, curr) => prev + curr.invIn, 0);
    const invBoughtByPressure = sInvAuctionBuys;
    const monthlyBuyPressureInInv = sInvTotalAssets * invMarket?.dbrApr / 100 / 12;

    useEffect(() => {
        if (isLoading || isLoadingEvolution || !evolution?.length) return;
        const nowUtcDate = timestampToUTC(now);
        const data = evolution
            .filter(d => timestampToUTC(d.timestamp) !== nowUtcDate)
            .concat([
                {
                    ...evolution[evolution.length - 1],
                    timestamp: Date.now() - (1000 * 120),
                    apy,
                }
            ]);
        setThirtyDayAvg(getAvgOnLastItems(data, 'apy', 30));
    }, [lastDailySnapTs, isLoadingEvolution, evolution, sInvTotalAssets, apy, isLoading, now]);

    useInterval(() => {
        const curr = (realTimeBalance || baseBalance);
        const incPerInterval = ((curr * (apy / 100)) * (STAKE_BAL_INC_INTERVAL / (ONE_DAY_MS * 365)));
        const neo = curr + incPerInterval;
        setRealTimeBalance(neo);
    }, STAKE_BAL_INC_INTERVAL);

    // every ~12s recheck base balance
    useInterval(() => {
        if (realTimeBalance > invStakedInSInv) return;
        setRealTimeBalance(invStakedInSInv);
        setBaseBalance(invStakedInSInv);
    }, MS_PER_BLOCK);

    useEffect(() => {
        if (previousStakedDolaBalance === stakedInvBalance) return;
        setBaseBalance(invStakedInSInv);
        setRealTimeBalance(invStakedInSInv);
        setPrevStakedDolaBalance(stakedInvBalance);
    }, [stakedInvBalance, previousStakedDolaBalance, invStakedInSInv]);

    useEffect(() => {
        if (!!baseBalance || !invStakedInSInv) return;
        setBaseBalance(invStakedInSInv);
    }, [baseBalance, invStakedInSInv]);

    useDebouncedEffect(() => {
        setIsConnected(!!connectedAccount);
    }, [connectedAccount], 500);

    const monthlyInvRewards = useMemo(() => {
        return (apy > 0 && invStakedInSInv > 0 ? getMonthlyRate(invStakedInSInv, apy) : 0);
    }, [invStakedInSInv, apy]);

    const depositLimitReached = useMemo(() => {
        return sInvTotalAssets > depositLimit;
    }, [depositLimit, sInvTotalAssets, invAmount]);

    const handleAction = async () => {
        if (isStake) {
            return stakeInv(provider?.getSigner(), parseEther(invAmount), version);
        }
        return unstakeInv(provider?.getSigner(), parseEther(invAmount), version);
    }

    const unstakeAll = async () => {
        return redeemSInv(provider?.getSigner(), stakedInvBalanceBn, version);
    }

    const resetRealTime = () => {
        setTimeout(() => {
            setBaseBalance(invStakedInSInv);
            setRealTimeBalance(invStakedInSInv);
        }, 250);
    }

    return <Stack direction={{ base: 'column', lg: 'row' }} alignItems={{ base: 'center', lg: 'flex-start' }} justify="space-around" w='full' spacing="12" {...props}>
        <VStack w='full' maxW='500px' spacing='4' pt='10'>
            <HStack justify="space-around" w='full'>
                <VStack>
                    <Image src="/assets/sINVx512.png" h="120px" w="120px" />
                    <Text fontSize="20px" fontWeight="bold">sINV{version === 'V1' ? ' V1 (deprecated)' : showVersion ? ' V2' : ''}</Text>
                </VStack>
            </HStack>
            <HStack justify="space-between" w='full'>
                <StatBasic message="This week's APY is calculated with last week's DBR auction revenues and assuming a weekly auto-compounding plus the xINV apr" isLoading={isLoading} name="Current APY" value={apy ? `${shortenNumber(apy, 2)}%` : '-'} />
                <StatBasic message={"The projected APY is a theoretical estimation of where the APY should tend to go. It's calculated by considering current's week auction revenue and a forecast that considers the DBR incentives, where the forecast portion has a weight of more than 50%, plus the xINV apr"} isLoading={isLoading} name="Projected APY" value={projectedApy ? `${shortenNumber(projectedApy, 2)}%` : '-'} />
            </HStack>
            {
                version === 'V1' ?
                    <WarningMessage
                        alertProps={{ w: 'full' }}
                        alertTitleProps={{ fontSize: "18px" }}
                        title="A new sINV version has been released!"
                        description={
                            <VStack spacing="0" alignItems="flex-start">
                                <Text>We recommend staking in the V2 instead</Text>
                                <Text>Deposits are safe but yield will be optimized for V2</Text>
                                <Text>Gas costs regarding migration will be reimbursed!</Text>
                            </VStack>
                        } />
                    :
                    <SuccessMessage
                        showIcon={false}
                        alertProps={{ w: 'full' }}
                        description={
                            <VStack alignItems="flex-start">
                                {
                                    monthlyInvRewards > 0 && <Stack direction={{ base: 'column', lg: 'row' }} w='full' justify="space-between">
                                        <Text>- Your rewards: </Text>
                                        <Text><b>~{preciseCommify(monthlyInvRewards, 2)} INV per month</b></Text>
                                    </Stack>
                                }
                                <Stack direction={{ base: 'column', lg: 'row' }} w='full' justify="space-between">
                                    <Text>- 30-day average APY:</Text>
                                    <Text><b>{thirtyDayAvg ? `${shortenNumber(thirtyDayAvg, 2)}%` : '-'}</b></Text>
                                </Stack>
                                <Stack direction={{ base: 'column', lg: 'row' }} w='full' justify="space-between">
                                    <Text>- Total staked by all users:</Text>
                                    <Text><b>{sInvTotalAssets ? `${shortenNumber(sInvTotalAssets, 2)} INV ${invPrice ? `(${shortenNumber(sInvTotalAssets * invPrice, 2, true)})` : ''}` : '-'}</b></Text>
                                </Stack>
                                <Stack direction={{ base: 'column', lg: 'row' }} w='full' justify="space-between">
                                    <Text>- Monthly buy pressure thanks to sINV:</Text>
                                    <Text><b>{monthlyBuyPressureInInv ? `${shortenNumber(monthlyBuyPressureInInv, 2)} INV (${shortenNumber(monthlyBuyPressureInInv * invPrice, 2, true)})` : '-'}</b></Text>
                                </Stack>
                                {/* <Stack direction={{ base: 'column', lg: 'row' }} w='full' justify="space-between">
                                    <Text>- INV bought thanks to sINV so far:</Text>
                                    <Text><b>{invBoughtByPressure ? `${shortenNumber(invBoughtByPressure, 2)} INV` : '-'}</b></Text>
                                </Stack> */}
                            </VStack>
                        }
                    />
            }
        </VStack>
        <Container
            label={`sINV${version === 'V1' ? ' V1 (deprecated)' : showVersion ? ' V2' : ''}`}
            description="Auto-Compounding Tokenized Vault - See contract"
            href={`https://etherscan.io/address/${sinvAddress}`}
            noPadding
            m="0"
            p="0"
            maxW='450px'
        >
            <VStack spacing="4" alignItems="flex-start" w='full'>
                {
                    !isConnected ? <InfoMessage alertProps={{ w: 'full' }} description="Please connect your wallet" />
                        :
                        <>
                            <NavButtons active={tab} options={['Stake', 'Unstake', 'Info']} onClick={(v) => setTab(v)} />
                            {
                                tab !== 'Info' && <VStack alignItems="flex-start" w='full' justify="space-between">
                                    <HStack justify="space-between" w='full'>
                                        <Text fontSize="18px">
                                            INV balance in wallet: <b>{invBalance ? preciseCommify(invBalance, 2) : '-'}</b>
                                        </Text>
                                        <Text fontSize="18px">
                                            {invPrice ? `(${shortenNumber(invBalance * invPrice, 2, true)})` : ''}
                                        </Text>
                                    </HStack>
                                    <HStack justify="space-between" w='full'>
                                        <Text fontSize="18px">
                                            Staked INV: <b>{invStakedInSInv ? preciseCommify(realTimeBalance, 8) : '-'}</b>
                                        </Text>
                                        <Text fontSize="18px">
                                            {invPrice ? `(${shortenNumber(realTimeBalance * invPrice, 2, true)})` : ''}
                                        </Text>
                                    </HStack>
                                </VStack>
                            }
                            {
                                tab === 'Info' ? <StakeInvInfos version={version} /> : isStake ?
                                    version === "V1" ? <InfoMessage alertProps={{ w: 'full' }} description={
                                        <VStack alignItems="flex-start" spacing="0">
                                            <Text>Staking is now disabled for V1.</Text>
                                            <Text>We recommend to unstake from V1 and stake back into V2</Text>
                                        </VStack>
                                    } />
                                        : <VStack w='full' alignItems="flex-start">
                                            <Text fontSize="22px" fontWeight="bold">
                                                INV amount to stake:
                                            </Text>
                                            <SimpleAmountForm
                                                btnProps={{ needPoaFirst: true }}
                                                defaultAmount={invAmount}
                                                address={INV}
                                                destination={sinvAddress}
                                                signer={provider?.getSigner()}
                                                decimals={18}
                                                onAction={() => handleAction()}
                                                actionLabel={`Stake`}
                                                maxActionLabel={`Stake all`}
                                                onAmountChange={(v) => setInvAmount(v)}
                                                showMaxBtn={false}
                                                showMax={true}
                                                isDisabled={!invAmount || depositLimitReached}
                                                hideInputIfNoAllowance={false}
                                                showBalance={false}
                                                onSuccess={() => resetRealTime()}
                                                enableCustomApprove={true}
                                            />
                                            {
                                                depositLimitReached && <InfoMessage description={`Note: sINV has reached its deposit limit of ${preciseCommify(depositLimit, 0)} INV for the moment`} />
                                            }
                                        </VStack>
                                    :
                                    <VStack w='full' alignItems="flex-start">
                                        <Text fontSize="22px" fontWeight="bold">
                                            INV amount to unstake:
                                        </Text>
                                        <SimpleAmountForm
                                            btnProps={{ needPoaFirst: true }}
                                            defaultAmount={invAmount}
                                            address={sinvAddress}
                                            destination={sinvAddress}
                                            needApprove={false}
                                            signer={provider?.getSigner()}
                                            decimals={18}
                                            onAction={() => handleAction()}
                                            onMaxAction={() => unstakeAll()}
                                            maxActionLabel={`Unstake all`}
                                            actionLabel={`Unstake`}
                                            onAmountChange={(v) => setInvAmount(v)}
                                            showMaxBtn={stakedInvBalance > 0}
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
                                tab !== 'Info' && <VStack alignItems="flex-start">
                                    <HStack>
                                        <Text fontSize="16px" color="mainTextColorLight2">
                                            {isStake ? 'sINV to receive' : 'sINV to exchange'}:
                                        </Text>
                                        <Text fontSize="16px" color="mainTextColorLight2">
                                            {sINVamount ? `${preciseCommify(sINVamount, 2)} (${shortenNumber(sINVamount * invPrice * sInvExRate, 2, true)})` : '-'}
                                        </Text>
                                    </HStack>
                                    <HStack>
                                        <Text fontSize="16px" color="mainTextColorLight2">
                                            INV-sINV exchange rate:
                                        </Text>
                                        <Text fontSize="16px" color="mainTextColorLight2">
                                            {sInvExRate ? shortenNumber(1 / sInvExRate, 6) : '-'}
                                        </Text>
                                    </HStack>
                                </VStack>
                            }
                        </>
                }
            </VStack>
        </Container>
    </Stack>
}