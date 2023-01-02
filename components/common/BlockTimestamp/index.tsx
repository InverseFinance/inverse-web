import { useBlockTimestamp } from '@app/hooks/useBlockTimestamp';
import { Stack, Text, StackDirection, TextProps } from '@chakra-ui/react';
import moment from 'moment';

const defaultFormat = 'MMM Do YYYY';

export const BlockTimestamp = ({
    blockNumber,
    format = defaultFormat,
    showRelativeTime = true,
    showAbsoluteTime = true,
    direction = 'column',
    textProps,
    ...props
}: {
    blockNumber: number,
    format?: string,
    showRelativeTime?: boolean,
    showAbsoluteTime?: boolean,
    textProps?: TextProps,
    direction?: StackDirection,
}) => {
    const { timestamp } = useBlockTimestamp(blockNumber);
    const isCol = direction!.indexOf('column') !== -1;

    return <Stack direction={direction} spacing={isCol ? '0' : '1'} {...props}>
        {
            timestamp > 0 ?
                <>
                    <Text {...textProps}>{moment(timestamp).fromNow()}</Text>
                    {!isCol && <Text {...textProps}>-</Text>}
                    <Text {...textProps}>{moment(timestamp).format(format)}</Text>
                </>
                :
                <>
                    <Text {...textProps}>Fetching...</Text>
                    {!isCol && <Text {...textProps}>For</Text>}
                    <Text {...textProps}>BN {blockNumber}</Text>
                </>
        }
    </Stack>
}
