import { Interests } from '@inverse/types'
import { Text, Box, Flex, TextProps, Divider } from '@chakra-ui/react';
import { InfoTooltip } from '../common/Tooltip';
import { commify } from 'ethers/lib/utils';

const InterestDetails = (interests: Interests) => {
    return (
        <Box p="1" textAlign="left" minW="300">
            <Flex justify="space-between">Supply Interests : <InterestText value={interests.supplyUsdInterests} /></Flex>
            <Flex justify="space-between">Inv Rewards : <InterestText value={interests.invUsdInterests} /></Flex>
            <Flex justify="space-between">Borrow fees : <InterestText value={interests.borrowInterests} /></Flex>
            <Divider mt="1" mb="1" />
            <Flex justify="space-between">Total : <InterestText value={interests.total} /></Flex>
        </Box>
    )
}

const InterestText = ({ value, ...props }: { value: number } & Partial<TextProps>) => {
    return (
        <Text display="inline-block" fontWeight="bold" color={value === 0 ? undefined : value > 0 ? 'green.200' : 'red.200'} {...props}>
            {value > 0 ? '+' : ''}
            {commify(value?.toFixed(2) || 0)}
            $ a month
        </Text>
    )
}

export const AnchorInterests = (interests: Interests) => {
    return (
        <Flex ml="2" alignItems="center" >
            <InterestText fontSize="14" value={interests.total} mr="2" color="secondary" />
            <InfoTooltip iconProps={{ boxSize: 3, mt: '2px' }} tooltipProps={{ bgColor: 'blue.400' }} message={<InterestDetails {...interests} />} />
        </Flex>
    )
}