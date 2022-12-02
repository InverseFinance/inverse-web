import { UserBondV2 } from '@app/types'
import { SlideModal } from '@app/components/common/Modal/SlideModal'
import { Divider, Flex, HStack, Text, VStack } from '@chakra-ui/react'
import { ArrowLeftIcon, ArrowRightIcon } from '@chakra-ui/icons'
import { MarketImage } from '@app/components/common/Assets/MarketImage'
import { BondV2Redeem } from './BondV2Redeem'
import { shortenNumber } from '@app/util/markets'

export const BondRedeemSlide = ({
    isOpen,
    onClose,
    userBonds,
    bondIndex,
    handleDetails
}: {
    isOpen: boolean,
    onClose: () => void,
    userBonds: UserBondV2[],
    bondIndex: number,
    handleDetails: (i: number) => void,
}) => {
    const bond = userBonds[bondIndex];

    return <SlideModal onClose={onClose} isOpen={isOpen}>
        <VStack maxH={{ base: 'calc(100vh - 80px)' }} w='full' position="relative" overflowY="auto" overflowX="hidden" fontSize={{ base: '12px', sm: '18px' }}>
            <VStack maxW="700px" w='full' spacing="4">
                <HStack fontSize={{ base: '18px', sm: '24px' }} fontWeight="extrabold">
                    {bondIndex !== 0 && <ArrowLeftIcon zIndex="10" cursor="pointer" onClick={() => handleDetails(bondIndex - 1)} position="absolute" left="0" />}
                    {
                        !!bond && <Flex>
                        {/* <LPImg leftSize={30} rightSize={20} rightDeltaX={-5} leftImg={bond.underlying.image} rightImg={invDarkBgImg} /> */}
                        <MarketImage size={30} image={bond.underlying.image} protocolImage={bond.underlying.protocolImage} />
                        <Text ml="2" textTransform="uppercase">
                            {bond.name} ({bond.vestingDays} days vesting)
                        </Text>
                    </Flex>
                    }
                    {bondIndex !== (userBonds.length - 1) && <ArrowRightIcon zIndex="10" cursor="pointer" onClick={() => handleDetails(bondIndex + 1)} position="absolute" right="0" />}
                </HStack>
                <Divider />
                {
                    bond?.supply === 0 && <Text>{shortenNumber(bond?.payout, 2)} INV Redeemed!</Text>
                }
                {
                    !!bond && bond.supply > 0 && <BondV2Redeem bond={bond} />
                }
            </VStack>
        </VStack>
    </SlideModal>
}