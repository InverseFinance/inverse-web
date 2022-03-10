import { useBlockTimestamp } from '@app/hooks/useBlockTimestamp';
import { Stack, Text, StackDirection } from '@chakra-ui/react';
import moment from 'moment';

const defaultFormat = 'MMM Do YYYY';

export const BlockTimestamp = ({
    blockNumber,
    format = defaultFormat,
    showRelativeTime = true,
    showAbsoluteTime = true,
    direction = 'column',
    ...props
}: {
    blockNumber: number,
    format?: string,
    showRelativeTime?: boolean,
    showAbsoluteTime?: boolean,
    direction?: StackDirection,
}) => {
    const { timestamp } = useBlockTimestamp(blockNumber);
    const isCol = direction!.indexOf('column') !== -1;
    
    return <Stack direction={direction} spacing={ isCol ? '0' : '1' } {...props}>
        <Text>{moment(timestamp).fromNow()}</Text>
        { !isCol && <Text>-</Text> }
        <Text>{moment(timestamp).format(format)}</Text>
    </Stack>
}
