import { useBlockTimestamp } from '@app/hooks/useBlockTimestamp';
import { formatDate, formatDateWithTime, timeSince } from '@app/util/time';
import { Stack, Text, StackDirection, TextProps } from '@chakra-ui/react';
 ;

const defaultFormat = 'MMM Do YYYY';

export const BlockTimestamp = ({
    blockNumber,
    format = defaultFormat,
    showRelativeTime = true,
    showAbsoluteTime = true,
    direction = 'column',
    textProps,
    timestamp,
    ...props
}: {
    blockNumber: number,
    timestamp?: number,
    format?: string,
    showRelativeTime?: boolean,
    showAbsoluteTime?: boolean,
    textProps?: TextProps,
    direction?: StackDirection,
}) => {
    const { timestamp: _timestamp, isUsingEstimate } = useBlockTimestamp(blockNumber);
    const ts = timestamp || _timestamp;
    const isCol = direction!.indexOf('column') !== -1;

    return <Stack direction={direction} spacing={isCol ? '0' : '1'} {...props}>
        {
            ts > 0 ?
                <TimestampInfo isUsingEstimate={isUsingEstimate} isCol={isCol} timestamp={ts} format={format} textProps={textProps} />
                :
                <>
                    <Text {...textProps}>Fetching...</Text>
                    {!isCol && <Text {...textProps}>For</Text>}
                    <Text {...textProps}>BN {blockNumber}</Text>
                </>
        }
    </Stack>
}

export const TimestampInfo = ({
    timestamp,
    textProps,
    format,
    isCol = true,
    isUsingEstimate = false,
}: {
    timestamp: number
    textProps?: TextProps,
    format?: string,
    isCol?: boolean,
    isUsingEstimate?: boolean,
}) => {
    return <>
        <Text {...textProps}>{timeSince(timestamp)}</Text>
        {!isCol && <Text {...textProps}>-</Text>}
        <Text {...textProps}>{isUsingEstimate ? '~' : ''}{format ? formatDateWithTime(timestamp) : formatDate(timestamp)}</Text>
    </>
}