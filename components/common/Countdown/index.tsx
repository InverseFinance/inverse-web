import moment from 'moment'
import { Box, useInterval } from '@chakra-ui/react';
import { useState } from 'react';

const queued = Date.UTC(2022, 1, 2, 14);
const execution = Date.UTC(2022, 1, 4, 14);

const getText = () => {
    const now = Date.now()
    const duration = moment.duration(execution - now, "milliseconds");
    return `${duration.hours().toString().padStart(2, '0')}:${duration.minutes().toString().padStart(2, '0')}:${duration.seconds().toString().padStart(2, '0')}`
}

export const Countdown = () => {
    const [text, setText] = useState(getText());

    useInterval(() => {
        setText(getText());
    }, 1000);

    return (
        <Box>
            {text}
        </Box>
    )
}