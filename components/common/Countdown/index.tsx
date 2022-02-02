import moment from 'moment'
import { Box, Text, useInterval } from '@chakra-ui/react';
import { useState } from 'react';

const queued = Date.UTC(2022, 1, 2, 14);
const execution = Date.UTC(2022, 1, 4, 14);

const getText = () => {
    const now = Date.now()
    const duration = moment.duration(execution - now, "milliseconds");
    const days = duration.days()
    return `${(24 * days + duration.hours()).toString().padStart(2, '0')}:${duration.minutes().toString().padStart(2, '0')}:${duration.seconds().toString().padStart(2, '0')}`
}

export const Countdown = () => {
    const [text, setText] = useState(getText());

    useInterval(() => {
        setText(getText());
    }, 1000);

    return (
        <Box w="365px">
            Countdown to Inverse Plus
            <Text>{text}</Text>
        </Box>
    )
}