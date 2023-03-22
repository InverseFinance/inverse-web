import Container from "@app/components/common/Container";
import Link from "@app/components/common/Link";
import { InfoMessage } from "@app/components/common/Messages";
import { shortenNumber } from "@app/util/markets";
import { VStack, Text, Slider, SliderTrack, SliderFilledTrack, SliderThumb, HStack } from "@chakra-ui/react"
import { useState } from "react";
import { PercentagesBar } from "../forms/PercentagesOfMax";

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
            defaultValue={perc}
        >
            <SliderTrack h="15px" bg='mainTextColor'>
                <SliderFilledTrack bg={'info'} />
            </SliderTrack>
            <SliderThumb h="30px" bg="info" />
        </Slider>
    </VStack>
}

export const CvxCrvRewards = () => {
    const [perc, setPerc] = useState(0);

    return <Container label="cvxCRV Rewards Preferences" noPadding p='0'>
        <VStack spacing="8" w='full' alignItems="flex-start" p="2">            
            <VStack w='full' spacing="4">
                <HStack fontSize="20px" fontWeight="bold" w='full' justify="space-between">
                    <HStack w='33%'>
                        <Text>CVX+CRV rewards:</Text>
                        <Text color="accentTextColor" fontSize="26px" fontWeight="1000">{shortenNumber(100 - perc, 0)}%</Text>
                    </HStack>
                    <Text textAlign="center" w='33%' fontSize="28px" fontWeight="bold">
                        Rewards Repartition
                    </Text>
                    <HStack w='33%' justify="flex-end">
                        <Text>3CRV stablecoin rewards:</Text>
                        <Text color="accentTextColor" fontSize="26px" fontWeight="1000">{shortenNumber(perc, 0)}%</Text>
                    </HStack>
                </HStack>
                <CvxCrvWeightBar perc={perc} onChange={setPerc} />
                <PercentagesBar showAsRepartition={true} onChange={setPerc} tickProps={{ fontSize: '18px', fontWeight: 'bold' }}  />
            </VStack>
            <InfoMessage
                alertProps={{ w: 'full', fontWeight: 'bold', fontSize: '18px' }}
                description={<VStack w='full' alignItems="flex-start">
                    <Text>
                        Staked cvxCRV can earn two group of rewards: CRV+CVX or 3CRV, or a combination of both groups.
                    </Text>
                    <Text>
                        By default the weight of 3CRV rewards are 0% and 100% in the CRV+CVX group.
                    </Text>
                    <Link href="https://docs.convexfinance.com/convexfinance/guides/depositing/crv" isExternal target="_blank">
                        Read more about how weights work.
                    </Link>
                </VStack>}
            />
        </VStack>
    </Container>
}