import { Flex, Stack, Text, VStack, useDisclosure } from '@chakra-ui/react';
import { usePrices } from '@app/hooks/usePrices';
import Container from '@app/components/common/Container';
import { AnimatedInfoTooltip } from '@app/components/common/Tooltip';
import { InfoMessage } from '@app/components/common/Messages';
import { useState } from 'react';
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { useDualSpeedEffect } from '@app/hooks/useDualSpeedEffect';
import { useAccountBonds } from '@app/hooks/useBondsV2';
import { BondPurchaseItem } from './BondPurchaseItem';
import { BondRedeemSlide } from './BondRedeemSlide';

const LocalTooltip = ({ children }) => <AnimatedInfoTooltip
    iconProps={{ ml: '2', fontSize: '12px', display: { base: 'none', sm: 'inline-block' } }}
    message={<>{children}</>}
/>

export const BondsPurchased = () => {
    const { account } = useWeb3React<Web3Provider>();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [selectedBondIndex, setSelectedBondIndex] = useState<number | null>(null);
    const [isNotConnected, setIsNotConnected] = useState(false);
    // const { bonds } = useBondsV2();
    const { userBonds } = useAccountBonds(account);

    const handleDetails = (bondIndex: number) => {
        setSelectedBondIndex(bondIndex);
        onOpen();
    }

    useDualSpeedEffect(() => {
        setIsNotConnected(!account);
    }, [account], !account, 1000, 0);

    return (
        <Stack w='full' color="mainTextColor">
            {
                isNotConnected && <Container contentBgColor="gradient3" noPadding label="Wallet Not Connected">
                    <InfoMessage alertProps={{ w: 'full' }} description="Please connect your wallet" />
                </Container>
            }
            {selectedBondIndex !== null && <BondRedeemSlide handleDetails={handleDetails} isOpen={isOpen} onClose={onClose} userBonds={userBonds} bondIndex={selectedBondIndex} />}

            <Container
                noPadding
                contentProps={{ p: { base: '2', sm: '8' } }}
                label="My Bonds"
                contentBgColor="gradient3"
            
            >
                {
                    !userBonds?.length && !!account ?
                        <InfoMessage description="No active bonds" />
                        :
                        <VStack w='full' fontSize={{ base: '12px', sm: '20px' }}>
                            <Stack display={{ base: 'none', sm: 'inline-flex' }} direction="row" w='full' justify="space-between" fontWeight="bold">
                                <Flex w="180px" alignItems="center">
                                    <Text>
                                        Quote Token
                                    </Text>
                                    <LocalTooltip>
                                        This is the asset you give to get INV in exchange
                                    </LocalTooltip>
                                </Flex>
                                <Flex w="170px" alignItems="center">
                                    <Text>
                                        Purchase Date
                                    </Text>
                                    <LocalTooltip>
                                        Purchase Date
                                    </LocalTooltip>
                                </Flex>
                                <Flex w="150px" alignItems="center">
                                    <Text>
                                        Vesting Date
                                    </Text>
                                    <LocalTooltip>
                                        Date where the bond will be redeemable
                                    </LocalTooltip>
                                </Flex>
                                <Flex w="100px" alignItems="center" textAlign="left">
                                    Payout
                                    <LocalTooltip>
                                        Amount of INV to receive
                                    </LocalTooltip>
                                </Flex>
                                
                                <Flex w='80px'></Flex>
                            </Stack>
                            {
                                userBonds?.map((bond, i) => {
                                    return <BondPurchaseItem key={bond.id} bond={bond} bondIndex={i} handleDetails={handleDetails} />
                                })
                            }
                        </VStack>
                }
            </Container>
        </Stack>
    )
}