import { VStack, Text, HStack, Divider, useInterval } from "@chakra-ui/react"
import { redeemSDola, stakeDola, unstakeDola, useDolaStakingEarnings, useStakedDola } from "@app/util/dola-staking"
import { useWeb3React } from "@web3-react/core";
import { SimpleAmountForm } from "../common/SimpleAmountForm";
import { useEffect, useMemo, useState } from "react";
import { getNetworkConfigConstants } from "@app/util/networks";
import { parseEther } from "@ethersproject/units";
import Container from "../common/Container";
import { NavButtons } from "@app/components/common/Button";
import { InfoMessage } from "@app/components/common/Messages";
import { preciseCommify } from "@app/util/misc";
import { useDOLABalance } from "@app/hooks/useDOLA";
import { useDebouncedEffect } from "@app/hooks/useDebouncedEffect";
import { useDBRPrice } from "@app/hooks/useDBR";
import { getMonthlyRate, shortenNumber } from "@app/util/markets";
import { SmallTextLoader } from "../common/Loaders/SmallTextLoader";
import { TextInfo } from "../common/Messages/TextInfo";
import { ONE_DAY_MS, SDOLA_ADDRESS, SECONDS_PER_BLOCK } from "@app/config/constants";
import { useAccount } from "@app/hooks/misc";

const { DOLA } = getNetworkConfigConstants();

const StatBasic = ({ value, name, message, onClick = undefined, isLoading = false }: { value: string, message: any, onClick?: () => void, name: string, isLoading?: boolean }) => {
    return <VStack>
        {
            !isLoading ? <Text color={'secondary'} fontSize={{ base: '20px', sm: '26px' }} fontWeight="extrabold">{value}</Text>
                : <SmallTextLoader width={'100px'} />
        }
        <TextInfo message={message}>
            <Text cursor={!!onClick ? 'pointer' : undefined} textDecoration={!!onClick ? 'underline' : undefined} onClick={onClick} color={'mainTextColor'} fontSize={{ base: '16px', sm: '20px' }} fontWeight="bold">{name}</Text>
        </TextInfo>
    </VStack>
}

const STAKE_BAL_INC_INTERVAL = 100;
const MS_PER_BLOCK = SECONDS_PER_BLOCK * 1000;

