import { VStack, Text, HStack, Stack, Image, useInterval } from "@chakra-ui/react"
import { useWeb3React } from "@web3-react/core";
import { SimpleAmountForm } from "../common/SimpleAmountForm";
import { useEffect, useMemo, useState } from "react";
import { getNetworkConfigConstants } from "@app/util/networks";
import { parseEther } from "@ethersproject/units";
import Container from "../common/Container";
import { NavButtons } from "@app/components/common/Button";
import { InfoMessage, SuccessMessage } from "@app/components/common/Messages";
import { getAvgOnLastItems, preciseCommify, timestampToUTC } from "@app/util/misc";
import { useDebouncedEffect } from "@app/hooks/useDebouncedEffect";
import { useDBRPrice } from "@app/hooks/useDBR";
import { getBnToNumber, getMonthlyRate, shortenNumber } from "@app/util/markets";
import { SmallTextLoader } from "../common/Loaders/SmallTextLoader";
import { TextInfo } from "../common/Messages/TextInfo";
import { ONE_DAY_MS, SINV_ADDRESS, SECONDS_PER_BLOCK } from "@app/config/constants";
import { useAccount } from "@app/hooks/misc";
import { useDbrAuctionActivity } from "@app/util/dbr-auction";
import { StakeInvInfos } from "./StakeInvInfos";
import useEtherSWR from "@app/hooks/useEtherSWR";
import { redeemSInv, stakeInv, unstakeInv, useInvStakingEarnings, useStakedInv } from "@app/util/sINV";

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

