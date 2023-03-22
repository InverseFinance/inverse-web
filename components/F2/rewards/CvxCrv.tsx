import Container from "@app/components/common/Container";
import Link from "@app/components/common/Link";
import { InfoMessage } from "@app/components/common/Messages";
import { getBnToNumber, shortenNumber } from "@app/util/markets";
import { VStack, Text, Slider, SliderTrack, SliderFilledTrack, SliderThumb, HStack } from "@chakra-ui/react"
import { useState, useContext, useEffect } from "react";
import { PercentagesBar } from "../forms/PercentagesOfMax";
import { RSubmitButton } from "@app/components/common/Button/RSubmitButton";
import { F2MarketContext } from "../F2Contex";
import { setRewardWeight } from "@app/util/firm-extra";
import useEtherSWR from "@app/hooks/useEtherSWR";
import { F2_ESCROW_ABI } from "@app/config/abis";

export const CvxCrvWeightBar = ({
    perc,    
    onChange,
}) => {
    return <VStack w='full'>
        <Slider
            value={perc}
            onChange={onChange}
            min={0}
            max={100}
            step={5}
            aria-label='slider-ex-4'            
        >
            <SliderTrack h="15px" bg='mainTextColor'>
                <SliderFilledTrack bg={'info'} />
            </SliderTrack>
            <SliderThumb h="30px" bg="info" />
        </Slider>
    </VStack>
}

const cvxCRVStakingAddress = '0xaa0C3f5F7DFD688C6E646F66CD2a6B66ACdbE434';

const useCvxCrvRewards = (escrow = '0x5a78917b84d3946f7e093ad4d9944fffffb451a9') => {
    const { data, error } = useEtherSWR({
        args: [
            [cvxCRVStakingAddress, 'userRewardWeight', escrow],
            // there's two reward groups for cvxCrv
            [cvxCRVStakingAddress, 'userRewardBalance', escrow, 0],
            [cvxCRVStakingAddress, 'userRewardBalance', escrow, 1],
        ],
        abi: [
            'function userRewardWeight(address) public view returns (uint)',
            'function userRewardBalance(address, uint) public view returns (uint)',
        ],
    });

    return {
        userRewardWeight: data ? getBnToNumber(data[0], 2) : null,
        group1Rewards: data ? getBnToNumber(data[1]) : 0,
        group2Rewards: data ? getBnToNumber(data[2]) : 0,
        isLoading: !error && !data,
        error,
    }
}

export const CvxCrvRewards = () => {
    const { escrow, signer } = useContext(F2MarketContext);
    const [perc, setPerc] = useState<number | null>(null);
    const [defaultPerc, setDefaultPerc] = useState<number | null>(null);
    const { userRewardWeight, group1Rewards, group2Rewards } = useCvxCrvRewards(escrow);

    useEffect(() => {
        if (userRewardWeight === null) { return }
        setDefaultPerc(userRewardWeight);
        if(perc === null) {
            setPerc(userRewardWeight);
        }        
    }, [userRewardWeight]);

    const hasChanged = perc !== defaultPerc;

    const handleRewardsRepartitionUpdate = async () => {
        if (!escrow || !hasChanged || !signer) { return }
        return setRewardWeight(escrow, perc * 100, signer);
    }

    return <Container label="Rewards Preferences" noPadding p='0'>
        <VStack spacing="8" w='full' alignItems="flex-start" p="2">
            {
                !!escrow && <VStack w='full' spacing="4">
                    <HStack fontSize="20px" fontWeight="bold" w='full' justify="space-between">
                        <HStack w='33%'>
                            <Text>CVX+CRV rewards:</Text>
                            <Text color="accentTextColor" fontSize="26px" fontWeight="1000">{shortenNumber(100 - perc, 0)}%</Text>
                        </HStack>
                        <HStack w='33%' fontWeight="bold" justify="center">
                            <RSubmitButton
                                boxShadow="none"
                                outline="none"
                                border="none"
                                cursor={hasChanged ? 'pointer' : 'default'}
                                color={hasChanged ? 'contrastMainTextColor' : 'mainTextColor'}
                                bgColor={hasChanged ? 'accentTextColor' : 'transparent'}
                                maxW="300px"
                                fontSize={hasChanged ? '18px' : '28px'}
                                onClick={handleRewardsRepartitionUpdate}
                            >
                                {
                                    hasChanged ? `Update Rewards Repartition` : `Rewards Repartition`
                                }
                            </RSubmitButton>
                        </HStack>
                        <HStack w='33%' justify="flex-end">
                            <Text>3CRV stablecoin rewards:</Text>
                            <Text color="accentTextColor" fontSize="26px" fontWeight="1000">{shortenNumber(perc, 0)}%</Text>
                        </HStack>
                    </HStack>
                    <CvxCrvWeightBar perc={perc} onChange={setPerc} />
                    <PercentagesBar showAsRepartition={true} onChange={setPerc} tickProps={{ fontSize: '18px', fontWeight: 'bold' }} />
                </VStack>
            }
            <InfoMessage
                alertProps={{ w: 'full', fontSize: '18px' }}
                description={<VStack w='full' alignItems="flex-start" lineHeight="1.5">
                    {
                        !escrow && <Text fontWeight="bold">
                            NB: This market has claimable rewards! You can choose the reward preferences after making a first deposit.
                        </Text>
                    }
                    <Text>
                        Staked cvxCRV can earn two groups of rewards: CRV+CVX or 3CRV, or a combination of both groups.
                    </Text>
                    <Text>
                        By default the weight of the 3CRV rewards are 0% and the weight of the CRV+CVX group reward is 100%.
                    </Text>
                    <Link href="https://docs.convexfinance.com/convexfinance/guides/depositing/crv" isExternal target="_blank">
                        Read more about how weights work.
                    </Link>
                </VStack>}
            />
        </VStack>
    </Container>
}