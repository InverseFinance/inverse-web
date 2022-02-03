import moment from 'moment'
import { Box, Text, useInterval, SlideFade } from '@chakra-ui/react';
import { useState } from 'react';
import { LaunchAnim } from '@app/components/common/Animation';

const queued = Date.UTC(2022, 1, 2, 14, 3);
const execution = Date.UTC(2022, 1, 4, 14, 3);
const countdownOverText = 'Launching'

const getText = () => {
    const now = Date.now()
    const delta = execution - now;
    if (delta <= 0) {
        return countdownOverText
    }
    const duration = moment.duration(delta, "milliseconds");
    const days = duration.days()
    return `${(24 * days + duration.hours()).toString().padStart(2, '0')}:${duration.minutes().toString().padStart(2, '0')}:${duration.seconds().toString().padStart(2, '0')}`
}

export const Countdown = () => {
    const [text, setText] = useState(getText());
    const [isOver, setIsOver] = useState(false)

    useInterval(() => {
        setIsOver(execution - Date.now() <= 0);
        setText(getText());
    }, 1000);

    return (
        <Box w="365px">
            <SlideFade
                transition={{
                    enter: { duration: 0 },
                    exit: { duration: 0.2 },
                }}
                in={!isOver}
                unmountOnExit={true}>
                Countdown to Inverse Plus
                <Text>{text}</Text>
            </SlideFade>
            <SlideFade
                transition={{
                    enter: { duration: 1 },
                    exit: { duration: 1 },
                }}
                in={isOver}
                unmountOnExit={true}>
                <LaunchAnim width={30} height={30} loop={true} />
                <Text fontSize="12px">INV+ is Launched</Text>
            </SlideFade>
        </Box>
    )
}