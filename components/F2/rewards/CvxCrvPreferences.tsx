import Container from "@app/components/common/Container";
import Link from "@app/components/common/Link";
import { InfoMessage } from "@app/components/common/Messages";
import { getBnToNumber, shortenNumber } from "@app/util/markets";
import { VStack, Text, Slider, SliderTrack, SliderFilledTrack, SliderThumb, HStack, Divider, Stack, useMediaQuery } from "@chakra-ui/react"
import { useState, useContext, useEffect } from "react";
import { PercentagesBar } from "../forms/PercentagesOfMax";
import { RSubmitButton } from "@app/components/common/Button/RSubmitButton";
import { F2MarketContext } from "../F2Contex";
import { setRewardWeight } from "@app/util/firm-extra";
import useEtherSWR from "@app/hooks/useEtherSWR";

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

const useCvxCrvRewards = (escrow: string) => {
    const { data, error } = useEtherSWR({
        args: [
            [cvxCRVStakingAddress, 'userRewardWeight', escrow],
        ],
        abi: [
            'function userRewardWeight(address) public view returns (uint)',
        ],
    });

    return {
        userRewardWeight: data ? getBnToNumber(data[0], 2) : null,
        isLoading: !error && !data,
        error,
    }
}

export const CvxCrvPreferences = () => {
    const { escrow, signer } = useContext(F2MarketContext);
    const [perc, setPerc] = useState<number | null>(null);
    const [defaultPerc, setDefaultPerc] = useState<number | null>(null);
    const { userRewardWeight } = useCvxCrvRewards(escrow);
    const [isLargerThan] = useMediaQuery('(min-width: 400px)');

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

    return <Stack w='full' direction={{ base: 'column', md: 'row' }}>
        <Container label='Rewards Preferences' collapsable={true} defaultCollapse={true} noPadding p='0'>
            <Stack direction={{ base: 'column', md: 'row' }} spacing="8" w='full' alignItems="center" p="2">
                <InfoMessage
                    alertProps={{ w: 'full', fontSize: '16px' }}
                    description={<VStack w='full' alignItems="flex-start" lineHeight="1.5">
                        {
                            !escrow && <Text fontWeight="bold">
                                NB: You can choose the reward preferences after making a deposit.
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
                {
                    <VStack w='full' spacing="4" maxW='900px' alignItems="center">
                        <HStack fontSize="17px" fontWeight="bold" w='full' justify="space-between">
                            <Stack direction={{ base: 'column-reverse', sm: 'row' }} alignItems='center'>                                
                                <Text><b>Gov</b> token rewards</Text>
                                <Text color="accentTextColor" fontSize="18px" fontWeight="1000">{shortenNumber(100 - perc, 0)}%</Text>
                            </Stack>                           
                            <Stack direction={{ base: 'column', sm: 'row' }} alignItems='center' justify="flex-end">
                                <Text color="accentTextColor" fontSize="18px" fontWeight="1000">{shortenNumber(perc, 0)}%</Text>
                                <Text align='right'><b>Stablecoin</b> rewards</Text>
                            </Stack>
                        </HStack>
                        <CvxCrvWeightBar perc={perc} onChange={setPerc} />
                        <PercentagesBar
                            leftLabel={isLargerThan ? '100% Crv & Cvx': ''}
                            rightLabel={isLargerThan ? '100% 3crv' : ''}
                            ticks={[0, 50, 100]}
                            showAsRepartition={false}
                            onChange={setPerc}
                            tickProps={{
                                fontSize: '18px',
                                fontWeight: 'bold',
                                textDecoration: 'underline',
                                style: { 'text-decoration-skip-ink': 'none' }
                            }}
                        />
                        <RSubmitButton
                            boxShadow="none"
                            outline="none"
                            border="none"
                            disabled={!hasChanged}
                            maxW="300px"                            
                            onClick={handleRewardsRepartitionUpdate}
                        >
                            Update Rewards Repartition
                        </RSubmitButton>
                    </VStack>
                }
            </Stack>
        </Container>
    </Stack>
}