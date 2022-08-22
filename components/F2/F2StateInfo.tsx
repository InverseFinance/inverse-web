import { shortenNumber } from "@app/util/markets";
import { preciseCommify } from "@app/util/misc";
import { HStack, Text } from "@chakra-ui/react"
import moment from 'moment';

const formatValue = (value: number | null, precision = 2, type = 'number') => {
    switch (type) {
        case 'perc':
            return `${shortenNumber(value, precision, false, true)}%`;
        case 'remainingTime':
            return value !== null ? moment(value).fromNow(true) : ' no more loan';
        default:
            return preciseCommify(value, precision, type === 'dollar');
    }
}

export const F2StateInfo = ({
    currentValue,
    nextValue,
    precision = 2,
    placeholder = "",
    prefix = "",
    suffix = "",
    type = 'number',
}: {
    currentValue: number | null
    nextValue?: number | null
    precision?: number
    placeholder?: any
    prefix?: any
    suffix?: any
    type?: 'number' | 'remainingTime' | 'dollar' | 'perc'
}) => {
    const currentFormatted = formatValue(currentValue, precision, type);
    const nextFormatted = nextValue !== undefined ? formatValue(nextValue, precision, type) : '';
    return <HStack>
        {
            !currentValue && !nextValue ?
                placeholder :
                <Text color="secondaryTextColor">
                    {prefix}{currentFormatted}{!!nextFormatted && <b> => {nextFormatted}</b>}{suffix}
                </Text>
        }
    </HStack>
}