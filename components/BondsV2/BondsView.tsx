import { Flex, Stack, Text, VStack, useDisclosure, Box } from '@chakra-ui/react';
import { RTOKEN_CG_ID } from '@app/variables/tokens';
import { usePrices } from '@app/hooks/usePrices';
import { shortenNumber } from '@app/util/markets';
import Container from '@app/components/common/Container';
import { AnimatedInfoTooltip } from '@app/components/common/Tooltip';
import { InfoMessage, WarningMessage } from '@app/components/common/Messages';
import { BondSlide } from './BondSlide';
import { useState } from 'react';
import { BondListItem } from './BondListItem';
import { useWeb3React } from '@app/util/wallet';
import { Web3Provider } from '@ethersproject/providers';
import { useDualSpeedEffect } from '@app/hooks/useDualSpeedEffect';
import Link from '@app/components/common/Link';
import { useBondsV2 } from '@app/hooks/useBondsV2';
import { BondsV1List } from './BondsV1List';

const LocalTooltip = ({ children }) => <AnimatedInfoTooltip
    iconProps={{ ml: '2', fontSize: '12px', display: { base: 'none', sm: 'inline-block' } }}
    message={<>{children}</>}
/>

export const BondsView = () => {
    const { account } = useWeb3React<Web3Provider>();
    const { prices: cgPrices } = usePrices();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [selectedBondIndex, setSelectedBondIndex] = useState<number | null>(null);
    const [isNotConnected, setIsNotConnected] = useState(false);
    const { bonds } = useBondsV2();

    const invCgPrice = cgPrices && cgPrices[RTOKEN_CG_ID]?.usd;

    const handleDetails = (bondIndex: number) => {
        setSelectedBondIndex(bondIndex);
        onOpen();
    }

    useDualSpeedEffect(() => {
        setIsNotConnected(!account);
    }, [account], !account, 1000, 0);

    const activeBonds = bonds?.filter(b => b.isNotConcluded);
    const bondsPaused = activeBonds?.length === 0 || (activeBonds?.length > 0 && activeBonds?.reduce((prev, curr) => prev + curr.maxPayout, 0) === 0);

    return (
        <Stack w='full' color="mainTextColor">
            {
                isNotConnected && <Container contentBgColor="gradient3" noPadding label="Wallet Not Connected">
                    <InfoMessage alertProps={{ w: 'full' }} description="Please connect your wallet" />
                </Container>
            }
            {selectedBondIndex !== null && <BondSlide handleDetails={handleDetails} isOpen={isOpen} onClose={onClose} bonds={activeBonds} bondIndex={selectedBondIndex} />}
            <Container contentProps={{ p: { base: '2', sm: '8' } }} noPadding label="Get INV at a discount thanks to Bonds!" contentBgColor="gradient3">
                <VStack fontSize={{ base: '12px', sm: '14px' }} w="full" justify="space-between">
                    <Text>
                        Bonds allow users to get <b>INV at a discount</b> in exchange for another asset. It's a win-win situation as this lets Inverse Finance increase its <b>Protocol Owned Liquidity</b> instead of renting out its liquidity which is very expensive.
                    </Text>
                    <Flex w='full' pt="2" justify="space-between">
                        <Flex direction={{ base: 'column', sm: 'row' }} alignItems="flex-start">
                            <Text mr="1">INV Market Price:</Text>
                            <Text fontWeight="extrabold">{invCgPrice ? shortenNumber(invCgPrice, 2, true) : '-'}</Text>
                        </Flex>
                    </Flex>
                </VStack>
            </Container>

            <Container
                noPadding
                contentProps={{ p: { base: '2', sm: '8' } }}
                label="Available Bonds - V2"
                contentBgColor="gradient3"
                description="Get INV at a discount via Bond Protocol  - Learn More about bonds here"
                href="https://docs.bondprotocol.finance/basics/bonding"
            >
                {
                    bondsPaused && !!account ?
                        <InfoMessage description="Bonds V2 are paused at the moment" />
                        :
                        <VStack w='full' fontSize={{ base: '12px', sm: '20px' }}>
                            <Stack display={{ base: 'none', sm: 'inline-flex' }} direction="row" w='full' justify="space-between" fontWeight="bold">
                                <Flex w="200px" alignItems="center">
                                    <Text>
                                        Quote Token
                                    </Text>
                                    <LocalTooltip>
                                        This is the asset you give to get INV in exchange
                                    </LocalTooltip>
                                </Flex>
                                <Flex w="200px" alignItems="center">
                                    <Text>
                                        Available until
                                    </Text>
                                    <LocalTooltip>
                                        Date where the bond will not allow purchases anymore. Bond offer can end before if the remaining capacity reaches 0
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
                                activeBonds?.map((bond, i) => {
                                    return <BondListItem key={bond.bondContract} bond={bond} bondIndex={i} handleDetails={handleDetails} />
                                })
                            }
                        </VStack>
                }
            </Container>

            <BondsV1List />

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
                        Bots may attempt to take INV discounts just before you do by analyzing the public mempool, a type of "waiting area" for new Ethereum transactions. To reduce the chances of being front-run, we recommend using <Link display="inline-block" textDecoration="underline" isExternal href="https://medium.com/alchemistcoin/how-to-add-flashbots-protect-rpc-to-your-metamask-3f1412a16787">
                                Flashbot RPC
                            </Link>                        
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