import { VStack, Text, HStack, Divider } from "@chakra-ui/react"
import { stakeDola, unstakeDola, useDolaStakingEarnings, useStakedDola } from "@app/util/dola-staking"
import { useWeb3React } from "@web3-react/core";
import { SimpleAmountForm } from "../common/SimpleAmountForm";
import { useMemo, useState } from "react";
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
import { SDOLA_ADDRESS } from "@app/config/constants";
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

export const StakeDolaUI = () => {
    const account = useAccount();
    const { provider, account: connectedAccount } = useWeb3React();
    const { priceUsd: dbrPrice, priceDola: dbrDolaPrice } = useDBRPrice();
    const [dolaAmount, setDolaAmount] = useState('');
    const [isConnected, setIsConnected] = useState(true);
    const [tab, setTab] = useState('Stake');
    const isStake = tab === 'Stake';

    const { apr, projectedApr, isLoading, sDolaExRate } = useStakedDola(dbrDolaPrice, !dolaAmount || isNaN(parseFloat(dolaAmount)) ? 0 : isStake ? parseFloat(dolaAmount) : -parseFloat(dolaAmount));
    const { balance: dolaBalance } = useDOLABalance(account);
    const { stakedDolaBalance } = useDolaStakingEarnings(account);
    const dolaStakedInSDola = sDolaExRate * stakedDolaBalance;

    const monthlyProjectedDolaRewards = useMemo(() => {
        return (projectedApr > 0 && stakedDolaBalance > 0 ? getMonthlyRate(stakedDolaBalance, projectedApr) : 0);
    }, [stakedDolaBalance, projectedApr]);

    const monthlyDolaRewards = useMemo(() => {
        return (apr > 0 && stakedDolaBalance > 0 ? getMonthlyRate(stakedDolaBalance, apr) : 0);
    }, [stakedDolaBalance, apr]);

    const handleAction = async () => {        
        if (isStake) {
            return stakeDola(provider?.getSigner(), parseEther(dolaAmount));
        }
        return unstakeDola(provider?.getSigner(), parseEther(dolaAmount));
    }

    useDebouncedEffect(() => {
        setIsConnected(!!connectedAccount)
    }, [connectedAccount], 500);

    return <VStack w='full' maxW='470px' spacing="4">
        <HStack justify="space-between" w='full'>
            <StatBasic message="This week's APR is calculated with last week's DBR auction revenues" isLoading={isLoading} name="Initial APR" value={apr ? `${shortenNumber(apr, 2)}%` : 'TBD'} />
            <StatBasic message="The projected APR is calculated with the dbrRatePerDOLA and the current DBR price in DOLA" isLoading={isLoading} name="Projected APR" value={`${shortenNumber(projectedApr, 2)}%`} />
        </HStack>
        {
            (monthlyDolaRewards > 0) && <InfoMessage
                alertProps={{ w: 'full' }}
                description={
                    <VStack alignItems="flex-start">
                        {/* { earnings > 0.1 && <Text>Your cumulated earnings: <b>{preciseCommify(earnings, 2)} DOLA</b></Text> } */}
                        {/* <Text>Your projected monthly rewards: <b>~{preciseCommify(monthlyProjectedDolaRewards, 2)} DOLA</b></Text> */}
                        {apr > 0 && <Text>Your monthly rewards (current APR): ~{preciseCommify(monthlyDolaRewards, 2)} DOLA</Text>}
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
                            <HStack w='full' justify="space-between">
                                <Text fontSize="14px">
                                    DOLA balance: {dolaBalance ? preciseCommify(dolaBalance, 2) : '-'}
                                </Text>
                                <Text fontSize="14px">
                                    DOLA staked: {dolaStakedInSDola ? preciseCommify(dolaStakedInSDola, 2) : '-'}
                                </Text>
                            </HStack>
                            {
                                isStake ?
                                    <VStack w='full' alignItems="flex-start">
                                        <Text fontSize="18px" fontWeight="bold">
                                            Amount to stake:
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
                                            onAmountChange={(v) => setDolaAmount(v)}
                                            showMaxBtn={false}
                                            hideInputIfNoAllowance={false}
                                            showBalance={true}
                                        />
                                    </VStack>
                                    :
                                    <VStack w='full' alignItems="flex-start">
                                        <Text fontSize="18px" fontWeight="bold">
                                            Amount to unstake:
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
                                            actionLabel={`Unstake`}
                                            onAmountChange={(v) => setDolaAmount(v)}
                                            showMaxBtn={false}
                                            hideInputIfNoAllowance={false}
                                            showBalance={true}
                                        />
                                    </VStack>
                            }
                        </>
                }                
            </VStack>
        </Container>
    </VStack>
}