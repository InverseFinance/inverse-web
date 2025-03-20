import { formatDate, formatDateWithTime, timeSince } from '@app/util/time';
import { Stack, StackDirection, StackProps, Text, TextProps } from '@chakra-ui/react'

const defaultFormat = 'MMM Do YYYY';

export const Timestamp = ({
    timestamp,
    format = defaultFormat,
    showRelativeTime = true,
    showAbsoluteTime = true,
    direction = 'column',
    text1Props,
    text2Props,
    ...props
}: {
    timestamp: number,
    format?: string,
    showRelativeTime?: boolean,
    showAbsoluteTime?: boolean,
    direction?: StackDirection,
    text1Props?: TextProps,
    text2Props?: TextProps,
} & Partial<StackProps>) => {
    const isCol = direction!.indexOf('column') !== -1;

    return (
        <Stack direction={direction} spacing={isCol ? '0' : '1'} {...props}>
            <Text {...text1Props}>{timeSince(timestamp)}</Text>
            {!isCol && <Text>-</Text>}
            <Text {...text2Props}>{format ? formatDateWithTime(timestamp) : formatDate(timestamp)}</Text>
        </Stack>
    )
}