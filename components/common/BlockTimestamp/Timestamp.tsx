import { Stack, StackDirection, StackProps, Text } from '@chakra-ui/react'
import moment from 'moment';

const defaultFormat = 'MMM Do YYYY';

export const Timestamp = ({
    timestamp,
    format = defaultFormat,
    showRelativeTime = true,
    showAbsoluteTime = true,
    direction = 'column',
    ...props
}: {
    timestamp: number,
    format?: string,
    showRelativeTime?: boolean,
    showAbsoluteTime?: boolean,
    direction?: StackDirection,
} & Partial<StackProps>) => {
    const isCol = direction!.indexOf('column') !== -1;

    return (
        <Stack direction={direction} spacing={isCol ? '0' : '1'} {...props}>
            <Text>{moment(timestamp).fromNow()}</Text>
            {!isCol && <Text>-</Text>}
            <Text>{moment(timestamp).format(format)}</Text>
        </Stack>
    )
}