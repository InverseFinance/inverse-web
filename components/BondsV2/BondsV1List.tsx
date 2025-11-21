import { Flex, Stack, Text, VStack, useDisclosure } from '@chakra-ui/react';
import Container from '@app/components/common/Container';
import { useBonds } from '@app/hooks/useBonds';
import { AnimatedInfoTooltip } from '@app/components/common/Tooltip';
import { InfoMessage } from '@app/components/common/Messages';
import { BondSlide } from '../Bonds/BondSlide';
import { useState } from 'react';
import { BondListItem } from '../Bonds/BondListItem';
import { useWeb3React } from '@app/util/wallet';
import { Web3Provider } from '@ethersproject/providers';

const LocalTooltip = ({ children }) => <AnimatedInfoTooltip
    iconProps={{ ml: '2', fontSize: '12px', display: { base: 'none', sm: 'inline-block' } }}
    message={<>{children}</>}
/>

export const BondsV1List = () => {
    const { account } = useWeb3React<Web3Provider>();
    const { bonds } = useBonds();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [selectedBondIndex, setSelectedBondIndex] = useState<number | null>(null);

    const handleDetails = (bondIndex: number) => {
        setSelectedBondIndex(bondIndex);
        onOpen();
    }

    const bondsPaused = bonds?.length > 0 && bonds?.reduce((prev, curr) => prev + curr.maxPayout, 0) === 0;

    return <>
        {selectedBondIndex !== null && <BondSlide handleDetails={handleDetails} isOpen={isOpen} onClose={onClose} bonds={bonds} bondIndex={selectedBondIndex} />}<Container
            noPadding
            contentProps={{ p: { base: '2', sm: '8' } }}
            label="Available Bonds - V1 linear vesting"
            contentBgColor="gradient3"
            description="Get INV at a discount via Olympus Pro  - Learn More about bonds here"
            href="https://docs.inverse.finance/inverse-finance/providing-liquidity/olympus-pro-bonds"
        >
            {
                bondsPaused && !!account ?
                    <InfoMessage description="Bonds V1 are paused at the moment" />
                    :
                    <VStack w='full' fontSize={{ base: '12px', sm: '20px' }}>
                        <Stack display={{ base: 'none', sm: 'inline-flex' }} direction="row" w='full' justify="space-between" fontWeight="bold">
                            <Flex w="240px" alignItems="center">
                                <Text>
                                    Quote Token
                                </Text>
                                <LocalTooltip>
                                    This is the asset you give to get INV in exchange
                                </LocalTooltip>
                            </Flex>
                            <Flex w="80px" alignItems="center" textAlign="left">
                                Price
                                <LocalTooltip>
                                    If the Bond Price is lower than INV's market price then there is a positive ROI allowing you to get INV at a discount
                                </LocalTooltip>
                            </Flex>
                            <Flex w="80px" justify="flex-end" alignItems="center">
                                ROI*
                                <LocalTooltip>
                                    A <b>positive Return On Investment</b> means you get INV at a
                                    <Text display="inline-block" mx="1" fontWeight="bold" color="secondary">discount</Text>
                                    compared to the <b>current</b> INV market price !
                                    <Text mt="2">
                                        ROI can turn negative when bond demand is too high
                                    </Text>
                                    <Text mt="2">
                                        <b>The ROI is not guaranteed</b>, it's an estimation with the current market prices, the end result will depend on how the market moves until the vesting period is over
                                    </Text>
                                </LocalTooltip>
                            </Flex>
                            <Flex w='80px'></Flex>
                        </Stack>
                        {
                            !!account ? bonds.map((bond, i) => {
                                return <BondListItem key={bond.bondContract} bond={bond} bondIndex={i} handleDetails={handleDetails} />
                            })
                            : <InfoMessage alertProps={{ w: 'full', fontSize: '12px' }} description="Please connect to see v1 bonds" />
                        }
                    </VStack>
            }
        </Container>
    </>
}