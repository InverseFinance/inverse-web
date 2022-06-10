import { Interests } from '@app/types'
import { Text, Box, Flex, TextProps, Divider } from '@chakra-ui/react';
import { InfoTooltip } from '@app/components/common/Tooltip';
import { dollarify } from '@app/util/markets';
import { RTOKEN_SYMBOL } from '@app/variables/tokens';
import { HAS_REWARD_TOKEN } from '@app/config/constants';

const InterestDetails = (interests: Interests) => {
    const fixed2Total = parseFloat(interests.supplyUsdInterests.toFixed(2)) +
        + parseFloat(interests.invUsdInterests.toFixed(2))
        + parseFloat(interests.borrowInterests.toFixed(2));

    return (
        <Box p="1" textAlign="left" minW="300">
            <Flex justify="space-between">Supply interest: <InterestText value={interests.supplyUsdInterests} /></Flex>
            { HAS_REWARD_TOKEN && <Flex justify="space-between">{RTOKEN_SYMBOL} rewards: <InterestText value={interests.invUsdInterests} /></Flex> }
            <Flex justify="space-between">Borrowing interest: <InterestText value={interests.borrowInterests} /></Flex>
            <Divider mt="1" mb="1" borderColor="#cccccc22" />
            <Flex justify="space-between">Total: <InterestText value={fixed2Total} /></Flex>
        </Box>
    )
}

const InterestText = ({ value, ...props }: { value: number } & Partial<TextProps>) => {
    return (
        <Text display="inline-block" fontWeight="bold" color={value === 0 ? undefined : value > 0 ? 'success' : 'orange.400'} {...props}>
            {dollarify(value, 2, true)} a month
        </Text>
    )
}

export const AnchorInterests = ({ interests }: { interests: Interests }) => {
    return (
        <Flex alignItems="center">
            <InterestText fontSize="14" value={interests.total} mr="2" color={interests?.total > 0 ? 'secondary' : 'warning'} />
            <InfoTooltip
                iconProps={{ boxSize: 3, mt: '2px' }}
                tooltipProps={{
                    className: 'blurred-container info-bg',
                    borderColor: 'info'
                }}
                message={<InterestDetails {...interests} />}
            />
        </Flex>
    )
}