export const StakeDolaUI = () => {
    const account = useAccount();
    const { provider, account: connectedAccount } = useWeb3React();
    const { priceUsd: dbrPrice, priceDola: dbrDolaPrice } = useDBRPrice();
    const [dolaAmount, setDolaAmount] = useState('');
    const [isConnected, setIsConnected] = useState(true);
    const [tab, setTab] = useState('Stake');
    const isStake = tab === 'Stake';

    const { apy, projectedApy, isLoading, sDolaExRate, nextApy } = useStakedDola(dbrDolaPrice, !dolaAmount || isNaN(parseFloat(dolaAmount)) ? 0 : isStake ? parseFloat(dolaAmount) : -parseFloat(dolaAmount));
    const { balance: dolaBalance } = useDOLABalance(account);
    const { stakedDolaBalance, stakedDolaBalanceBn } = useDolaStakingEarnings(account);
    const [previousStakedDolaBalance, setPrevStakedDolaBalance] = useState(stakedDolaBalance);
    const [baseBalance, setBaseBalance] = useState(0);
    const [realTimeBalance, setRealTimeBalance] = useState(0);
    const dolaStakedInSDola = sDolaExRate * stakedDolaBalance;
    const sDOLAamount = dolaAmount ? parseFloat(dolaAmount) / sDolaExRate : '';

    useInterval(() => {
        const curr = (realTimeBalance || baseBalance);
        const incPerInterval = ((curr * (apy / 100)) * (STAKE_BAL_INC_INTERVAL / (ONE_DAY_MS * 365)));
        const neo = curr + incPerInterval;
        setRealTimeBalance(neo);
    }, STAKE_BAL_INC_INTERVAL);

    // every ~12s recheck base balance
    useInterval(() => {
        if (realTimeBalance > dolaStakedInSDola) return;
        setRealTimeBalance(dolaStakedInSDola);
        setBaseBalance(dolaStakedInSDola);
    }, MS_PER_BLOCK);

    useEffect(() => {
        if (previousStakedDolaBalance === stakedDolaBalance) return;
        setBaseBalance(dolaStakedInSDola);
        setRealTimeBalance(dolaStakedInSDola);
        setPrevStakedDolaBalance(stakedDolaBalance);
    }, [stakedDolaBalance, previousStakedDolaBalance, dolaStakedInSDola]);

    useEffect(() => {
        if (!!baseBalance || !dolaStakedInSDola) return;
        setBaseBalance(dolaStakedInSDola);
    }, [baseBalance, dolaStakedInSDola]);

    useDebouncedEffect(() => {
        setIsConnected(!!connectedAccount);
    }, [connectedAccount], 500);

    // const monthlyProjectedDolaRewards = useMemo(() => {
    //     return (projectedApy > 0 && stakedDolaBalance > 0 ? getMonthlyRate(stakedDolaBalance, projectedApy) : 0);
    // }, [stakedDolaBalance, projectedApy]);

    const monthlyDolaRewards = useMemo(() => {
        return (apy > 0 && stakedDolaBalance > 0 ? getMonthlyRate(stakedDolaBalance, apy) : 0);
    }, [stakedDolaBalance, apy]);

    const handleAction = async () => {
        if (isStake) {
            return stakeDola(provider?.getSigner(), parseEther(dolaAmount));
        }
        return unstakeDola(provider?.getSigner(), parseEther(dolaAmount));
    }

    const unstakeAll = async () => {
        return redeemSDola(provider?.getSigner(), stakedDolaBalanceBn);
    }

    const resetRealTime = () => {
        setTimeout(() => {
            setBaseBalance(dolaStakedInSDola);
            setRealTimeBalance(dolaStakedInSDola);
        }, 250);
    }

    return <VStack w='full' maxW='470px' spacing="4">
        <HStack justify="space-between" w='full'>
            <StatBasic message="This week's APY is calculated with last week's DBR auction revenues and assuming a weekly auto-compounding" isLoading={isLoading} name="Current APY" value={apy ? `${shortenNumber(apy, 2)}%` : '0% this week'} />
            <StatBasic message={"The projected APY is a theoretical estimation of where the APY should tend to go. It's calculated by considering current's week auction revenue and a forecast that considers the DBR incentives, where the forecast portion has a weight of more than 50%"} isLoading={isLoading} name="Projected APY" value={`${shortenNumber(projectedApy, 2)}%`} />
        </HStack>
        {
            (monthlyDolaRewards > 0) && <InfoMessage
                alertProps={{ w: 'full' }}
                description={
                    <VStack alignItems="flex-start">
                        {/* { earnings > 0.1 && <Text>Your cumulated earnings: <b>{preciseCommify(earnings, 2)} DOLA</b></Text> } */}
                        {/* <Text>Your projected monthly rewards: <b>~{preciseCommify(monthlyProjectedDolaRewards, 2)} DOLA</b></Text> */}
                        {apy > 0 && <Text>Your monthly rewards (current APY): ~{preciseCommify(monthlyDolaRewards, 2)} DOLA</Text>}
                        {/* <Text>Note: actual rewards depend on past revenue</Text> */}
                    </VStack>
                }
            />
        }
        <Divider borderColor="mainTextColor" />
        <Container
            label="sDOLA - Yield-Bearing stablecoin"
            description="See contract"
            href={`https://etherscan.io/address/${SDOLA_ADDRESS}`}
            noPadding
            m="0"
            p="0">
            <VStack spacing="4" alignItems="flex-start" w='full'>
                {
                    !isConnected ? <InfoMessage alertProps={{ w: 'full' }} description="Please connect your wallet" />
                        :
                        <>
                            <NavButtons active={tab} options={['Stake', 'Unstake']} onClick={(v) => setTab(v)} />
                            <VStack alignItems="flex-start" w='full' justify="space-between">
                                <Text fontSize="20px">
                                    DOLA balance in wallet: <b>{dolaBalance ? preciseCommify(dolaBalance, 2) : '-'}</b>
                                </Text>
                                <Text fontSize="20px">
                                    Staked DOLA: <b>{dolaStakedInSDola ? preciseCommify(realTimeBalance, 8) : '-'}</b>
                                </Text>
                            </VStack>
                            {
                                isStake ?
                                    <VStack w='full' alignItems="flex-start">
                                        <Text fontSize="22px" fontWeight="bold">
                                            DOLA amount to stake:
                                        </Text>
                                        <SimpleAmountForm
                                            btnProps={{ needPoaFirst: true }}
                                            defaultAmount={dolaAmount}
                                            address={DOLA}
                                            destination={SDOLA_ADDRESS}
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
                                        />
                                    </VStack>
                                    :
                                    <VStack w='full' alignItems="flex-start">
                                        <Text fontSize="22px" fontWeight="bold">
                                            DOLA amount to unstake:
                                        </Text>
                                        <SimpleAmountForm
                                            btnProps={{ needPoaFirst: true }}
                                            defaultAmount={dolaAmount}
                                            address={SDOLA_ADDRESS}
                                            destination={SDOLA_ADDRESS}
                                            needApprove={false}
                                            signer={provider?.getSigner()}
                                            decimals={18}
                                            onAction={() => handleAction()}
                                            onMaxAction={() => unstakeAll()}
                                            maxActionLabel={`Unstake all`}
                                            actionLabel={`Unstake`}
                                            onAmountChange={(v) => setDolaAmount(v)}
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
                            <VStack alignItems="flex-start">                                
                                <HStack>
                                    <Text fontSize="16px" color="mainTextColorLight2">
                                        {isStake ? 'sDOLA to receive' : 'sDOLA to exchange'}:
                                    </Text>
                                    <Text fontSize="16px" color="mainTextColorLight2">
                                        {sDOLAamount ? preciseCommify(sDOLAamount, 2) : '-'}
                                    </Text>
                                </HStack>
                                <HStack>
                                    <Text fontSize="16px" color="mainTextColorLight2">
                                        DOLA-sDOLA exchange rate:
                                    </Text>
                                    <Text fontSize="16px" color="mainTextColorLight2">
                                        {sDolaExRate ? shortenNumber(1/sDolaExRate, 6) : '-'}
                                    </Text>
                                </HStack>
                            </VStack>
                        </>
                }
            </VStack>
        </Container>
    </VStack>
}