import { Flex, Stack, Text, VStack, useDisclosure } from '@chakra-ui/react';
import { RTOKEN_CG_ID } from '@app/variables/tokens';
import { useAnchorPricesUsd, usePrices } from '@app/hooks/usePrices';
import { getNetworkConfigConstants } from '@app/util/networks';
import { shortenNumber } from '@app/util/markets';
import Container from '@app/components/common/Container';
import { useBonds } from '@app/hooks/useBonds';
import { AnimatedInfoTooltip } from '@app/components/common/Tooltip';
import { WarningMessage } from '@app/components/common/Messages';
import { BondSlide } from './BondSlide';
import { useState } from 'react';
import { BondListItem } from './BondListItem';

const { XINV } = getNetworkConfigConstants();

const LocalTooltip = ({ children }) => <AnimatedInfoTooltip
    iconProps={{ ml: '2', fontSize: '12px' }}
    message={<>{children}</>}
/>

export const BondForm = () => {
    const { prices: oraclePrices } = useAnchorPricesUsd();
    const { prices: cgPrices } = usePrices();
    const { bonds } = useBonds();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [selectedBondIndex, setSelectedBondIndex] = useState<number | null>(null);

    const invOraclePrice = oraclePrices && oraclePrices[XINV];
    const invCgPrice = cgPrices && cgPrices[RTOKEN_CG_ID]?.usd;

    const handleDetails = (bondIndex: number) => {
        setSelectedBondIndex(bondIndex);
        onOpen();
    }

    return (
        <Stack w='full' color="white">
            { selectedBondIndex !== null && <BondSlide handleDetails={handleDetails} isOpen={isOpen} onClose={onClose} bonds={bonds} bondIndex={selectedBondIndex} /> }
            <Container
                noPadding
                label="Protect yourself against Front-Running Bots"
                description="How to add Flashbot RPC"
                href="https://medium.com/alchemistcoin/how-to-add-flashbots-protect-rpc-to-your-metamask-3f1412a16787"
            >
                <WarningMessage alertProps={{ fontSize: '12px' }} description={
                    <>
                        Bots can try to take the INV discounts just before you do by analyzing the public mempool, to reduce the chances of being front-run by them we recommend to follow these steps:
                        <Text>- Use the Flashbot RPC</Text>
                        <Text>- Acquire LP tokens and Approve them in advance</Text>
                        <Text>- After a random amount of time Bond</Text>
                    </>
                } />
            </Container>

            <Container noPadding label="INV Market Price">
                <VStack w="full" justify="space-between">
                    <Text fontWeight="bold">
                        The Oracle Price is used for the bonding calculations, the coingecko price is only shown for convenience.
                    </Text>
                    <Flex w='full' pt="2" justify="space-between">
                        <Text>
                            Oracle Market Price: <b>{shortenNumber(invOraclePrice, 2, true)}</b>
                        </Text>
                        <Text>
                            Coingecko Market Price: <b>{shortenNumber(invCgPrice, 2, true)}</b>
                        </Text>
                    </Flex>
                </VStack>
            </Container>

            <Container
                noPadding
                label="Bonds"
                description="Get INV at a discount thanks to our partner Olympus Pro - Learn More about bonds"
                href="https://docs.inverse.finance/inverse-finance/providing-liquidity/olympus-pro-bonds"
            >
                <VStack w='full'>
                    <Stack direction="row" w='full' justify="space-between" fontWeight="bold">
                        <Flex w="200px" alignItems="center">
                            Asset to Bond With
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
                            ROI
                            <LocalTooltip>
                                A positive <b>Return On Investment</b> means you get INV at a
                                <Text display="inline-block" mx="1" fontWeight="bold" color="secondary">discount</Text>
                                compared to INV market price !
                            </LocalTooltip>
                        </Flex>
                        <Flex w='80px'></Flex>
                    </Stack>
                    {
                        bonds.map((bond, i) => {
                            return <BondListItem key={bond.bondContract} bond={bond} bondIndex={i} handleDetails={handleDetails} />
                        })
                    }
                </VStack>
            </Container>
        </Stack>
    )
}