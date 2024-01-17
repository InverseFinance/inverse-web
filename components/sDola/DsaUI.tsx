import { VStack, Text, HStack, Divider } from "@chakra-ui/react"
import { sdolaDevInit, stakeDolaToSavings, unstakeDolaFromSavings, useDSABalance, useStakedDola } from "@app/util/dola-staking"
import { useWeb3React } from "@web3-react/core";
import { SimpleAmountForm } from "../common/SimpleAmountForm";
import { useState } from "react";
import { getNetworkConfigConstants } from "@app/util/networks";
import { parseEther } from "@ethersproject/units";
import Container from "../common/Container";
import { NavButtons } from "@app/components/common/Button";
import { InfoMessage } from "@app/components/common/Messages";
import { preciseCommify } from "@app/util/misc";
import { useDOLABalance } from "@app/hooks/useDOLA";
import { useDebouncedEffect } from "@app/hooks/useDebouncedEffect";
import { DOLA_SAVINGS_ADDRESS } from "@app/util/dola-staking";
import { useDBRPrice } from "@app/hooks/useDBR";
import { shortenNumber } from "@app/util/markets";
import { SmallTextLoader } from "../common/Loaders/SmallTextLoader";
import { TextInfo } from "../common/Messages/TextInfo";

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

export const DsaUI = () => {
    const { provider, account } = useWeb3React();
    const { priceUsd: dbrPrice, priceDola: dbrDolaPrice } = useDBRPrice();
    const [dolaAmount, setDolaAmount] = useState('');
    const [isConnected, setIsConnected] = useState(true);
    const [tab, setTab] = useState('Stake');
    const isStake = tab === 'Stake';

    const { savingsApr, isLoading } = useStakedDola(dbrDolaPrice, !dolaAmount || isNaN(parseFloat(dolaAmount)) ? 0 : isStake ? parseFloat(dolaAmount) : -parseFloat(dolaAmount));
    const { balance: dolaBalance } = useDOLABalance(account);
    const { balance: dolaSavingsBalance } = useDSABalance(account);

    const handleAction = async () => {
        // return sdolaDevInit(provider?.getSigner());
        if (isStake) {
            return stakeDolaToSavings(provider?.getSigner(), parseEther(dolaAmount));
        }
        return unstakeDolaFromSavings(provider?.getSigner(), parseEther(dolaAmount));
    }

    useDebouncedEffect(() => {
        setIsConnected(!!account)
    }, [account], 500);

    return <VStack w='full' maxW='450px' spacing="4">
        <HStack justify="space-between" w='full'>            
            <StatBasic message="Annual Percentage Rate of DBR rewards" isLoading={isLoading} name="DSA APR" value={`${shortenNumber(savingsApr, 2)}%`} />
            <StatBasic message="Market price of DBR on Curve" isLoading={isLoading} name="DBR price" value={`${shortenNumber(dbrPrice, 4, true)}`} />
        </HStack>
        <Divider borderColor="mainTextColor" />
        <Container
            label="DOLA Savings Account"
            description="See contract"
            href={`https://etherscan.io/address/${DOLA_SAVINGS_ADDRESS}`}
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
                                    Savings balance: {dolaSavingsBalance ? preciseCommify(dolaSavingsBalance, 2) : '-'}
                                </Text>
                            </HStack>
                            {
                                isStake ?
                                    <VStack w='full' alignItems="flex-start">
                                        <Text fontSize="18px" fontWeight="bold">
                                            Amount to stake:
                                        </Text>
                                        <SimpleAmountForm
                                            btnProps={{ needPoaFirst:true }}
                                            defaultAmount={dolaAmount}
                                            address={DOLA}
                                            destination={DOLA_SAVINGS_ADDRESS}
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
                                            btnProps={{ needPoaFirst:true }}
                                            defaultAmount={dolaAmount}
                                            address={DOLA_SAVINGS_ADDRESS}
                                            destination={DOLA_SAVINGS_ADDRESS}
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