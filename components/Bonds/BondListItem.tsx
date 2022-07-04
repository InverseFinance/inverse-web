import { Bond } from '@app/types';
import { shortenNumber } from '@app/util/markets';
import { Stack, Flex, Text, VStack } from '@chakra-ui/react';
import { UnderlyingItemBlock } from '@app/components/common/Assets/UnderlyingItemBlock';
import { SubmitButton } from '@app/components/common/Button';
import { NotifBadge } from '@app/components/common/NotifBadge';
import { TimeIcon } from '@chakra-ui/icons';

const formatBondPrice = (bondPrice: number) => {
    return shortenNumber(bondPrice, 2, true);
}

const formatROI = (roi: number) => {
    return `${shortenNumber(roi, 2, false)}%`;
}

export const BondListItem = ({ bond, bondIndex, handleDetails }: { bond: Bond, bondIndex: number, handleDetails: (i: number) => void }) => {

    return (
        <Stack borderTop={`1px solid #cccccc33`} pt="2" direction="row" key={bond.input} w='full' justify="space-between" fontWeight="bold">
            <Flex w="240px" alignItems="center" position="relative">
                {/* <Link textTransform="uppercase" textDecoration="none" isExternal href={bond.howToGetLink}> */}
                    <VStack alignItems="flex-start" textTransform="uppercase">
                        <UnderlyingItemBlock symbol={bond.underlying.symbol!} nameAttribute="name" imgSize={'18px'} imgProps={{ mr: '2' }} />
                        <Text maxW="80px" fontSize={{ base: '10px', sm: "14px" }} color="secondaryTextColor">{bond.vestingDays} days vesting</Text>
                    </VStack>
                {/* </Link> */}
            </Flex>
            <Flex w="80px" alignItems="center">
                {bond.usdPrice ? formatBondPrice(bond.usdPrice) : '-'}
            </Flex>
            <Flex w="80px" justify="flex-end" alignItems="center" color={bond.roi === 0 || isNaN(bond.roi) ? 'mainTextColor' : bond.positiveRoi ? 'secondary' : 'error'}>
                {bond.roi ? formatROI(bond.roi) : '-'}
            </Flex>
            <Flex w='80px' position="relative" alignItems="center">
                <SubmitButton w='full' onClick={() => handleDetails(bondIndex)}>
                    {bond.userInfos.percentVestedFor > 0 ? 'Details' : 'Bond'}
                </SubmitButton>
                {
                    bond.userInfos.percentVestedFor > 0 && <NotifBadge display="flex" alignItems="center" fontSize="10px">
                        <TimeIcon mr="1" /> {shortenNumber(bond.userInfos.percentVestedFor, 2)}%
                    </NotifBadge>
                }
            </Flex>
        </Stack>
    )
}