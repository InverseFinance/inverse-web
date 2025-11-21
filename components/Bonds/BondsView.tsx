import { Flex, Stack, Text, VStack, useDisclosure, Box } from '@chakra-ui/react';
import { RTOKEN_CG_ID } from '@app/variables/tokens';
import { usePrices } from '@app/hooks/usePrices';
import { shortenNumber } from '@app/util/markets';
import Container from '@app/components/common/Container';
import { useBonds } from '@app/hooks/useBonds';
import { AnimatedInfoTooltip } from '@app/components/common/Tooltip';
import { InfoMessage, WarningMessage } from '@app/components/common/Messages';
import { BondSlide } from './BondSlide';
import { useState } from 'react';
import { BondListItem } from './BondListItem';
import { useWeb3React } from '@app/util/wallet';
import { Web3Provider } from '@ethersproject/providers';
import { useDualSpeedEffect } from '@app/hooks/useDualSpeedEffect';
import Link from '@app/components/common/Link';

const LocalTooltip = ({ children }) => <AnimatedInfoTooltip
    iconProps={{ ml: '2', fontSize: '12px', display: { base: 'none', sm: 'inline-block' } }}
    message={<>{children}</>}
/>

export const BondsView = () => {
    const { account } = useWeb3React<Web3Provider>();
    const { prices: cgPrices } = usePrices();
    const { bonds } = useBonds();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [selectedBondIndex, setSelectedBondIndex] = useState<number | null>(null);
    const [isNotConnected, setIsNotConnected] = useState(false);

    const invCgPrice = cgPrices && cgPrices[RTOKEN_CG_ID]?.usd;

    const handleDetails = (bondIndex: number) => {
        setSelectedBondIndex(bondIndex);
        onOpen();
    }

    useDualSpeedEffect(() => {
        setIsNotConnected(!account);
    }, [account], !account, 1000, 0);

    const bondsPaused = bonds?.length > 0 && bonds?.reduce((prev, curr) => prev + curr.maxPayout, 0) === 0;

    return (
        <Stack w='full' color="mainTextColor">
            {
                isNotConnected && <Container contentBgColor="gradient3" noPadding label="Wallet Not Connected">
                    <InfoMessage alertProps={{ w: 'full' }} description="Please connect your wallet" />
                </Container>
            }
            {selectedBondIndex !== null && <BondSlide handleDetails={handleDetails} isOpen={isOpen} onClose={onClose} bonds={bonds} bondIndex={selectedBondIndex} />}
            <Container contentProps={{ p: { base: '2', sm: '8' } }} noPadding label="Get INV at a discount thanks to Bonds!" contentBgColor="gradient3">
                <VStack fontSize={{ base: '12px', sm: '14px' }} w="full" justify="space-between">
                    <Text>
                        Bonds allow users to get <b>INV at a discount</b> in exchange for another asset with a <b>linear unlocking</b>. It's a win-win situation as this lets Inverse Finance increase its <b>Protocol Owned Liquidity</b> instead of renting out its liquidity which is very expensive.
                    </Text>
                    <Flex w='full' pt="2" justify="space-between">
                        <Flex direction={{ base: 'column', sm: 'row' }} alignItems="flex-start">
                            <Text mr="1">INV Market Price:</Text>
                            <Text fontWeight="extrabold">{invCgPrice ? shortenNumber(invCgPrice, 2, true) : '-'}</Text>
                        </Flex>
                        {/* <Flex direction={{ base: 'column', sm: 'row' }}>
                            <Text mr="1">Oracle Market Price:</Text>
                            <Text fontWeight="extrabold">{invOraclePrice ? shortenNumber(invOraclePrice, 2, true) : '-'}</Text>
                        </Flex> */}
                    </Flex>
                </VStack>
            </Container>

            <Container
                noPadding
                contentProps={{ p: { base: '2', sm: '8' } }}
                label="Available Bonds"
                contentBgColor="gradient3"
                description="Get INV at a discount via Olympus Pro  - Learn More about bonds here"
                href="https://docs.inverse.finance/inverse-finance/providing-liquidity/olympus-pro-bonds"
            >
                {
                    bondsPaused && !!account ?
                        <InfoMessage description="Bonds are paused at the moment" />
                        :
                        <VStack w='full' fontSize={{ base: '12px', sm: '20px' }}>
                            <Stack display={{ base: 'none', sm: 'inline-flex' }} direction="row" w='full' justify="space-between" fontWeight="bold">
                                <Flex w="240px" alignItems="center">
                                    <Text>
                                        Asset to Bond With
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
                                bonds.map((bond, i) => {
                                    return <BondListItem key={bond.bondContract} bond={bond} bondIndex={i} handleDetails={handleDetails} />
                                })
                            }
                        </VStack>
                }
            </Container>

            <Container
                contentProps={{ p: { base: '2', sm: '8' } }}
                noPadding
                contentBgColor="gradient3"
                label="Protect yourself against Front-running Bots"
                description="How to add Flashbot RPC"
                href="https://medium.com/alchemistcoin/how-to-add-flashbots-protect-rpc-to-your-metamask-3f1412a16787"
            >
                <WarningMessage alertProps={{ fontSize: '12px' }} description={
                    <>
                        Bots may attempt to take INV discounts just before you do by analyzing the public mempool, a type of "waiting area" for new Ethereum transactions. To reduce the chances of being front-run, we recommend following these steps:
                        <Flex>
                            <Text mr="1">- Use the</Text>
                            <Link textDecoration="underline" isExternal href="https://medium.com/alchemistcoin/how-to-add-flashbots-protect-rpc-to-your-metamask-3f1412a16787">
                                Flashbot RPC
                            </Link>
                        </Flex>
                        <Text>- Acquire LP tokens and Approve them in advance</Text>
                        <Text>- After approving the transaction, wait a random amount of time (e.g. 8 minutes) before completing your bond transaction</Text>
                    </>
                } />
            </Container>

            <Box px="6" w='full' pt="6">
                <InfoMessage
                    title="ROI*:"
                    alertProps={{ w: 'full' }}
                    description={<Text>
                        <b>The ROI is not guaranteed</b>, it's an estimation with the current market prices, the end result will depend on how the market moves until the vesting period is over
                    </Text>}
                />
            </Box>
        </Stack>
    )
}