import Container from "@app/components/common/Container";
import Link from "@app/components/common/Link";
import { InfoMessage } from "@app/components/common/Messages";
import { getBnToNumber, shortenNumber } from "@app/util/markets";
import { VStack, Text, Slider, SliderTrack, SliderFilledTrack, SliderThumb, HStack } from "@chakra-ui/react"
import { useState, useContext, useEffect } from "react";
import { PercentagesBar } from "../forms/PercentagesOfMax";
import { RSubmitButton } from "@app/components/common/Button/RSubmitButton";
import { F2MarketContext } from "../F2Contex";
import { claim, setRewardWeight } from "@app/util/firm-extra";
import useEtherSWR from "@app/hooks/useEtherSWR";
import { F2_ESCROW_ABI } from "@app/config/abis";
import { BigNumber, Contract } from "ethers";
import useSWR from "swr";

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
            step={1}
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

const useCvxCrvRewards = (escrow = '0x5a78917b84d3946f7e093ad4d9944fffffb451a9', signer) => {
    const { data, error } = useEtherSWR({
        args: [
            [cvxCRVStakingAddress, 'userRewardWeight', escrow],
            // there's two reward groups for cvxCrv
            [cvxCRVStakingAddress, 'userRewardBalance', escrow, 0],
            [cvxCRVStakingAddress, 'userRewardBalance', escrow, 1],
            [cvxCRVStakingAddress, 'rewards', 0],
            [cvxCRVStakingAddress, 'rewards', 1],
            [cvxCRVStakingAddress, 'rewards', 2],
            [cvxCRVStakingAddress, 'rewardSupply', 0],
            [cvxCRVStakingAddress, 'rewardSupply', 1],
            [cvxCRVStakingAddress, 'totalSupply'],
            ['0xD533a949740bb3306d119CC777fa900bA034cd52', 'balanceOf', cvxCRVStakingAddress],
        ],
        abi: [
            'function userRewardWeight(address) public view returns (uint)',
            'function userRewardBalance(address, uint) public view returns (uint)',
            'function rewards(uint) public view returns (tuple(address, uint, uint, uint))',
            'function rewardSupply(uint) public view returns (uint)',
            'function totalSupply() public view returns (uint)',
            'function balanceOf(address) public view returns (uint)',
        ],
    });

    // console.log(error)

    return {
        userRewardWeight: data ? getBnToNumber(data[0], 2) : null,
        group1Rewards: data ? getBnToNumber(data[1]) : 0,
        group2Rewards: data ? getBnToNumber(data[2]) : 0,
        rewards1: data ? data[3] : ['0xD533a949740bb3306d119CC777fa900bA034cd52', BigNumber.from('0'), BigNumber.from('0'), BigNumber.from('0')],
        rewards2: data ? data[4] : ['0x4e3FBD56CD56c3e72c1403e103b45Db9da5B9D2B', BigNumber.from('0'), BigNumber.from('0'), BigNumber.from('0')],
        rewards3: data ? data[5] : ['0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490', BigNumber.from('0'), BigNumber.from('0'), BigNumber.from('0')],
        group1Supply: data ? getBnToNumber(data[6]) : 0,
        group2Supply: data ? getBnToNumber(data[7]) : 0,
        totalSupply: data ? getBnToNumber(data[8]) : 0,
        reward1Balance: data ? getBnToNumber(data[9]) : 0,
        isLoading: !error && !data,
        error,
    }
}

export const CvxCrvRewards = () => {
    const { escrow, signer } = useContext(F2MarketContext);
    const [perc, setPerc] = useState<number | null>(null);
    const [defaultPerc, setDefaultPerc] = useState<number | null>(null);
    const { userRewardWeight, totalSupply, reward1Balance, group1Rewards, group2Rewards, rewards1, rewards2, rewards3, group1Supply, group2Supply } = useCvxCrvRewards(escrow, signer);

    // console.log('--');
    // console.log(group1Rewards);
    // console.log(group2Rewards);
    // console.log(rewards1);    
    // console.log(rewards2);
    // console.log(rewards3);
    // console.log(group1Supply);
    // console.log(group2Supply);
    // console.log('==');
    // const reward1 = { integral: getBnToNumber(rewards1[2]), remaining: getBnToNumber(rewards1[3]) };    
    // console.log(reward1)
    // console.log('totalSupply')
    // console.log(totalSupply)
    // console.log(reward1Balance)

    useEffect(() => {
        if (userRewardWeight === null) { return }
        setDefaultPerc(userRewardWeight);
        if (perc === null) {
            setPerc(userRewardWeight);
        }
    }, [userRewardWeight]);

    const hasChanged = perc !== defaultPerc;

    const handleRewardsRepartitionUpdate = async () => {
        if (!escrow || !hasChanged || !signer) { return }
        return setRewardWeight(escrow, perc * 100, signer);
    }

    const handleClaim = async () => {
        return claim(escrow, signer);
    }

    return <Container label="Rewards Preferences" noPadding p='0'>
        <VStack spacing="8" w='full' alignItems="flex-start" p="2">
            {
                <VStack w='full' spacing="4">
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
                    <HStack justify="flex-start" w='full' pt='4'>
                        <HStack>
                            <Text>Rewards:</Text>
                            <Text>$</Text>
                        </HStack>
                        <RSubmitButton onClick={handleClaim} w='fit-content' fontSize='16px'>
                            Claim
                        </RSubmitButton>
                    </HStack>
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