export const StakeInvUI = () => {
    const account = useAccount();
    const { provider, account: connectedAccount } = useWeb3React();
    const { events: auctionBuys } = useDbrAuctionActivity();

    const [invAmount, setInvAmount] = useState('');
    const [isConnected, setIsConnected] = useState(true);
    const [thirtyDayAvg, setThirtyDayAvg] = useState(0);
    const [now, setNow] = useState(Date.now());
    const [tab, setTab] = useState('Stake');
    const isStake = tab === 'Stake';

    const { priceUsd: dbrPrice, priceDola: dbrDolaPrice } = useDBRPrice();
    const { apy, projectedApy, isLoading, sInvExRate, sInvTotalAssets, periodRevenue } = useStakedInv(dbrDolaPrice, !invAmount || isNaN(parseFloat(invAmount)) ? 0 : isStake ? parseFloat(invAmount) : -parseFloat(invAmount));
    // const { evolution, timestamp: lastDailySnapTs, isLoading: isLoadingEvolution } = useInvStakingEvolution();    
    const { data: invBalanceBn } = useEtherSWR(
        [INV, 'balanceOf', account],
    );
    const invBalance = invBalanceBn ? getBnToNumber(invBalanceBn) : 0;
    // value in sINV terms
    const { stakedInvBalance, stakedInvBalanceBn } = useInvStakingEarnings(account);
    const [previousStakedDolaBalance, setPrevStakedDolaBalance] = useState(stakedInvBalance);
    const [baseBalance, setBaseBalance] = useState(0);
    const [realTimeBalance, setRealTimeBalance] = useState(0);
    // value in INV terms
    const invStakedInSInv = sInvExRate * stakedInvBalance;
    const sINVamount = invAmount ? parseFloat(invAmount) / sInvExRate : '';

    const sInvAuctionBuys = auctionBuys.filter(e => e.auctionType === 'sINV')
        .reduce((prev, curr) => prev + curr.dolaIn, 0);
    const sInvHoldersTotalEarnings = sInvAuctionBuys - periodRevenue;

    // useEffect(() => {
    //     if (isLoading || isLoadingEvolution || !evolution?.length) return;
    //     const nowUtcDate = timestampToUTC(now);
    //     const data = evolution
    //         .filter(d => timestampToUTC(d.timestamp) !== nowUtcDate)
    //         .concat([
    //             {
    //                 ...evolution[evolution.length - 1],
    //                 timestamp: Date.now() - (1000 * 120),
    //                 apy,
    //             }
    //         ]);
    //     setThirtyDayAvg(getAvgOnLastItems(data, 'apy', 30));
    // }, [lastDailySnapTs, isLoadingEvolution, evolution, sInvTotalAssets, apy, isLoading, now]);

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

    const handleAction = async () => {
        if (isStake) {
            return stakeInv(provider?.getSigner(), parseEther(invAmount));
        }
        return unstakeInv(provider?.getSigner(), parseEther(invAmount));
    }

    const unstakeAll = async () => {
        return redeemSInv(provider?.getSigner(), stakedInvBalanceBn);
    }

    const resetRealTime = () => {
        setTimeout(() => {
            setBaseBalance(invStakedInSInv);
            setRealTimeBalance(invStakedInSInv);
        }, 250);
    }

    return <Stack direction={{ base: 'column', lg: 'row' }} alignItems={{ base: 'center', lg: 'flex-start' }} justify="space-around" w='full' spacing="12">
        <VStack w='full' maxW='450px' spacing='4' pt='10'>
            <HStack justify="space-around" w='full'>
                <VStack>
                    <Image src="/assets/sINVx512.png" h="120px" w="120px" />
                    <Text fontSize="20px" fontWeight="bold">sINV</Text>
                </VStack>
            </HStack>
            <HStack justify="space-between" w='full'>
                <StatBasic message="This week's APY is calculated with last week's DBR auction revenues and assuming a weekly auto-compounding" isLoading={isLoading} name="Current APY" value={apy ? `${shortenNumber(apy, 2)}%` : '-'} />
                <StatBasic message={"The projected APY is a theoretical estimation of where the APY should tend to go. It's calculated by considering current's week auction revenue and a forecast that considers the DBR incentives, where the forecast portion has a weight of more than 50%"} isLoading={isLoading} name="Projected APY" value={projectedApy ? `${shortenNumber(projectedApy, 2)}%` : '-'} />
            </HStack>            
        </VStack>
        <Container
            label="sINV - Auto-Compounding Tokenized Vault"
            description="See contract"
            href={`https://etherscan.io/address/${SINV_ADDRESS}`}
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
                            <NavButtons active={tab} options={['Stake', 'Unstake', 'Infos']} onClick={(v) => setTab(v)} />
                            {
                                tab !== 'Infos' && <VStack alignItems="flex-start" w='full' justify="space-between">
                                    <Text fontSize="18px">
                                        INV balance in wallet: <b>{invBalance ? preciseCommify(invBalance, 2) : '-'}</b>
                                    </Text>
                                    <Text fontSize="18px">
                                        Staked INV: <b>{invStakedInSInv ? preciseCommify(realTimeBalance, 8) : '-'}</b>
                                    </Text>
                                </VStack>
                            }
                            {
                                tab === 'Infos' ? <StakeInvInfos /> : isStake ?
                                    <VStack w='full' alignItems="flex-start">
                                        <Text fontSize="22px" fontWeight="bold">
                                            INV amount to stake:
                                        </Text>
                                        <SimpleAmountForm
                                            btnProps={{ needPoaFirst: true }}
                                            defaultAmount={invAmount}
                                            address={INV}
                                            destination={SINV_ADDRESS}
                                            signer={provider?.getSigner()}
                                            decimals={18}
                                            onAction={() => handleAction()}
                                            actionLabel={`Stake`}
                                            maxActionLabel={`Stake all`}
                                            onAmountChange={(v) => setInvAmount(v)}
                                            showMaxBtn={false}
                                            showMax={true}
                                            hideInputIfNoAllowance={false}
                                            showBalance={false}
                                            onSuccess={() => resetRealTime()}
                                            enableCustomApprove={true}
                                        />
                                    </VStack>
                                    :
                                    <VStack w='full' alignItems="flex-start">
                                        <Text fontSize="22px" fontWeight="bold">
                                            INV amount to unstake:
                                        </Text>
                                        <SimpleAmountForm
                                            btnProps={{ needPoaFirst: true }}
                                            defaultAmount={invAmount}
                                            address={SINV_ADDRESS}
                                            destination={SINV_ADDRESS}
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
                                tab !== 'Infos' && <VStack alignItems="flex-start">
                                    <HStack>
                                        <Text fontSize="16px" color="mainTextColorLight2">
                                            {isStake ? 'sINV to receive' : 'sINV to exchange'}:
                                        </Text>
                                        <Text fontSize="16px" color="mainTextColorLight2">
                                            {sINVamount ? preciseCommify(sINVamount, 2) : '-'}
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